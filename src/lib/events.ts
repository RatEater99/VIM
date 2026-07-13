import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  Timestamp,
  updateDoc,
  where,
  getDocs,
} from "firebase/firestore";
import { db, MAX_EVENTS_PER_DAY } from "./firebase";

export type EventCategory = "Music" | "Sports" | "Coding" | "Study" | "Misc";
export const CATEGORIES: EventCategory[] = ["Music", "Sports", "Coding", "Study", "Misc"];

export interface EventDoc {
  id: string;
  lat: number;
  lng: number;
  category: EventCategory;
  createdBy: string;
  creatorEmail: string;
  creatorName: string;
  createdAt: Timestamp | null;
}

export function subscribeEvents(cb: (events: EventDoc[]) => void) {
  return onSnapshot(collection(db, "events"), (snap) => {
    const rows: EventDoc[] = snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<EventDoc, "id">) }));
    cb(rows);
  });
}

export async function isUserTimedOut(uid: string): Promise<boolean> {
  const snap = await getDoc(doc(db, "users", uid));
  return !!snap.data()?.timedOut;
}

export async function ensureCanCreate(uid: string): Promise<{ ok: boolean; reason?: string }> {
  if (await isUserTimedOut(uid)) return { ok: false, reason: "You have been timed out by an admin." };
  const since = Timestamp.fromMillis(Date.now() - 24 * 60 * 60 * 1000);
  const q = query(
    collection(db, "events"),
    where("createdBy", "==", uid),
    where("createdAt", ">=", since),
  );
  const snap = await getDocs(q);
  if (snap.size >= MAX_EVENTS_PER_DAY) {
    return { ok: false, reason: `Limit reached: ${MAX_EVENTS_PER_DAY} events per 24h.` };
  }
  return { ok: true };
}

export async function createEvent(input: {
  lat: number;
  lng: number;
  category: EventCategory;
  uid: string;
  email: string;
  name: string;
}) {
  // Track user
  await setDoc(
    doc(db, "users", input.uid),
    { email: input.email, name: input.name, lastActive: serverTimestamp() },
    { merge: true },
  );
  await addDoc(collection(db, "events"), {
    lat: input.lat,
    lng: input.lng,
    category: input.category,
    createdBy: input.uid,
    creatorEmail: input.email,
    creatorName: input.name,
    createdAt: serverTimestamp(),
  });
}

export async function deleteEvent(id: string) {
  await deleteDoc(doc(db, "events", id));
}

export async function setUserTimeout(uid: string, timedOut: boolean) {
  await setDoc(doc(db, "users", uid), { timedOut }, { merge: true });
}

export async function updateUserTimeout(uid: string, timedOut: boolean) {
  await updateDoc(doc(db, "users", uid), { timedOut });
}
