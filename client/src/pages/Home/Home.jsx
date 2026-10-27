import { Link } from "react-router-dom";
import PagePlaceholder from "../../components/common/PagePlaceholder";
import styles from "./Home.module.css";

function Home() {
  return (
    <main className={styles.homePage}>
      <header className={styles.header}>
        <Link to="/" className={styles.logo}>
          Auth System
        </Link>

        <nav className={styles.navigation} aria-label="Main navigation">
          <Link to="/login" className={styles.signInButton}>
            Sign In
          </Link>
        </nav>
      </header>

      <section className={styles.content}>
        <PagePlaceholder
          title="Welcome to Auth System"
          description="Your authentication application starts here."
        />
      </section>
    </main>
  );
}

export default Home;
