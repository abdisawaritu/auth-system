import styles from "./PagePlaceholder.module.css";

function PagePlaceholder({ title, description, children }) {
  return (
    <main className={styles.page}>
      <section className={styles.card}>
        <p className={styles.label}>AUTH SYSTEM</p>

        <h1 className={styles.title}>{title}</h1>

        <p className={styles.description}>{description}</p>

        {children && <div className={styles.actions}>{children}</div>}
      </section>
    </main>
  );
}

export default PagePlaceholder;
