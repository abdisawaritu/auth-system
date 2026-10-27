import "dotenv/config";
import nodemailer from "nodemailer";

const smtpUser = process.env.SMTP_USER?.trim();
const smtpPassword = process.env.SMTP_APP_PASSWORD?.trim();

function getServerUrl() {
  const configuredUrl = process.env.SERVER_URL?.trim();
  const fallbackPort = process.env.PORT || "5000";

  // Ignore missing or invalid placeholder values.
  const isPlaceholder =
    !configuredUrl ||
    ["null", "undefined"].includes(configuredUrl.toLowerCase());

  const candidate = isPlaceholder
    ? `http://localhost:${fallbackPort}`
    : configuredUrl;

  let parsedUrl;

  try {
    parsedUrl = new URL(candidate);
  } catch {
    throw new Error(
      "Invalid SERVER_URL. Set it to http://localhost:5000 in server/.env.",
    );
  }

  if (!["http:", "https:"].includes(parsedUrl.protocol)) {
    throw new Error("SERVER_URL must use HTTP or HTTPS.");
  }

  if (parsedUrl.hostname === "null" || parsedUrl.hostname === "undefined") {
    throw new Error("SERVER_URL contains an invalid hostname.");
  }

  // Remove trailing slashes and any accidental path/query.
  return parsedUrl.origin;
}

const serverUrl = getServerUrl();

if (!smtpUser || !smtpPassword) {
  console.warn(
    "SMTP configuration is missing. Check SMTP_USER and SMTP_APP_PASSWORD.",
  );
}

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: Number(process.env.SMTP_PORT || 465),
  secure: Number(process.env.SMTP_PORT || 465) === 465,
  auth: {
    user: smtpUser,
    pass: smtpPassword?.replace(/\s/g, ""),
  },
});

export const sendVerificationEmail = async ({ email, name, token }) => {
  if (!smtpUser || !smtpPassword) {
    throw new Error("Email service is not configured.");
  }

  if (typeof token !== "string" || !/^[a-f0-9]{64}$/i.test(token)) {
    throw new Error("Invalid verification token.");
  }

  // Build the verification link for the React frontend.
  const clientUrl = (process.env.CLIENT_URL || "http://localhost:5173")
    .trim()
    .replace(/\/+$/, "");

  const verificationUrl = new URL(`${clientUrl}/verify-email`);

  verificationUrl.searchParams.set("token", token);

  const verificationLink = verificationUrl.toString();

  // Log only the destination, never the token.
  console.log(
    "Verification link destination:",
    `${verificationUrl.origin}${verificationUrl.pathname}`,
  );

  return transporter.sendMail({
    from: `"Auth System" <${smtpUser}>`,
    to: email,
    subject: "Verify your email address",

    text: [
      `Hello ${name},`,
      "",
      "Thank you for registering.",
      "Open this link to verify your email address:",
      verificationLink,
      "",
      "This link expires in 30 minutes.",
      "If you did not create this account, you can ignore this email.",
    ].join("\n"),

    html: `
      <!doctype html>
      <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <title>Verify Your Email</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6;">
          <h2>Verify your email address</h2>

          <p>Hello ${escapeHtml(name)},</p>

          <p>Thank you for registering. Use the button below to verify your email:</p>

          <p>
            <a
              href="${escapeHtml(verificationLink)}"
              style="display:inline-block;padding:12px 20px;
                     background-color:#2563eb;color:#ffffff;
                     text-decoration:none;border-radius:5px;"
            >
              Verify My Email
            </a>
          </p>

          <p>If the button does not work, copy this link into your browser:</p>

          <p>
            <a href="${escapeHtml(verificationLink)}">
              ${escapeHtml(verificationLink)}
            </a>
          </p>

          <p>This link expires in 30 minutes and can only be used once.</p>
          <p>If you did not create this account, you can ignore this email.</p>
        </body>
      </html>
    `,
  });
};

export const sendPasswordResetEmail = async ({ email, name, token }) => {
  if (!smtpUser || !smtpPassword) {
    throw new Error("Email service is not configured.");
  }

  if (typeof token !== "string" || !/^[a-f0-9]{64}$/i.test(token)) {
    throw new Error("Invalid password reset token.");
  }

  
const clientUrl = (process.env.CLIENT_URL || "http://localhost:5173")
  .trim()
  .replace(/\/+$/, "");

const resetUrl = new URL(`${clientUrl}/reset-password`);

resetUrl.searchParams.set("token", token);

const resetLink = resetUrl.toString();


  return transporter.sendMail({
    from: `"Auth System" <${smtpUser}>`,
    to: email,
    subject: "Reset your password",
    text: [
      `Hello ${name},`,
      "",
      "We received a request to reset your password.",
      "Open this link to choose a new password:",
      resetLink,
      "",
      "This link expires in 30 minutes and can only be used once.",
      "If you did not request a password reset, ignore this email.",
    ].join("\n"),
    html: `
      <h2>Reset your password</h2>
      <p>Hello ${escapeHtml(name)},</p>
      <p>We received a request to reset your password.</p>
      <p>
        <a href="${escapeHtml(resetLink)}">
          Reset My Password
        </a>
      </p>
      <p>This link expires in 30 minutes and can only be used once.</p>
      <p>If you did not request this, you can ignore this email.</p>
    `,
  });
};

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (character) => {
    const entities = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    };

    return entities[character];
  });
}
