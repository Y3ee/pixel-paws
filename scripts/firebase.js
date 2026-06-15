/* scripts/firebase.js */
import { initializeApp } from "firebase/app";
import { getAuth, signInAnonymously, onAuthStateChanged } from "firebase/auth";
import { getFirestore, doc, setDoc, getDoc } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAHzNW9kRvd9IBYGVJvlTk8mHgjSa8lU9k",
  authDomain: "pixel-paws-5225f.firebaseapp.com",
  projectId: "pixel-paws-5225f",
  storageBucket: "pixel-paws-5225f.firebasestorage.app",
  messagingSenderId: "627525838733",
  appId: "1:627525838733:web:c9f268198dd66f42233fc4",
  measurementId: "G-RCRD2W5FV2"
};

let app, auth, db;
let isFirebaseEnabled = false;

try {
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);
  isFirebaseEnabled = true;
  console.log("Firebase initialized successfully!");
} catch (error) {
  console.error("Firebase failed to initialize. Falling back to LocalStorage.", error);
}

export { auth, db, isFirebaseEnabled, signInAnonymously, onAuthStateChanged, doc, setDoc, getDoc };
