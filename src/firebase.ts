// Import the functions you need from the SDKs you need
import { getAnalytics } from "firebase/analytics";
import { initializeApp } from "firebase/app";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
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
const analytics = getAnalytics(app);