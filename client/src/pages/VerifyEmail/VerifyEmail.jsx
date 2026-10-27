import { useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";

import { authService } from "../../services/authService";
import styles from "./VerifyEmail.module.css";

function VerifyEmail() {
  const [searchParams] = useSearchParams();

  const token = searchParams.get("token")?.trim() || "";
  const emailFromUrl = searchParams.get("email") || "";

  const [status, setStatus] = useState(token ? "checking" : "instructions");
  const [message, setMessage] = useState("");
  const [email, setEmail] = useState(emailFromUrl);
  const [resendMessage, setResendMessage] = useState("");
  const [resendError, setResendError] = useState("");
  const [isResending, setIsResending] = useState(false);

  // Prevent duplicate verification POST requests during React StrictMode
  // effect replay in development.
  const verificationStarted = useRef(false);

  useEffect(() => {
    if (!token || verificationStarted.current) {
      return;
    }

    verificationStarted.current = true;
    let active = true;

    async function verifyToken() {
      setStatus("checking");
      setMessage("");

      try {
        const result = await authService.verifyEmail(token);

        if (!active) return;

        setStatus("success");
        setMessage(
          result?.message ||
            "Your email has been verified successfully. You can now log in.",
        );
      } catch (error) {
        if (!active) return;

        if (error?.status === 400 || error?.status === 410) {
          setStatus("invalid");
          setMessage(
            "This verification link is invalid, expired, or has already been used. Request a new verification email to continue.",
          );
        } else {
          setStatus("error");
          setMessage(
            error?.message ||
              "We could not verify your email right now. Please try again.",
          );
        }
      }
    }

    verifyToken();

    return () => {
      active = false;
    };
  }, [token]);

  function handleEmailChange(event) {
    setEmail(event.target.value);
    setResendMessage("");
    setResendError("");
  }

  async function handleResend(event) {
    event.preventDefault();

    setResendMessage("");
    setResendError("");

    const normalizedEmail = email.trim();

    if (
      !normalizedEmail ||
      normalizedEmail.length > 254 ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)
    ) {
      setResendError("Please enter a valid email address.");
      return;
    }

    if (isResending) return;

    setIsResending(true);

    try {
      const result = await authService.resendVerificationEmail(normalizedEmail);

      setResendMessage(
        result?.message ||
          "If an unverified account exists for that email, a verification email will be sent.",
      );
    } catch (error) {
      setResendError(
        error?.message ||
          "We could not process your request. Please try again later.",
      );
    } finally {
      setIsResending(false);
    }
  }

  return (
    <main className={styles.page}>
      <section className={styles.card}>
        <div className={styles.icon} aria-hidden="true">
          {status === "checking" && "…"}
          {status === "success" && "✓"}
          {status === "invalid" && "!"}
          {(status === "instructions" || status === "error") && "✉"}
        </div>

        <p className={styles.eyebrow}>AUTH SYSTEM</p>

        {status === "checking" && (
          <>
            <h1 className={styles.title}>Verifying your email</h1>
            <p className={styles.description} role="status">
              Please wait while we check your verification link.
            </p>
          </>
        )}

        {status === "success" && (
          <>
            <h1 className={styles.title}>Email verified!</h1>
            <p className={styles.description} role="status">
              {message}
            </p>
            <Link className={styles.primaryLink} to="/login">
              Continue to login
            </Link>
          </>
        )}

        {status === "invalid" && (
          <>
            <h1 className={styles.title}>Verification link unavailable</h1>
            <p className={styles.description} role="alert">
              {message}
            </p>
          </>
        )}

        {status === "error" && (
          <>
            <h1 className={styles.title}>Unable to verify your email</h1>
            <p className={styles.description} role="alert">
              {message}
            </p>
            {token && (
              <button
                className={styles.secondaryButton}
                type="button"
                onClick={() => {
                  verificationStarted.current = false;
                  setStatus("checking");
                  setMessage("");

                  // Retry by reloading the current verification URL.
                  window.location.reload();
                }}
              >
                Try again
              </button>
            )}
          </>
        )}

        {status === "instructions" && (
          <>
            <h1 className={styles.title}>Verify your email</h1>
            <p className={styles.description}>
              To complete your registration, open the verification link we sent
              to your email inbox. Check your spam or junk folder if you cannot
              find it.
            </p>
          </>
        )}

        {status !== "checking" && status !== "success" && (
          <section className={styles.resendSection}>
            <h2 className={styles.sectionTitle}>
              Need a new verification email?
            </h2>

            <p className={styles.helperText}>
              Enter your registration email address below. If an unverified
              account exists, we will send another link.
            </p>

            <form className={styles.form} onSubmit={handleResend}>
              <div className={styles.field}>
                <label htmlFor="verification-email">Email address</label>

                <input
                  id="verification-email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={handleEmailChange}
                  disabled={isResending}
                  required
                />
              </div>

              {resendError && (
                <p className={styles.errorMessage} role="alert">
                  {resendError}
                </p>
              )}

              {resendMessage && (
                <p className={styles.successMessage} role="status">
                  {resendMessage}
                </p>
              )}

              <button
                className={styles.primaryButton}
                type="submit"
                disabled={isResending}
              >
                {isResending ? "Sending..." : "Resend verification email"}
              </button>
            </form>
          </section>
        )}

        <p className={styles.footer}>
          <Link to="/login">Back to login</Link>
          {" · "}
          <Link to="/">Home</Link>
        </p>
      </section>
    </main>
  );
}

export default VerifyEmail;
