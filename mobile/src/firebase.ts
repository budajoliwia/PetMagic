import AsyncStorage from "@react-native-async-storage/async-storage";
import { initializeApp } from "firebase/app";
import * as FirebaseAuth from "firebase/auth";
import {
  connectFirestoreEmulator,
  getFirestore,
} from "firebase/firestore";
import { connectStorageEmulator, getStorage } from "firebase/storage";
import { Platform } from "react-native";
import { getEmulatorHost, USE_EMULATORS } from "./emulators";



type FirebaseWebConfig = {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
  measurementId?: string;
};

function requireNonEmpty(value: string | undefined, name: string): string {
  if (value && value.trim()) return value.trim();
  throw new Error(`Missing ${name}. Create mobile/.env (see mobile/env.example) and restart Expo.`);
}

const firebaseConfig: FirebaseWebConfig = {
  apiKey: requireNonEmpty(process.env.EXPO_PUBLIC_FIREBASE_API_KEY, "EXPO_PUBLIC_FIREBASE_API_KEY"),
  authDomain: requireNonEmpty(process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN, "EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN"),
  projectId: requireNonEmpty(process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID, "EXPO_PUBLIC_FIREBASE_PROJECT_ID"),
  storageBucket: requireNonEmpty(process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET, "EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET"),
  messagingSenderId: requireNonEmpty(
    process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    "EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID"
  ),
  appId: requireNonEmpty(process.env.EXPO_PUBLIC_FIREBASE_APP_ID, "EXPO_PUBLIC_FIREBASE_APP_ID"),
  measurementId: process.env.EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID?.trim(),
};

// Inicjalizacja aplikacji Firebase
const app = initializeApp(firebaseConfig);

// SDK
export const auth = (() => {
  const { getAuth, initializeAuth } = FirebaseAuth;

  if (Platform.OS === "web") return getAuth(app);

  // In dev, Fast Refresh can re-evaluate modules: calling initializeAuth twice throws.
  // If already initialized, fall back to getAuth(app).
  try {
    return initializeAuth(app, {
      // Firebase's RN persistence helper exists at runtime, but its TS types are not always
      // available depending on the firebase build resolution. Use a safe `any` bridge.
      persistence: (FirebaseAuth as any).getReactNativePersistence?.(AsyncStorage),
    });
  } catch {
    return getAuth(app);
  }
})();
export const db = getFirestore(app);
export const storage = getStorage(app);


// EMULATORY
if (USE_EMULATORS) {
  const host = getEmulatorHost();
  console.log(`Connecting to Firebase Emulators... host=${host}`);

  // Auth Emulator (9099)
  try {
    FirebaseAuth.connectAuthEmulator(auth, `http://${host}:9099`, {
      disableWarnings: true,
    });
  } catch {
    // Fast refresh / double init: ignore if already connected.
  }

  // Firestore Emulator (8080)
  try {
    connectFirestoreEmulator(db, host, 8080);
  } catch {
    // ignore if already connected
  }

  // Storage Emulator (9199)
  try {
    connectStorageEmulator(storage, host, 9199);
  } catch {
    // ignore if already connected
  }
}
