import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";

import { useAuth } from "../../context/AuthContext";
import styles from "./Login.module.css";

function validateForm(form) {
  const errors = {};
  const email = form.email.trim();

  if (!email) {
    errors.email = "Please enter your email address.";
  } else if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.email = "Please enter a valid email address.";
  }

  if (!form.password) {
    errors.password = "Please enter your password.";
  }

  return errors;
}

function getErrorMessage(error) {
  if (error?.status === 401) {
    return "Invalid email or password. Please try again.";
  }

  if (error?.status === 403) {
    return (
      error.message ||
      "Your account cannot log in yet. Please check your account status."
    );
  }

  if (error?.status === 400 || error?.status === 422) {
    return error.message || "Please check the information you entered.";
  }

  if (error?.status >= 500) {
    return "The server encountered a problem. Please try again later.";
  }

  return error?.message || "Login failed. Please try again.";
}

function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  const [form, setForm] = useState({
    email: "",
    password: "",
  });
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState("");
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
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (isSubmitting) return;

    setSubmitError("");

    const validationErrors = validateForm(form);
    setErrors(validationErrors);

    if (Object.keys(validationErrors).length > 0) {
      return;
    }

    setIsSubmitting(true);

    try {
      await login({
        email: form.email.trim(),
        password: form.password,
      });

      setForm({ email: "", password: "" });

      // Return the user to the page they originally requested.
      const requestedPath = location.state?.from;
      const destination =
        requestedPath?.pathname?.startsWith("/") &&
        !requestedPath.pathname.startsWith("//")
          ? `${requestedPath.pathname}${requestedPath.search || ""}${requestedPath.hash || ""}`
          : "/dashboard";

      navigate(destination, { replace: true });
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
          <h1 className={styles.title}>Welcome back</h1>
          <p className={styles.subtitle}>Sign in to access your account.</p>
        </header>

        {submitError && (
          <div className={styles.errorBanner} role="alert">
            {submitError}
          </div>
        )}

        <form className={styles.form} onSubmit={handleSubmit} noValidate>
          <div className={styles.field}>
            <label htmlFor="login-email">Email address</label>
            <input
              id="login-email"
              name="email"
              type="email"
              autoComplete="username"
              placeholder="you@example.com"
              value={form.email}
              onChange={handleChange}
              aria-invalid={Boolean(errors.email)}
              aria-describedby={errors.email ? "login-email-error" : undefined}
              disabled={isSubmitting}
              required
            />
            {errors.email && (
              <p className={styles.fieldError} id="login-email-error">
                {errors.email}
              </p>
            )}
          </div>

          <div className={styles.field}>
            <div className={styles.passwordLabelRow}>
              <label htmlFor="login-password">Password</label>
              <Link to="/forgot-password">Forgot password?</Link>
            </div>

            <input
              id="login-password"
              name="password"
              type="password"
              autoComplete="current-password"
              placeholder="Enter your password"
              value={form.password}
              onChange={handleChange}
              aria-invalid={Boolean(errors.password)}
              aria-describedby={
                errors.password ? "login-password-error" : undefined
              }
              disabled={isSubmitting}
              required
            />
            {errors.password && (
              <p className={styles.fieldError} id="login-password-error">
                {errors.password}
              </p>
            )}
          </div>

          <button
            className={styles.submitButton}
            type="submit"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Signing in..." : "Sign in"}
          </button>
        </form>

        <p className={styles.footer}>
          Don't have an account? <Link to="/register">Create an account</Link>
        </p>

        <p className={styles.homeLink}>
          <Link to="/">Back to home</Link>
        </p>
      </section>
    </main>
  );
}

export default Login;
