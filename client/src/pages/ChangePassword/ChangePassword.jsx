import { useState } from "react";
import { Link } from "react-router-dom";
import { authService } from "../../services/authService";
import styles from "./ChangePassword.module.css";

export default function ChangePassword() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();

    setMessage("");
    setError("");

    if (!currentPassword || !newPassword || !confirmPassword) {
      setError("Please complete all password fields.");
      return;
    }

    if (newPassword.length < 8) {
      setError("Your new password must contain at least 8 characters.");
      return;
    }

    if (newPassword === currentPassword) {
      setError(
        "Your new password must be different from your current password.",
      );
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("The new passwords do not match.");
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await authService.changePassword(
        currentPassword,
        newPassword,
      );

      setMessage(
        result?.message || "Your password has been changed successfully.",
      );

      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      setError(
        err.message ||
          "Unable to change your password. Check your current password and try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className={styles.page}>
      <section className={styles.card}>
        <div className={styles.icon} aria-hidden="true">
          🔐
        </div>

        <h1>Change Password</h1>

        <p className={styles.description}>
          Enter your current password and choose a new password to protect your
          account.
        </p>

        {message && (
          <div className={styles.success} role="status">
            {message}
          </div>
        )}

        {error && (
          <div className={styles.error} role="alert">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <label htmlFor="current-password">Current password</label>

          <input
            id="current-password"
            type="password"
            name="currentPassword"
            autoComplete="current-password"
            value={currentPassword}
            onChange={(event) => setCurrentPassword(event.target.value)}
            required
          />

          <label htmlFor="new-password">New password</label>

          <input
            id="new-password"
            type="password"
            name="newPassword"
            autoComplete="new-password"
            minLength={8}
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
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            required
          />

          <button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Updating..." : "Update Password"}
          </button>
        </form>

        <p className={styles.footer}>
          <Link to="/dashboard">Back to dashboard</Link>
        </p>
      </section>
    </main>
  );
}
