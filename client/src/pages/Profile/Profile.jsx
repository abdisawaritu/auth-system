import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { authService } from "../../services/authService";
import styles from "./Profile.module.css";

function getVerificationStatus(user) {
  const verified =
    user?.is_email_verified ??
    user?.isEmailVerified ??
    user?.email_verified ??
    user?.emailVerified;

  if (verified === true || verified === 1) {
    return "Verified";
  }

  if (verified === false || verified === 0) {
    return "Not verified";
  }

  return "Status unavailable";
}

function formatDate(value) {
  if (!value) {
    return "Not available";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Not available";
  }

  return date.toLocaleDateString();
}

function Profile() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function loadProfile() {
      try {
        setLoading(true);
        setError("");

        const response = await authService.getCurrentUser();

        // Support common API response shapes.
        const currentUser =
          response?.user ?? response?.data?.user ?? response?.data ?? response;

        if (!currentUser || typeof currentUser !== "object") {
          throw new Error("The server returned invalid user information.");
        }

        if (active) {
          setUser(currentUser);
        }
      } catch (err) {
        if (active) {
          setError(
            err?.message || "Unable to load your profile. Please try again.",
          );
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadProfile();

    return () => {
      active = false;
    };
  }, []);

  if (loading) {
    return (
      <main className={styles.page}>
        <section className={styles.card}>
          <p className={styles.message}>Loading your profile...</p>
        </section>
      </main>
    );
  }

  if (error) {
    return (
      <main className={styles.page}>
        <section className={styles.card}>
          <h1 className={styles.title}>Unable to load profile</h1>
          <p className={styles.error}>{error}</p>

          <div className={styles.actions}>
            <button
              className={styles.button}
              type="button"
              onClick={() => window.location.reload()}
            >
              Try again
            </button>

            <Link className={styles.link} to="/dashboard">
              Back to dashboard
            </Link>
          </div>
        </section>
      </main>
    );
  }

  const displayName =
    user?.name || user?.fullName || user?.full_name || user?.email || "User";

  const createdAt =
    user?.created_at ?? user?.createdAt ?? user?.created_at_date;

  return (
    <main className={styles.page}>
      <section className={styles.card}>
        <p className={styles.eyebrow}>AUTH SYSTEM</p>

        <div className={styles.avatar} aria-hidden="true">
          {displayName.charAt(0).toUpperCase()}
        </div>

        <h1 className={styles.title}>My Profile</h1>

        <p className={styles.description}>
          View your account information and verification status.
        </p>

        <div className={styles.details}>
          <div className={styles.detailRow}>
            <span className={styles.label}>Full name</span>
            <span className={styles.value}>{displayName}</span>
          </div>

          <div className={styles.detailRow}>
            <span className={styles.label}>Email address</span>
            <span className={styles.value}>
              {user?.email || "Not available"}
            </span>
          </div>

          <div className={styles.detailRow}>
            <span className={styles.label}>Email verification</span>
            <span className={styles.value}>{getVerificationStatus(user)}</span>
          </div>

          <div className={styles.detailRow}>
            <span className={styles.label}>Account created</span>
            <span className={styles.value}>{formatDate(createdAt)}</span>
          </div>
        </div>

        <div className={styles.actions}>
          <Link className={styles.link} to="/dashboard">
            Back to dashboard
          </Link>

          <Link className={styles.button} to="/change-password">
            Change password
          </Link>
        </div>
      </section>
    </main>
  );
}

export default Profile;
