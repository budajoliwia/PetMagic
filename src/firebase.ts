import { initializeApp } from "firebase/app";
import { connectAuthEmulator, getAuth } from "firebase/auth";
import { connectFirestoreEmulator, getFirestore } from "firebase/firestore";
import { connectStorageEmulator, getStorage } from "firebase/storage";

// Twoja konfiguracja z Firebase Console
const firebaseConfig = {
  apiKey: "TWÓJ_API_KEY",
  authDomain: "petmagicai.firebaseapp.com",
  projectId: "petmagicai",
  storageBucket: "petmagicai.firebasestorage.app",
  messagingSenderId: "955543695700",
  appId: "1:955543695700:web:74142be663d22a7cc0d8c1",
  measurementId: "G-4X4NBN89TH",
};

// 1. Inicjalizacja appki Firebase
const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

// 2. Przełącznik: emulatory vs chmura
// Na webie chcemy korzystać z emulatorów → ustaw true
const USE_EMULATORS = true;

if (USE_EMULATORS) {
  const emulatorHost = "localhost"; // web działa na tym samym komputerze co emulatory

  console.log(`🔌 Connecting to Firebase Emulators on ${emulatorHost}...`);

  try {
    // Auth emulator – port 9099
    connectAuthEmulator(auth, `http://${emulatorHost}:9099`, {
      disableWarnings: true,
    });
    // Firestore emulator – port 8080
    connectFirestoreEmulator(db, emulatorHost, 8080);
    // Storage emulator – port 9199
    connectStorageEmulator(storage, emulatorHost, 9199);

    console.log("Connected to Firebase Emulators");
  } catch (error) {
    console.error("Error connecting to emulators:", error);
  }
}