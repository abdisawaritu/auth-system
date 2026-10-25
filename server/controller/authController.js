import bcrypt from "bcrypt";
import crypto from "node:crypto";
import pool from "../config/db.js";
import { sendVerificationEmail, sendPasswordResetEmail } from "../config/mailer.js";


// Verification links expire after 30 minutes.
const VERIFICATION_TOKEN_LIFETIME_MS = 30 * 60 * 1000;

// Generate a secure random token.
// Send the original token by email, but store only its SHA-256 hash.
function generateVerificationToken() {
  const token = crypto.randomBytes(32).toString("hex");

  return {
    token,
    tokenHash: crypto.createHash("sha256").update(token).digest("hex"),
  };
}
const PASSWORD_RESET_TOKEN_LIFETIME_MS = 30 * 60 * 1000;

function generatePasswordResetToken() {
  const token = crypto.randomBytes(32).toString("hex");

  const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

  return { token, tokenHash };
}

async function createPasswordResetToken(userId) {
  const { token, tokenHash } = generatePasswordResetToken();

  const expiresAt = new Date(Date.now() + PASSWORD_RESET_TOKEN_LIFETIME_MS);

  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    // Invalidate any previous unused reset tokens.
    await connection.execute(
      `UPDATE password_reset_tokens
       SET used_at = NOW()
       WHERE user_id = ? AND used_at IS NULL`,
      [userId],
    );

    await connection.execute(
      `INSERT INTO password_reset_tokens
       (user_id, token_hash, expires_at)
       VALUES (?, ?, ?)`,
      [userId, tokenHash, expiresAt],
    );

    await connection.commit();

    return token;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

function normalizeEmail(email) {
  return email.trim().toLowerCase();
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// Create and store a new verification token.
async function createVerificationToken(userId) {
  const { token, tokenHash } = generateVerificationToken();

  const expiresAt = new Date(Date.now() + VERIFICATION_TOKEN_LIFETIME_MS);

  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    // Invalidate previous unused tokens for this user.
    await connection.execute(
      `UPDATE email_verification_tokens
       SET used_at = NOW()
       WHERE user_id = ? AND used_at IS NULL`,
      [userId],
    );

    await connection.execute(
      `INSERT INTO email_verification_tokens
         (user_id, token_hash, expires_at)
       VALUES (?, ?, ?)`,
      [userId, tokenHash, expiresAt],
    );

    await connection.commit();

    return token;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

// PHASE 4 + PHASE 8: Register a new user and send verification email.
export const registerUser = async (req, res) => {
  try {
    const { name, email, password } = req.body ?? {};

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

    const cleanName = name.trim();
    const cleanEmail = normalizeEmail(email);

    if (cleanName.length < 2 || cleanName.length > 100) {
      return res.status(400).json({
        success: false,
        message: "Name must be between 2 and 100 characters.",
      });
    }

    if (cleanEmail.length > 255 || !isValidEmail(cleanEmail)) {
      return res.status(400).json({
        success: false,
        message: "Please provide a valid email address.",
      });
    }

    if (password.length < 8 || Buffer.byteLength(password, "utf8") > 72) {
      return res.status(400).json({
        success: false,
        message:
          "Password must be at least 8 characters and no more than 72 bytes.",
      });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const connection = await pool.getConnection();

    let userId;

    try {
      await connection.beginTransaction();

      const [existingUsers] = await connection.execute(
        "SELECT id FROM users WHERE email = ? LIMIT 1",
        [cleanEmail],
      );

      if (existingUsers.length > 0) {
        await connection.rollback();

        return res.status(409).json({
          success: false,
          message: "An account with this email already exists.",
        });
      }

      const [result] = await connection.execute(
        `INSERT INTO users (name, email, password_hash)
         VALUES (?, ?, ?)`,
        [cleanName, cleanEmail, passwordHash],
      );

      userId = result.insertId;

      // The database default keeps is_email_verified = FALSE.
      await connection.commit();
    } catch (error) {
      await connection.rollback();

      if (error.code === "ER_DUP_ENTRY") {
        return res.status(409).json({
          success: false,
          message: "An account with this email already exists.",
        });
      }

      throw error;
    } finally {
      connection.release();
    }

    // Create token and send email after the account is committed.
    try {
      const token = await createVerificationToken(userId);

      await sendVerificationEmail({
        email: cleanEmail,
        name: cleanName,
        token,
      });

      return res.status(201).json({
        success: true,
        message:
          "Account created. Please check your email to verify your account before logging in.",
        user: {
          id: userId,
          name: cleanName,
          email: cleanEmail,
          role: "user",
          is_email_verified: false,
        },
      });
    } catch (emailError) {
      // Do not log the verification token or email credentials.
      console.error("Verification email delivery failed:", emailError.message);

      // The account exists even if email delivery fails.
      return res.status(201).json({
        success: true,
        message:
          "Account created, but the verification email could not be sent. Please use the resend verification endpoint.",
        user: {
          id: userId,
          name: cleanName,
          email: cleanEmail,
          role: "user",
          is_email_verified: false,
        },
        emailSent: false,
      });
    }
  } catch (error) {
    console.error("Registration error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to register at this time.",
    });
  }
};

// PHASE 5 + PHASE 8: Login only after email verification.
export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body ?? {};

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

    if (Buffer.byteLength(password, "utf8") > 72) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password.",
      });
    }

    const cleanEmail = normalizeEmail(email);

    const [users] = await pool.execute(
      `SELECT id, name, email, password_hash, role,
              is_email_verified
       FROM users
       WHERE email = ?
       LIMIT 1`,
      [cleanEmail],
    );

    if (users.length === 0) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password.",
      });
    }

    const user = users[0];
    const passwordMatches = await bcrypt.compare(password, user.password_hash);

    if (!passwordMatches) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password.",
      });
    }

    if (!user.is_email_verified) {
      return res.status(403).json({
        success: false,
        code: "EMAIL_NOT_VERIFIED",
        message: "Please verify your email before logging in.",
      });
    }

    req.session.regenerate((sessionError) => {
      if (sessionError) {
        console.error("Session regeneration failed:", sessionError.message);

        return res.status(500).json({
          success: false,
          message: "Unable to log in at this time.",
        });
      }

      req.session.user = {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      };

      req.session.save((saveError) => {
        if (saveError) {
          console.error("Session save failed:", saveError.message);

          return res.status(500).json({
            success: false,
            message: "Unable to log in at this time.",
          });
        }

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
      });
    });
  } catch (error) {
    console.error("Login error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to log in at this time.",
    });
  }
};

