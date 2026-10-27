import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { authService } from "../../services/authService";
import styles from "./ResetPassword.module.css";

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") || "";

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isReset, setIsReset] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();

    setMessage("");
    setError("");

    if (!token) {
      setError(
        "The password reset link is missing its token. Request a new reset email.",
      );
      return;
    }

    if (newPassword.length < 8) {
      setError("Your new password must contain at least 8 characters.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("The passwords do not match.");
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await authService.resetPassword(token, newPassword);

      setIsReset(true);
      setMessage(
        result?.message ||
          "Your password has been reset successfully. You can now log in.",
      );
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      setError(
        err.message ||
          "Unable to reset your password. The link may be invalid or expired.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className={styles.page}>
      <section className={styles.card}>
        <div className={styles.icon} aria-hidden="true">
          <span>🔐</span>
        </div>

        <h1>Reset your password</h1>

        <p className={styles.description}>
          Choose a new password for your account.
        </p>

        {!token && !isReset && (
          <div className={styles.error} role="alert">
            The reset token is missing. Please request a new password reset
            email.
            <p>
              <Link to="/forgot-password">Request another reset link</Link>
            </p>
          </div>
        )}

        {message && (
          <div className={styles.success} role="status">
            {message}
          </div>
        )}

        {error && token && (
          <div className={styles.error} role="alert">
            {error}
          </div>
        )}

        {!isReset && token && (
          <form onSubmit={handleSubmit}>
            <label htmlFor="new-password">New password</label>

            <input
              id="new-password"
              type="password"
              name="newPassword"
              autoComplete="new-password"
              minLength={8}
              placeholder="At least 8 characters"
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
              required
            />

            <label htmlFor="confirm-password">Confirm new password</label>

            <input
              id="confirm-password"
              type="password"
              name="confirmPassword"
              autoComplete="new-password"
              minLength={8}
              placeholder="Enter the password again"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              required
            />

            <button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Resetting..." : "Reset password"}
            </button>
          </form>
        )}

        <p className={styles.footer}>
          <Link to="/login">Back to login</Link>
        </p>
      </section>
    </main>
  );
}
