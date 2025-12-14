import { initializeApp } from "firebase/app";
import { connectAuthEmulator, getAuth } from "firebase/auth";
import {
  connectFirestoreEmulator,
  getFirestore,
} from "firebase/firestore";
import { connectStorageEmulator, getStorage } from "firebase/storage";



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
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);


// EMULATORY – tylko Auth + Firestore


const USE_EMULATORS = true;

if (USE_EMULATORS) {
 // const EMULATOR_HOST = "192.168.1.30";
   const EMULATOR_HOST = "localhost";

  console.log("Connecting to Firebase Emulators...");

  // Auth Emulator (9099)
  connectAuthEmulator(auth, `http://${EMULATOR_HOST}:9099`, {
    disableWarnings: true,
  });

  // Firestore Emulator (8080)
  connectFirestoreEmulator(db, EMULATOR_HOST, 8080);

   connectStorageEmulator(storage, EMULATOR_HOST, 9199);
}
