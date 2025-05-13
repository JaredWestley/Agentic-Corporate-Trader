// src/config/firebaseConfig.tsx

import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
    apiKey: "Enter-Your-Info-Here",
    authDomain: "Enter-Your-Info-Here",
    projectId: "Enter-Your-Info-Here",
    storageBucket: "Enter-Your-Info-Here",
    messagingSenderId: "Enter-Your-Info-Here",
    appId: "Enter-Your-Info-Here",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

// Initialize Google Auth Provider
const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: "select_account" });

// Google Sign-In function
export const signInWithGooglePopup = () => signInWithPopup(auth, googleProvider);

