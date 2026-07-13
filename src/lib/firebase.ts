import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAYYqFtawaxx9PCplNOs25_zD2CEq6HMbY",
  authDomain: "yuvrajswebsiteisverygoated.firebaseapp.com",
  projectId: "yuvrajswebsiteisverygoated",
  storageBucket: "yuvrajswebsiteisverygoated.firebasestorage.app",
  messagingSenderId: "667008756465",
  appId: "1:667008756465:web:c6124a0b0c15d722265750",
  measurementId: "G-NQTQZ9YDRG",
};

export const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();

export const ADMIN_EMAIL = "syuvraj2007@gmail.com";
export const MAX_EVENTS_PER_DAY = 3;