export const showResetPasswordPage = (req, res) => {
  const token = req.query.token;

  if (typeof token !== "string" || !/^[a-f0-9]{64}$/i.test(token)) {
    return res.status(400).send("Invalid or expired reset link.");
  }

  return res.status(200).send(`
    <!doctype html>
    <html lang="en">
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <title>Reset Password</title>
      </head>
      <body style="font-family:Arial,sans-serif;max-width:520px;margin:60px auto;padding:20px">
        <h1>Reset your password</h1>
        <p>Enter a new password of at least 8 characters.</p>

        <form action="/api/auth/reset-password" method="POST">
          <input type="hidden" name="token" value="${token}">

          <label for="newPassword">New password</label>
          <br>

          <input
            id="newPassword"
            name="newPassword"
            type="password"
            minlength="8"
            maxlength="72"
            required
            autocomplete="new-password"
          >

          <br><br>
          <button type="submit">Reset password</button>
        </form>
      </body>
    </html>
  `);
};



/* =========================================
   PHASE 9: FORGOT PASSWORD
========================================= */

export const forgotPassword = async (req, res) => {
  const genericResponse = {
    success: true,
    message:
      "If an account exists for that email, password reset instructions will be sent.",
  };

  try {
    const { email } = req.body ?? {};

    if (typeof email !== "string" || !email.trim()) {
      return res.status(400).json({
        success: false,
        message: "Email is required.",
      });
    }

    const cleanEmail = normalizeEmail(email);

    const [users] = await pool.execute(
      `SELECT id, name, email
       FROM users
       WHERE email = ?
       LIMIT 1`,
      [cleanEmail]
    );

    // Do not reveal whether the account exists.
    if (users.length === 0) {
      return res.status(200).json(genericResponse);
    }

    const user = users[0];
    const token = await createPasswordResetToken(user.id);

    try {
      await sendPasswordResetEmail({
        email: user.email,
        name: user.name,
        token,
      });
    } catch (emailError) {
      console.error(
        "Password reset email delivery failed:",
        emailError.message
      );
    }

    return res.status(200).json(genericResponse);
  } catch (error) {
    console.error("Forgot password error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to process your request at this time.",
    });
  }
};


/* =========================================
   PHASE 9: RESET PASSWORD
========================================= */

