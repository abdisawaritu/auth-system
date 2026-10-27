import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

import { authService } from "../services/authService";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [status, setStatus] = useState("checking");
  const [authError, setAuthError] = useState("");

  const refreshUser = useCallback(async () => {
    setAuthError("");

    try {
      const result = await authService.getCurrentUser();

      // Support common response shapes from the backend.
      const currentUser =
        result?.user ?? result?.data?.user ?? result?.data ?? result;

      if (
        !currentUser ||
        typeof currentUser !== "object" ||
        Array.isArray(currentUser) ||
        (!currentUser.id && !currentUser.userId && !currentUser.email)
      ) {
        throw new Error(
          "The server response did not contain valid user information.",
        );
      }

      setUser(currentUser);
      setStatus("authenticated");

      return currentUser;
    } catch (error) {
      if (error?.status === 401 || error?.status === 403) {
        setUser(null);
        setStatus("unauthenticated");
        setAuthError("");
        return null;
      }

      // A network/server failure is not proof that the user is logged out.
      setAuthError(
        error?.message || "Unable to check your session. Please try again.",
      );
      setStatus("error");

      throw error;
    }
  }, []);

  useEffect(() => {
    let isMounted = true;

    async function checkSession() {
      try {
        await refreshUser();
      } catch {
        // The error is represented by the context's status and authError.
      }
    }

    checkSession();

    return () => {
      isMounted = false;
    };
  }, [refreshUser]);

  const login = useCallback(
    async (credentials) => {
      await authService.login(credentials);

      // Confirm that the new session works on a separate request.
      const currentUser = await refreshUser();

      if (!currentUser) {
        throw new Error(
          "Login was not confirmed. Please check your account and try again.",
        );
      }

      return currentUser;
    },
    [refreshUser],
  );

  const logout = useCallback(async () => {
    try {
      await authService.logout();
    } finally {
      // Clear frontend authentication state even if logout reports an error.
      setUser(null);
      setStatus("unauthenticated");
      setAuthError("");
    }
  }, []);

  const value = {
    user,
    status,
    authError,
    isAuthenticated: status === "authenticated",
    isLoading: status === "checking",
    login,
    logout,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside an AuthProvider.");
  }

  return context;
}
