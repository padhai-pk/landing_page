// src/firebase.js
// Firebase initialization for Padhai.pk waitlist.
//
// Fill in your own project config below (Firebase Console → Project Settings
// → General → Your apps → SDK setup and configuration). Do NOT commit real
// keys to a public repo without Firestore security rules locked down —
// see /firestore.rules in this project for the rules to deploy alongside this.

import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'YOUR_API_KEY',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'YOUR_PROJECT.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'YOUR_PROJECT_ID',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'YOUR_PROJECT.appspot.com',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || 'YOUR_SENDER_ID',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || 'YOUR_APP_ID',
};

export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
