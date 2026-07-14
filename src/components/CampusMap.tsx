import { useEffect, useMemo, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from "react-leaflet";
import L from "leaflet";
import { toast } from "sonner";
import {
  CATEGORIES,
  createEvent,
  ensureCanCreate,
  subscribeEvents,
  type EventCategory,
  type EventDoc,
} from "@/lib/events";
import { useAuth } from "@/lib/auth";

// Fix default marker icons for bundlers
delete (L.Icon.Default.prototype as unknown as { _getIconUrl?: unknown })._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

const CENTER: [number, number] = [16.49414, 80.499176];
const BOUNDS: [[number, number], [number, number]] = [
  [16.4895, 80.4945],
  [16.499, 80.504],
];
const MIN_ZOOM = 17;
const MAX_ZOOM = 20;

const CATEGORY_COLORS: Record<EventCategory, string> = {
  Music: "#8b5cf6",
  Sports: "#10b981",
  Coding: "#3b82f6",
  Study: "#f59e0b",
  Misc: "#ef4444",
};

function coloredIcon(color: string) {
  return L.divIcon({
    className: "",
    html: `<div style="background:${color};width:22px;height:22px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);border:2px solid white;box-shadow:0 2px 6px rgba(0,0,0,.3)"></div>`,
    iconSize: [22, 22],
    iconAnchor: [11, 22],
    popupAnchor: [0, -22],
  });
}

function ClickCapture({
  onPick,
  enabled,
}: {
  onPick: (ll: [number, number]) => void;
  enabled: boolean;
}) {
  useMapEvents({
    click(e) {
      if (enabled) onPick([e.latlng.lat, e.latlng.lng]);
    },
  });
  return null;
}

export default function CampusMap() {
  const { user, signIn } = useAuth();
  const [events, setEvents] = useState<EventDoc[]>([]);
  const [placing, setPlacing] = useState(false);
  const [pending, setPending] = useState<[number, number] | null>(null);
  const [category, setCategory] = useState<EventCategory>("Music");
  const [saving, setSaving] = useState(false);

  useEffect(() => subscribeEvents(setEvents), []);

  const icons = useMemo(
    () =>
      Object.fromEntries(CATEGORIES.map((c) => [c, coloredIcon(CATEGORY_COLORS[c])])) as Record<
        EventCategory,
        L.DivIcon
      >,
    [],
  );

  async function handleAddClick() {
    if (!user) {
      try {
        await signIn();
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Sign-in failed");
      }
      return;
    }
    const check = await ensureCanCreate(user.uid);
    if (!check.ok) {
      toast.error(check.reason ?? "Cannot create event");
      return;
    }
    setPlacing(true);
    toast("Click anywhere on the map to place your event.");
  }

  function cancel() {
    setPending(null);
    setPlacing(false);
  }

  async function handleSave() {
    if (!user || !pending) return;
    setSaving(true);
    try {
      const check = await ensureCanCreate(user.uid);
      if (!check.ok) {
        toast.error(check.reason ?? "Limit reached");
        return;
      }
      await createEvent({
        lat: pending[0],
        lng: pending[1],
        category,
        uid: user.uid,
        email: user.email ?? "",
        name: user.displayName ?? "Anonymous",
      });
      toast.success("Event added!");
      cancel();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="relative h-full w-full">
      <MapContainer
        center={CENTER}
        zoom={17}
        minZoom={MIN_ZOOM}
        maxZoom={MAX_ZOOM}
        maxBounds={BOUNDS}
        maxBoundsViscosity={1.0}
        className="h-full w-full"
        scrollWheelZoom
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          maxZoom={MAX_ZOOM}
        />
        <ClickCapture enabled={placing && !pending} onPick={setPending} />
        {events.map((ev) => (
          <Marker key={ev.id} position={[ev.lat, ev.lng]} icon={icons[ev.category] ?? icons.Music}>
            <Popup>
              <div className="space-y-1">
                <div className="font-semibold" style={{ color: CATEGORY_COLORS[ev.category] }}>
                  {ev.category}
                </div>
                <div className="text-xs text-muted-foreground">
                  by {ev.creatorName || ev.creatorEmail}
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
        {pending && <Marker position={pending} icon={icons[category]} />}
      </MapContainer>

      <div className="absolute top-4 right-4 z-[1000] flex flex-col gap-2 items-end">
        {!placing ? (
          <button
            onClick={handleAddClick}
            className="bg-primary text-primary-foreground shadow-lg rounded-full px-5 py-2.5 font-medium hover:opacity-90"
          >
            + Add Event
          </button>
        ) : (
          <button
            onClick={cancel}
            className="bg-card border shadow-lg rounded-full px-5 py-2.5 font-medium hover:bg-accent"
          >
            {pending ? "Change location" : "Click on map…"} · Cancel
          </button>
        )}
      </div>

      <div className="absolute bottom-4 left-4 z-[1000] bg-card/95 backdrop-blur rounded-lg shadow-lg p-3 text-sm">
        <div className="font-semibold mb-1.5">Categories</div>
        <div className="grid grid-cols-1 gap-1">
          {CATEGORIES.map((c) => (
            <div key={c} className="flex items-center gap-2">
              <span
                className="inline-block w-3 h-3 rounded-full"
                style={{ background: CATEGORY_COLORS[c] }}
              />
              <span>{c}</span>
            </div>
          ))}
        </div>
      </div>

      {pending && (
        <div
          className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/50 p-4"
          onClick={cancel}
        >
          <div
            className="bg-card rounded-xl shadow-2xl p-6 w-full max-w-sm space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div>
              {/* Comment here */}
              <h2 className="text-lg font-semibold">New Event</h2>
              <p className="text-xs text-muted-foreground mt-1">
                {pending[0].toFixed(5)}, {pending[1].toFixed(5)}
              </p>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as EventCategory)}
                className="w-full border rounded-md px-3 py-2 text-sm bg-background"
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex gap-2 pt-2">
              <button
                onClick={cancel}
                className="flex-1 border rounded-md px-3 py-2 text-sm hover:bg-accent"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 bg-primary text-primary-foreground rounded-md px-3 py-2 text-sm font-medium disabled:opacity-50"
              >
                {saving ? "Saving…" : "Save Event"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