export const resetPassword = async (req, res) => {
  const { token, newPassword } = req.body ?? {};

  if (
    typeof token !== "string" ||
    !/^[a-f0-9]{64}$/i.test(token)
  ) {
    return res.status(400).json({
      success: false,
      message: "Invalid or expired reset link.",
    });
  }

  if (
    typeof newPassword !== "string" ||
    newPassword.length < 8 ||
    Buffer.byteLength(newPassword, "utf8") > 72
  ) {
    return res.status(400).json({
      success: false,
      message:
        "Password must be at least 8 characters and no more than 72 bytes.",
    });
  }

  const tokenHash = crypto
    .createHash("sha256")
    .update(token)
    .digest("hex");

  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const [tokens] = await connection.execute(
      `SELECT id, user_id
       FROM password_reset_tokens
       WHERE token_hash = ?
         AND used_at IS NULL
         AND expires_at > NOW()
       LIMIT 1
       FOR UPDATE`,
      [tokenHash]
    );

    if (tokens.length === 0) {
      await connection.rollback();

      return res.status(400).json({
        success: false,
        message: "Invalid or expired reset link.",
      });
    }

    const resetRecord = tokens[0];

    const passwordHash = await bcrypt.hash(newPassword, 12);

    const [updateResult] = await connection.execute(
      `UPDATE users
       SET password_hash = ?
       WHERE id = ?`,
      [passwordHash, resetRecord.user_id]
    );

    if (updateResult.affectedRows !== 1) {
      await connection.rollback();

      return res.status(400).json({
        success: false,
        message: "Unable to reset this password.",
      });
    }

    // Consume this token.
    await connection.execute(
      `UPDATE password_reset_tokens
       SET used_at = NOW()
       WHERE id = ? AND used_at IS NULL`,
      [resetRecord.id]
    );

    // Invalidate other unused reset tokens for this user.
    await connection.execute(
      `UPDATE password_reset_tokens
       SET used_at = NOW()
       WHERE user_id = ?
         AND used_at IS NULL`,
      [resetRecord.user_id]
    );

    await connection.commit();

    return res.status(200).json({
      success: true,
      message:
        "Password reset successfully. You can now log in with your new password.",
    });
  } catch (error) {
    await connection.rollback();

    console.error("Reset password error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to reset password at this time.",
    });
  } finally {
    connection.release();
  }
};


/* =========================================
   PHASE 9: CHANGE PASSWORD
========================================= */

export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body ?? {};
    const userId = req.session?.user?.id;

    if (
      typeof currentPassword !== "string" ||
      !currentPassword ||
      typeof newPassword !== "string" ||
      !newPassword
    ) {
      return res.status(400).json({
        success: false,
        message: "Current password and new password are required.",
      });
    }

    if (
      newPassword.length < 8 ||
      Buffer.byteLength(newPassword, "utf8") > 72
    ) {
      return res.status(400).json({
        success: false,
        message:
          "New password must be at least 8 characters and no more than 72 bytes.",
      });
    }

    if (currentPassword === newPassword) {
      return res.status(400).json({
        success: false,
        message:
          "Your new password must be different from your current password.",
      });
    }

    const [users] = await pool.execute(
      `SELECT password_hash
       FROM users
       WHERE id = ?
       LIMIT 1`,
      [userId]
    );

    if (users.length === 0) {
      return res.status(401).json({
        success: false,
        message: "Authentication required. Please log in again.",
      });
    }

    const passwordMatches = await bcrypt.compare(
      currentPassword,
      users[0].password_hash
    );

    if (!passwordMatches) {
      return res.status(401).json({
        success: false,
        message: "Current password is incorrect.",
      });
    }

    const newPasswordHash = await bcrypt.hash(newPassword, 12);

    await pool.execute(
      `UPDATE users
       SET password_hash = ?
       WHERE id = ?`,
      [newPasswordHash, userId]
    );

    return res.status(200).json({
      success: true,
      message: "Password changed successfully.",
    });
  } catch (error) {
    console.error("Change password error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to change password at this time.",
    });
  }
};


