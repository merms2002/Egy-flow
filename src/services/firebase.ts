import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBSigwZ-mXSbRwxYOD-Gp0rN8A8jP5QNt0",
  authDomain: "testyyy-6101b.firebaseapp.com",
  projectId: "testyyy-6101b",
  storageBucket: "testyyy-6101b.firebasestorage.app",
  messagingSenderId: "739295124127",
  appId: "1:739295124127:web:0aea278699914e6352a0aa",
  measurementId: "G-5MB2RRVE6F"
};

import { getStorage } from "firebase/storage";

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const db = getFirestore(app);
export const storage = getStorage(app);
