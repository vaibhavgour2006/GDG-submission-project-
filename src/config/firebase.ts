import { initializeApp, getApps, type FirebaseApp } from "firebase/app";
import { getAnalytics, isSupported } from "firebase/analytics";
import { 
  getFirestore, 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  onSnapshot, 
  type Firestore 
} from "firebase/firestore";

// Config provided by user for gdg-quest-game
export const firebaseConfig = {
  apiKey: "AIzaSyAM2tWyBxqavsoH4VN4a28kIfhwwLXNyMQ",
  authDomain: "gdg-quest-game.firebaseapp.com",
  projectId: "gdg-quest-game",
  storageBucket: "gdg-quest-game.firebasestorage.app",
  messagingSenderId: "318279936108",
  appId: "1:318279936108:web:8b3ed17e895d4faa0ed049",
  measurementId: "G-TGBTNM7N9J"
};

let app: FirebaseApp;
let db: Firestore | null = null;

try {
  if (!getApps().length) {
    app = initializeApp(firebaseConfig);
  } else {
    app = getApps()[0];
  }
  db = getFirestore(app);

  // Analytics is optional and only supported in client environments
  if (typeof window !== "undefined") {
    isSupported().then((supported) => {
      if (supported) {
        getAnalytics(app);
      }
    }).catch(() => {
      // Ignore analytics unsupported in some iframes
    });
  }
} catch (error) {
  console.warn("Firebase initialization notice:", error);
}

export { app, db, collection, doc, setDoc, getDoc, getDocs, onSnapshot };
