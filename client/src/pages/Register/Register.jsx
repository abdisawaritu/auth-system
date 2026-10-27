import { useState } from "react";
import { Link} from "react-router-dom";

import { authService } from "../../services/authService";
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
    errors.name = "Please enter your name.";
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

function getErrorMessage(error) {
  if (error?.status === 409) {
    return "An account with this email already exists. Try logging in.";
  }

  if (error?.status === 400 || error?.status === 422) {
    return error.message || "Please check the information you entered.";
  }

  if (error?.status >= 500) {
    return "The server encountered a problem. Please try again later.";
  }

  return error?.message || "Registration failed. Please try again.";
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
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (isSubmitting) return;

    setSubmitError("");
    setSuccessMessage("");

    const validationErrors = validateForm(form);
    setErrors(validationErrors);

    if (Object.keys(validationErrors).length > 0) {
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await authService.register({
        name: form.name.trim(),
        email: form.email.trim(),
        password: form.password,
      });
      const registeredEmail = form.email.trim();

      setVerificationEmail(registeredEmail);

      setForm(initialForm);

      setSuccessMessage(
        result?.message ||
          "Registration successful. Please check your email for verification instructions.",
      );

      // Allow the user to read the confirmation before navigating.
      // We do not automatically log them in after registration.
    } catch (error) {
      setSubmitError(getErrorMessage(error));
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

        {successMessage && verificationEmail && (
          <p className={styles.footer}>
            <Link
              to={`/verify-email?email=${encodeURIComponent(verificationEmail)}`}
            >
              Open email verification
            </Link>
          </p>
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
