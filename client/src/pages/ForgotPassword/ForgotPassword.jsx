import { useState } from "react";
import { Link } from "react-router-dom";
import { authService } from "../../services/authService";
import styles from "./ForgotPassword.module.css";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();

    setMessage("");
    setError("");

    const normalizedEmail = email.trim();

    if (!normalizedEmail) {
      setError("Please enter your email address.");
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await authService.forgotPassword(normalizedEmail);

      setMessage(
        result?.message ||
          "If an account exists for that email, password reset instructions will be sent.",
      );
    } catch (err) {
      setError(
        err.message || "Unable to process your request. Please try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className={styles.page}>
      <section className={styles.card}>
        <div className={styles.icon} aria-hidden="true">
          <span>🔑</span>
        </div>

        <h1>Forgot your password?</h1>

        <p className={styles.description}>
          Enter the email address associated with your account. If an eligible
          account exists, we will send instructions to reset your password.
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
          <label htmlFor="forgot-email">Email address</label>

          <input
            id="forgot-email"
            type="email"
            name="email"
            autoComplete="email"
            placeholder="you@example.com"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />

          <button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Sending..." : "Send reset instructions"}
          </button>
        </form>

        <p className={styles.footer}>
          Remember your password? <Link to="/login">Log in</Link>
        </p>
      </section>
    </main>
  );
}
