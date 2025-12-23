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



// Konfiguracja Firebase (z Firebase Console)
const firebaseConfig = {
  apiKey: "TWÓJ_API_KEY",
  authDomain: "petmagicai.firebaseapp.com",
  projectId: "petmagicai",
  storageBucket: "petmagicai.firebasestorage.app",
  messagingSenderId: "955543695700",
  appId: "1:955543695700:web:74142be663d22a7cc0d8c1",
  measurementId: "G-4X4NBN89TH",
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
