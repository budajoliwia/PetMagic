// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCwV0G7BKrPbs0YdWwHUjrySA2WK-x13-M",
  authDomain: "petmagicai.firebaseapp.com",
  projectId: "petmagicai",
  storageBucket: "petmagicai.firebasestorage.app",
  messagingSenderId: "955543695700",
  appId: "1:955543695700:web:74142be663d22a7cc0d8c1",
  measurementId: "G-4X4NBN89TH"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
