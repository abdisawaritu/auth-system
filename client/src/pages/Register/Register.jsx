import { useState } from "react";
import { Link } from "react-router-dom";

import { authService } from "../../services/authService";
import { ApiError } from "../../services/api";
import styles from "./Register.module.css";

const initialForm = {
  name: "",
  email: "",
  password: "",
};

function validateForm(form) {
  const errors = {};

  const name = form.name.trim();
  const email = form.email.trim();
  const password = form.password;

  if (!name) {
    errors.name = "Please enter your full name.";
  } else if (name.length > 100) {
    errors.name = "Your name must not exceed 100 characters.";
  }

  if (!email) {
    errors.email = "Please enter your email address.";
  } else if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.email = "Please enter a valid email address.";
  }

  if (!password) {
    errors.password = "Please enter a password.";
  } else if (password.length < 8) {
    errors.password = "Password must contain at least 8 characters.";
  } else if (new TextEncoder().encode(password).length > 72) {
    errors.password = "Password must not exceed 72 UTF-8 bytes.";
  }

  return errors;
}

function getRegistrationErrorMessage(error) {
  if (error?.code === "NETWORK_ERROR") {
    return "We couldn't connect to the server. Check your internet connection and try again.";
  }

  if (error instanceof ApiError || typeof error?.status === "number") {
    if (error.status === 409) {
      return "An account with this email already exists. Try logging in or use another email address.";
    }

    if (error.status === 400 || error.status === 422) {
      return "Some of your information is invalid. Please review the fields and try again.";
    }

    if (error.status === 429) {
      return "Too many registration attempts. Please wait a few minutes and try again.";
    }

    if (error.status >= 500) {
      return "We couldn't create your account because of a server problem. Please try again later.";
    }

    if (error.status === 401 || error.status === 403) {
      return "Your registration request could not be authorized. Please refresh the page and try again.";
    }
  }

  return "We couldn't create your account. Please check your connection and try again.";
}

function Register() {
  const [verificationEmail, setVerificationEmail] = useState("");
  const [form, setForm] = useState(initialForm);
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  function handleChange(event) {
    const { name, value } = event.target;

    setForm((currentForm) => ({
      ...currentForm,
      [name]: value,
    }));

    setErrors((currentErrors) => ({
      ...currentErrors,
      [name]: "",
    }));

    setSubmitError("");
    setSuccessMessage("");
    setVerificationEmail("");
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (isSubmitting) return;

    setSubmitError("");
    setSuccessMessage("");
    setVerificationEmail("");

    const validationErrors = validateForm(form);
    setErrors(validationErrors);

    if (Object.keys(validationErrors).length > 0) {
      return;
    }

    setIsSubmitting(true);

    try {
      await authService.register({
        name: form.name.trim(),
        email: form.email.trim(),
        password: form.password,
      });

      const registeredEmail = form.email.trim();

      setVerificationEmail(registeredEmail);
      setForm(initialForm);
      setErrors({});

      setSuccessMessage(
        "Your account has been created. Check your email for verification instructions before signing in.",
      );
    } catch (error) {
      setSubmitError(getRegistrationErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className={styles.page}>
      <section className={styles.card}>
        <header className={styles.header}>
          <p className={styles.eyebrow}>AUTH SYSTEM</p>

          <h1 className={styles.title}>Create your account</h1>

          <p className={styles.subtitle}>Enter your details to get started.</p>
        </header>

        {submitError && (
          <div className={styles.errorBanner} role="alert">
            {submitError}
          </div>
        )}

        {successMessage && (
          <div className={styles.successBanner} role="status">
            <p>{successMessage}</p>

            {verificationEmail && (
              <p>
                Registered email: <strong>{verificationEmail}</strong>
              </p>
            )}

            {verificationEmail && (
              <Link
                to={`/verify-email?email=${encodeURIComponent(
                  verificationEmail,
                )}`}
              >
                Continue to email verification
              </Link>
            )}
          </div>
        )}

        <form className={styles.form} onSubmit={handleSubmit} noValidate>
          <div className={styles.field}>
            <label htmlFor="name">Full name</label>

            <input
              id="name"
              name="name"
              type="text"
              autoComplete="name"
              placeholder="Enter your full name"
              value={form.name}
              onChange={handleChange}
              aria-invalid={Boolean(errors.name)}
              aria-describedby={errors.name ? "name-error" : undefined}
              disabled={isSubmitting}
              required
            />

            {errors.name && (
              <p className={styles.fieldError} id="name-error">
                {errors.name}
              </p>
            )}
          </div>

          <div className={styles.field}>
            <label htmlFor="email">Email address</label>

            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              value={form.email}
              onChange={handleChange}
              aria-invalid={Boolean(errors.email)}
              aria-describedby={errors.email ? "email-error" : undefined}
              disabled={isSubmitting}
              required
            />

            {errors.email && (
              <p className={styles.fieldError} id="email-error">
                {errors.email}
              </p>
            )}
          </div>

          <div className={styles.field}>
            <label htmlFor="password">Password</label>

            <input
              id="password"
              name="password"
              type="password"
              autoComplete="new-password"
              placeholder="At least 8 characters"
              value={form.password}
              onChange={handleChange}
              aria-invalid={Boolean(errors.password)}
              aria-describedby={
                errors.password ? "password-error" : "password-help"
              }
              disabled={isSubmitting}
              required
            />

            {errors.password ? (
              <p className={styles.fieldError} id="password-error">
                {errors.password}
              </p>
            ) : (
              <p className={styles.helpText} id="password-help">
                Use at least 8 characters.
              </p>
            )}
          </div>

          <button
            className={styles.submitButton}
            type="submit"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Creating account..." : "Create account"}
          </button>
        </form>

        <p className={styles.footer}>
          Already have an account? <Link to="/login">Log in</Link>
        </p>

        <p className={styles.homeLink}>
          <Link to="/">Back to home</Link>
        </p>
      </section>
    </main>
  );
}

export default Register;
