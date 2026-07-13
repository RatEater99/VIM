import { Link } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth";

export function Header() {
  const { user, isAdmin, signIn, signOutUser } = useAuth();
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
          <button onClick={() => void signIn()} className="text-sm bg-primary text-primary-foreground rounded px-3 py-1.5 hover:opacity-90">Sign in with Google</button>
        )}
      </nav>
    </header>
  );
}
