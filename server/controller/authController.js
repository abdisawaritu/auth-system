import bcrypt from "bcrypt";
import pool from "../config/db.js";

export const registerUser = async (req, res) => {
  try {
    const { name, email, password } = req.body ?? {};

    // 1. Validate required fields and types
    if (
      typeof name !== "string" ||
      typeof email !== "string" ||
      typeof password !== "string"
    ) {
      return res.status(400).json({
        success: false,
        message: "Name, email, and password are required.",
      });
    }

    // 2. Normalize name and email
    const trimmedName = name.trim();
    const normalizedEmail = email.trim().toLowerCase();

    // 3. Validate name
    if (trimmedName.length < 2 || trimmedName.length > 100) {
      return res.status(400).json({
        success: false,
        message: "Name must be between 2 and 100 characters.",
      });
    }

    // 4. Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (normalizedEmail.length > 255 || !emailRegex.test(normalizedEmail)) {
      return res.status(400).json({
        success: false,
        message: "Please provide a valid email address.",
      });
    }

    // 5. Validate password
    // bcrypt only processes up to 72 bytes of password input.
    const passwordBytes = Buffer.byteLength(password, "utf8");

    if (password.length < 8 || passwordBytes > 72) {
      return res.status(400).json({
        success: false,
        message:
          "Password must be at least 8 characters and no more than 72 bytes.",
      });
    }

    // 6. Check whether the email already exists
    const [existingUsers] = await pool.execute(
      "SELECT id FROM users WHERE email = ? LIMIT 1",
      [normalizedEmail],
    );

    if (existingUsers.length > 0) {
      return res.status(409).json({
        success: false,
        message: "An account with this email already exists.",
      });
    }

    // 7. Hash the password
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // 8. Insert the user into MySQL
    const [result] = await pool.execute(
      `INSERT INTO users (name, email, password_hash)
       VALUES (?, ?, ?)`,
      [trimmedName, normalizedEmail, passwordHash],
    );

    // 9. Return a safe response
    return res.status(201).json({
      success: true,
      message: "User registered successfully.",
      user: {
        id: result.insertId,
        name: trimmedName,
        email: normalizedEmail,
        role: "user",
        is_email_verified: false,
      },
    });
  } catch (error) {
    // Handle a duplicate email caused by concurrent requests
    if (error.code === "ER_DUP_ENTRY") {
      return res.status(409).json({
        success: false,
        message: "An account with this email already exists.",
      });
    }

    console.error("Registration error:", error.message);

    return res.status(500).json({
      success: false,
      message: "An unexpected error occurred during registration.",
    });
  }
};
export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body ?? {};

    // 1. Validate required fields.
    if (
      typeof email !== "string" ||
      typeof password !== "string" ||
      !email.trim() ||
      !password
    ) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required.",
      });
    }

    // 2. Normalize the email.
    const normalizedEmail = email.trim().toLowerCase();

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (normalizedEmail.length > 255 || !emailRegex.test(normalizedEmail)) {
      return res.status(400).json({
        success: false,
        message: "Please provide a valid email address.",
      });
    }

    // 3. Find the user in MySQL.
    const [users] = await pool.execute(
      `SELECT
         id,
         name,
         email,
         password_hash,
         role,
         is_email_verified
       FROM users
       WHERE email = ?
       LIMIT 1`,
      [normalizedEmail],
    );

    // Use the same response for unknown email and wrong password.
    if (users.length === 0) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password.",
      });
    }

    const user = users[0];

    // 4. Enforce the bcrypt byte limit.
    if (Buffer.byteLength(password, "utf8") > 72) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password.",
      });
    }

    // 5. Compare the submitted password with the stored hash.
    const passwordMatches = await bcrypt.compare(password, user.password_hash);

    if (!passwordMatches) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password.",
      });
    }

    // 6. Regenerate the session ID after authentication.
    await new Promise((resolve, reject) => {
      req.session.regenerate((error) => {
        if (error) {
          reject(error);
        } else {
          resolve();
        }
      });
    });

    // Store only the information needed for authentication.
    req.session.user = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    };

    // 7. Save the session before sending the response.
    await new Promise((resolve, reject) => {
      req.session.save((error) => {
        if (error) {
          reject(error);
        } else {
          resolve();
        }
      });
    });

    // 8. Return public user information.
    return res.status(200).json({
      success: true,
      message: "Login successful.",
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        is_email_verified: Boolean(user.is_email_verified),
      },
    });
  } catch (error) {
    console.error("Login error:", error.message);

    return res.status(500).json({
      success: false,
      message: "An unexpected error occurred during login.",
    });
  }
};


export const getCurrentUser = async (req, res) => {
  try {
    // Get the authenticated user's ID from the session.
    const userId = req.session.user.id;

    // Retrieve the latest public user information from MySQL.
    const [users] = await pool.execute(
      `SELECT
         id,
         name,
         email,
         role,
         is_email_verified
       FROM users
       WHERE id = ?
       LIMIT 1`,
      [userId],
    );

    // The account may have been deleted after login.
    if (users.length === 0) {
      await new Promise((resolve) => {
        req.session.destroy(() => resolve());
      });

      res.clearCookie("auth.sid", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
      });

      return res.status(401).json({
        success: false,
        message: "Your account could not be found. Please log in again.",
      });
    }

    const user = users[0];

    // Return public user information only.
    return res.status(200).json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        is_email_verified: Boolean(user.is_email_verified),
      },
    });
  } catch (error) {
    console.error("Get current user error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to retrieve the current user.",
    });
  }
};

export const logoutUser = (req, res) => {
  // Destroy the server-side session.
  req.session.destroy((error) => {
    if (error) {
      console.error("Logout error:", error.message);

      return res.status(500).json({
        success: false,
        message: "Unable to log out. Please try again.",
      });
    }

    // Clear the session cookie from the client.
    res.clearCookie("auth.sid", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
    });

    return res.status(200).json({
      success: true,
      message: "Logout successful.",
    });
  });
};


