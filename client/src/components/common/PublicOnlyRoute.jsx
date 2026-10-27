import { Navigate, Outlet } from "react-router-dom";

import { useAuth } from "../../context/AuthContext";

function PublicOnlyRoute() {
  const { status, authError } = useAuth();

  if (status === "checking") {
    return (
      <main
        style={{
          minHeight: "100vh",
          display: "grid",
          placeItems: "center",
          padding: "2rem",
        }}
        aria-live="polite"
      >
        Checking your session...
      </main>
    );
  }

  if (status === "error") {
    return (
      <main
        style={{
          minHeight: "100vh",
          display: "grid",
          placeItems: "center",
          padding: "2rem",
          textAlign: "center",
        }}
      >
        <section>
          <h1>Unable to verify your session</h1>
          <p role="alert">{authError}</p>
          <p>Please check your connection and reload the page.</p>
        </section>
      </main>
    );
  }

  if (status === "authenticated") {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
}

export default PublicOnlyRoute;
