import { Navigate, Outlet, useLocation } from "react-router-dom";

import { useAuth } from "../../context/AuthContext";

function ProtectedRoute() {
  const { status, authError, refreshUser } = useAuth();
  const location = useLocation();

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
          <button type="button" onClick={() => refreshUser()}>
            Try again
          </button>
        </section>
      </main>
    );
  }

  if (status === "unauthenticated") {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return <Outlet />;
}

export default ProtectedRoute;
