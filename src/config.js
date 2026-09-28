import { initializeApp } from "firebase/app";
import { getAuth,GoogleAuthProvider } from "firebase/auth";


export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyD3hf3lpdNqH9EisX9tPsWsn1WSWpwCy9Y",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "ecommerce-de7a6.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "ecommerce-de7a6",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "ecommerce-de7a6.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "231451986009",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:231451986009:web:f9d78d5c3a90cf2d214948"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const googleAuth = new GoogleAuthProvider();

export {auth,googleAuth};