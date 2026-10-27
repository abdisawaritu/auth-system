import { Link, useNavigate } from "react-router-dom";

import { useAuth } from "../../context/AuthContext";
import styles from "./Dashboard.module.css";

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

function Dashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const displayName =
    user?.name || user?.fullName || user?.full_name || user?.email || "User";

  async function handleLogout() {
    try {
      await logout();
    } catch (error) {
      console.error("Logout request failed:", error);
    } finally {
      navigate("/login", { replace: true });
    }
  }

  return (
    <main className={styles.page}>
      <section className={styles.card}>
        <p className={styles.eyebrow}>AUTH SYSTEM</p>

        <h1 className={styles.title}>Welcome, {displayName}!</h1>

        <p className={styles.description}>
          You have successfully accessed your protected dashboard.
        </p>

        {user?.email && (
          <p className={styles.email}>
            Signed in as <strong>{user.email}</strong>
          </p>
        )}

        <p className={styles.description}>
          Email verification: <strong>{getVerificationStatus(user)}</strong>
        </p>

        <div className={styles.actions}>
          <Link className={styles.link} to="/profile">
            View profile
          </Link>

          <Link className={styles.link} to="/change-password">
            Change password
          </Link>

          <button className={styles.link} type="button" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </section>
    </main>
  );
}

export default Dashboard;
