import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { onAuthStateChanged, signInWithPopup, signInWithRedirect, signOut, type User } from "firebase/auth";
import { auth, googleProvider, ADMIN_EMAIL } from "./firebase";

interface AuthCtx {
  user: User | null;
  loading: boolean;
  isAdmin: boolean;
  signIn: () => Promise<void>;
  signOutUser: () => Promise<void>;
}

const Ctx = createContext<AuthCtx | null>(null);

function isInIframe() {
  try {
    return window.self !== window.top;
  } catch {
    return true;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    return onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
  }, []);

  const value: AuthCtx = {
    user,
    loading,
    isAdmin: user?.email === ADMIN_EMAIL,
    signIn: async () => {
      // Google sign-in popups are blocked inside iframes (like the Lovable
      // preview). Open the live app in a new tab instead.
      if (isInIframe()) {
        window.open(window.location.href, "_blank", "noopener");
        throw new Error("Opened the app in a new tab — sign in there. Popups are blocked inside the preview.");
      }
      try {
        await signInWithPopup(auth, googleProvider);
      } catch (err) {
        const code = (err as { code?: string }).code;
        if (code === "auth/popup-blocked" || code === "auth/operation-not-supported-in-this-environment") {
          await signInWithRedirect(auth, googleProvider);
          return;
        }
        throw err;
      }
    },
    signOutUser: async () => {
      await signOut(auth);
    },
  };
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAuth() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useAuth must be inside AuthProvider");
  return ctx;
}
