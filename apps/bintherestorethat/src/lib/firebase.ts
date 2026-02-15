import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCDs1Us2wlPibcCprKVaCnuFdAAUhJxEfY",
  authDomain: "studio-5962175046-a9cb5.firebaseapp.com",
  projectId: "studio-5962175046-a9cb5",
  storageBucket: "studio-5962175046-a9cb5.appspot.com",
  messagingSenderId: "1036746542561",
  appId: "1:1036746542561:web:7efacf1bc0011271dad6a0"
};


// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app);

export { app, db };
