import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { useAuth } from "@/lib/auth";

export function Header() {
  const { user, isAdmin, signIn, signOutUser } = useAuth();
  const [msg, setMsg] = useState<string | null>(null);

  async function handleSignIn() {
    setMsg(null);
    try {
      await signIn();
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Sign-in failed");
    }
  }

  return (
    <header className="h-14 border-b bg-card flex items-center justify-between px-4 z-[1001] relative">
      <Link to="/" className="font-bold text-lg">Campus Map</Link>
      <nav className="flex items-center gap-3">
        {isAdmin && (
          <Link to="/admin" className="text-sm hover:underline">Admin</Link>
        )}
        {user ? (
          <>
            <span className="text-sm text-muted-foreground hidden sm:inline">{user.displayName ?? user.email}</span>
            <button onClick={() => void signOutUser()} className="text-sm border rounded px-3 py-1.5 hover:bg-accent">Sign out</button>
          </>
        ) : (
          <button onClick={handleSignIn} className="inline-flex items-center gap-2 text-sm bg-primary text-primary-foreground rounded-full pl-2 pr-4 py-1.5 hover:opacity-90 shadow-sm">
            <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-white">
              <svg width="14" height="14" viewBox="0 0 48 48" aria-hidden="true">
                <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3c-1.6 4.7-6.1 8-11.3 8-6.6 0-12-5.4-12-12s5.4-12 12-12c3 0 5.8 1.1 7.9 3l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z"/>
                <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 16 19 13 24 13c3 0 5.8 1.1 7.9 3l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.6 8.3 6.3 14.7z"/>
                <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.5-5.2l-6.2-5.3C29.2 35 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z"/>
                <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.3 4.3-4.2 5.6l6.2 5.3C41.9 35.9 44 30.4 44 24c0-1.3-.1-2.4-.4-3.5z"/>
              </svg>
            </span>
            Sign in with Google
          </button>
        )}
      </nav>
      {msg && (
        <div className="absolute top-full right-4 mt-2 bg-card border shadow-lg rounded px-3 py-2 text-xs max-w-xs">
          {msg}
        </div>
      )}
    </header>
  );
}

