import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { deleteEvent, setUserTimeout, type EventDoc } from "@/lib/events";
import { useAuth } from "@/lib/auth";
import { Header } from "@/components/Header";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Admin — Campus Map" },
      { name: "description", content: "Manage campus event markers and users." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminPage,
});

interface UserRow {
  id: string;
  email?: string;
  name?: string;
  timedOut?: boolean;
}

function AdminPage() {
  const { user, isAdmin, loading, signIn } = useAuth();
  const [events, setEvents] = useState<EventDoc[]>([]);
  const [users, setUsers] = useState<Record<string, UserRow>>({});
  const [busy, setBusy] = useState<string | null>(null);

  useEffect(() => {
    if (!isAdmin) return;
    const unsub1 = onSnapshot(collection(db, "events"), (snap) => {
      setEvents(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<EventDoc, "id">) })));
    });
    const unsub2 = onSnapshot(collection(db, "users"), (snap) => {
      const map: Record<string, UserRow> = {};
      snap.docs.forEach((d) => { map[d.id] = { id: d.id, ...(d.data() as Omit<UserRow, "id">) }; });
      setUsers(map);
    });
    return () => { unsub1(); unsub2(); };
  }, [isAdmin]);

  if (loading) return <Shell><p className="p-6">Loading…</p></Shell>;
  if (!user) return (
    <Shell>
      <div className="p-6 max-w-md mx-auto text-center space-y-4">
        <h1 className="text-2xl font-bold">Admin access</h1>
        <p className="text-muted-foreground">Sign in with the admin Google account to continue.</p>
        <button onClick={() => void signIn()} className="bg-primary text-primary-foreground rounded px-4 py-2">Sign in with Google</button>
      </div>
    </Shell>
  );
  if (!isAdmin) return (
    <Shell>
      <div className="p-6 max-w-md mx-auto text-center space-y-3">
        <h1 className="text-2xl font-bold">Not authorized</h1>
        <p className="text-muted-foreground">Your account does not have admin access.</p>
        <Link to="/" className="inline-block underline">Back to map</Link>
      </div>
    </Shell>
  );

  return (
    <Shell>
      <div className="max-w-5xl mx-auto p-6 space-y-8">
        <div>
          <h1 className="text-2xl font-bold mb-1">Admin Dashboard</h1>
          <p className="text-sm text-muted-foreground">Manage event markers and user access.</p>
        </div>

        <section>
          <h2 className="text-lg font-semibold mb-3">All markers ({events.length})</h2>
          <div className="border rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted">
                <tr>
                  <th className="text-left px-3 py-2">Category</th>
                  <th className="text-left px-3 py-2">Creator</th>
                  <th className="text-left px-3 py-2">Location</th>
                  <th className="px-3 py-2"></th>
                </tr>
              </thead>
              <tbody>
                {events.map((ev) => {
                  const u = users[ev.createdBy];
                  return (
                    <tr key={ev.id} className="border-t">
                      <td className="px-3 py-2 font-medium">{ev.category}</td>
                      <td className="px-3 py-2">
                        <div>{ev.creatorName || u?.name || "—"}</div>
                        <div className="text-xs text-muted-foreground">{ev.creatorEmail || u?.email}</div>
                      </td>
                      <td className="px-3 py-2 text-xs text-muted-foreground">{ev.lat.toFixed(5)}, {ev.lng.toFixed(5)}</td>
                      <td className="px-3 py-2 flex gap-2 justify-end">
                        <button
                          disabled={busy === "del-" + ev.id}
                          onClick={async () => { setBusy("del-" + ev.id); await deleteEvent(ev.id); setBusy(null); }}
                          className="text-xs bg-destructive text-destructive-foreground rounded px-2 py-1 disabled:opacity-50"
                        >
                          Delete
                        </button>
                        <button
                          disabled={busy === "to-" + ev.createdBy}
                          onClick={async () => {
                            setBusy("to-" + ev.createdBy);
                            const currently = users[ev.createdBy]?.timedOut ?? false;
                            await setUserTimeout(ev.createdBy, !currently);
                            setBusy(null);
                          }}
                          className="text-xs border rounded px-2 py-1 disabled:opacity-50"
                        >
                          {users[ev.createdBy]?.timedOut ? "Un-timeout" : "Timeout User"}
                        </button>
                      </td>
                    </tr>
                  );
                })}
                {events.length === 0 && (
                  <tr><td colSpan={4} className="px-3 py-6 text-center text-muted-foreground">No events yet.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      {children}
    </div>
  );
}
