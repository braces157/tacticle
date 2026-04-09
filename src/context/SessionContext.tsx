import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { Navigate, useLocation } from "react-router-dom";
import { authService } from "../services/storefrontApi";
import { updateStoredSessionUser } from "../services/authStorage";
import type { AuthUser } from "../types/domain";

type SessionContextValue = {
  user: AuthUser | null;
  loading: boolean;
  login(email: string, password: string): Promise<AuthUser>;
  register(name: string, email: string, password: string): Promise<AuthUser>;
  completeOAuthLogin(token: string): Promise<AuthUser>;
  logout(): Promise<void>;
  requestPasswordReset(email: string): Promise<void>;
  changePassword(password: string): Promise<void>;
  syncUser(user: AuthUser): void;
};

const SessionContext = createContext<SessionContextValue | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    authService
      .getCurrentUser()
      .then((currentUser) => {
        setUser(currentUser);
      })
      .catch(() => {
        setUser(null);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  async function login(email: string, password: string) {
    const currentUser = await authService.login(email, password);
    setUser(currentUser);
    return currentUser;
  }

  async function register(name: string, email: string, password: string) {
    const currentUser = await authService.register(name, email, password);
    setUser(currentUser);
    return currentUser;
  }

  async function completeOAuthLogin(token: string) {
    const currentUser = await authService.completeOAuthLogin(token);
    setUser(currentUser);
    return currentUser;
  }

  async function logout() {
    await authService.logout();
    setUser(null);
  }

  async function requestPasswordReset(email: string) {
    await authService.requestPasswordReset(email);
  }

  async function changePassword(password: string) {
    await authService.changePassword(password);
  }

  function syncUser(nextUser: AuthUser) {
    setUser(nextUser);
    updateStoredSessionUser(nextUser);
  }

  return (
    <SessionContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        completeOAuthLogin,
        logout,
        requestPasswordReset,
        changePassword,
        syncUser,
      }}
    >
      {children}
    </SessionContext.Provider>
  );
}

export function useSession() {
  const context = useContext(SessionContext);
  if (!context) {
    throw new Error("useSession must be used within SessionProvider");
  }
  return context;
}

export function RequireAuth({ children }: { children: ReactNode }) {
  const { user, loading } = useSession();
  const location = useLocation();

  if (loading) {
    return (
      <div className="mx-auto max-w-6xl px-6 py-24 text-sm text-[var(--color-muted)]">
        Loading account…
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return <>{children}</>;
}

export function RequireAdmin({ children }: { children: ReactNode }) {
  const { user, loading } = useSession();
  const location = useLocation();

  if (loading) {
    return (
      <div className="mx-auto max-w-6xl px-6 py-24 text-sm text-[var(--color-muted)]">
        Loading admin workspace…
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  if (user.role !== "admin") {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