export const showVerificationPage = (req, res) => {
  const token = req.query.token;

  if (typeof token !== "string" || !/^[a-f0-9]{64}$/i.test(token)) {
    return res.status(400).send("Invalid verification link.");
  }

  // The token is hexadecimal, so it is safe to place in this hidden field.
  return res.status(200).send(`
    <!doctype html>
    <html lang="en">
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <title>Verify Email</title>
      </head>
      <body style="font-family: Arial, sans-serif; max-width: 520px; margin: 60px auto; padding: 20px;">
        <h1>Verify your email</h1>
        <p>Click the button below to confirm your email address.</p>
        <form action="/api/auth/verify-email" method="POST">
          <input type="hidden" name="token" value="${token}">
          <button type="submit">Confirm email address</button>
        </form>
      </body>
    </html>
  `);
};

// PHASE 8: Verify an email using its one-time token.
export const verifyEmail = async (req, res) => {
  const token = req.body?.token;

  if (typeof token !== "string" || !/^[a-f0-9]{64}$/i.test(token)) {
    return res.status(400).json({
      success: false,
      message: "Invalid or expired verification link.",
    });
  }

  const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const [tokens] = await connection.execute(
      `SELECT id, user_id
       FROM email_verification_tokens
       WHERE token_hash = ?
         AND used_at IS NULL
         AND expires_at > NOW()
       LIMIT 1
       FOR UPDATE`,
      [tokenHash],
    );

    if (tokens.length === 0) {
      await connection.rollback();

      return res.status(400).json({
        success: false,
        message: "Invalid or expired verification link.",
      });
    }

    const verification = tokens[0];

    const [updateResult] = await connection.execute(
      `UPDATE users
       SET is_email_verified = TRUE
       WHERE id = ?`,
      [verification.user_id],
    );

    if (updateResult.affectedRows !== 1) {
      await connection.rollback();

      return res.status(400).json({
        success: false,
        message: "Unable to verify this account.",
      });
    }

    // Mark this token as used so it cannot be reused.
    await connection.execute(
      `UPDATE email_verification_tokens
       SET used_at = NOW()
       WHERE id = ? AND used_at IS NULL`,
      [verification.id],
    );

    await connection.commit();

    return res.status(200).json({
      success: true,
      message: "Email verified successfully. You can now log in.",
    });
  } catch (error) {
    await connection.rollback();
    console.error("Email verification error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to verify email at this time.",
    });
  } finally {
    connection.release();
  }
};

// PHASE 8: Resend a verification email.
export const resendVerificationEmail = async (req, res) => {
  const genericResponse = {
    success: true,
    message:
      "If an unverified account exists for that email, a verification email will be sent.",
  };

  try {
    const { email } = req.body ?? {};

    if (typeof email !== "string" || !email.trim()) {
      return res.status(400).json({
        success: false,
        message: "Email is required.",
      });
    }

    const cleanEmail = normalizeEmail(email);

    const [users] = await pool.execute(
      `SELECT id, name, email, is_email_verified
       FROM users
       WHERE email = ?
       LIMIT 1`,
      [cleanEmail],
    );

    // Use the same response whether the email exists or not.
    if (users.length === 0 || users[0].is_email_verified) {
      return res.status(200).json(genericResponse);
    }

    const user = users[0];
    const token = await createVerificationToken(user.id);

    try {
      await sendVerificationEmail({
        email: user.email,
        name: user.name,
        token,
      });
    } catch (emailError) {
      console.error("Resend verification email failed:", emailError.message);
    }

    return res.status(200).json(genericResponse);
  } catch (error) {
    console.error("Resend verification error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to process the request at this time.",
    });
  }
};

// PHASE 6: Return the current authenticated user.
export const getCurrentUser = async (req, res) => {
  try {
    const [users] = await pool.execute(
      `SELECT id, name, email, role, is_email_verified
       FROM users
       WHERE id = ?
       LIMIT 1`,
      [req.session.user.id],
    );

    if (users.length === 0) {
      return req.session.destroy(() => {
        res.clearCookie("auth.sid", {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
          path: "/",
        });

        return res.status(401).json({
          success: false,
          message: "Authentication required. Please log in.",
        });
      });
    }

    const user = users[0];

    return res.status(200).json({
      success: true,
      user: {
        ...user,
        is_email_verified: Boolean(user.is_email_verified),
      },
    });
  } catch (error) {
    console.error("Get current user error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to retrieve user information.",
    });
  }
};

// PHASE 7: Logout and destroy the session.
export const logoutUser = (req, res) => {
  req.session.destroy((error) => {
    if (error) {
      console.error("Logout error:", error.message);

      return res.status(500).json({
        success: false,
        message: "Unable to log out. Please try again.",
      });
    }

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
