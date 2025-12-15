import { initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getStorage } from "firebase-admin/storage";
import "../env"; // Load env vars first (for local emulator)

// Initialize once
const app = initializeApp();

export const db = getFirestore(app);
export const storage = getStorage(app);

