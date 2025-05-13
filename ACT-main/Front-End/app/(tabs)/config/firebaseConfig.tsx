// src/config/firebaseConfig.tsx

import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
    apiKey: "AIzaSyCPPcbzCrqV4qtCwdBYLdV2-nGTSDHvafU",
    authDomain: "mtu-act.firebaseapp.com",
    projectId: "mtu-act",
    storageBucket: "mtu-act.appspot.com",
    messagingSenderId: "57164033797",
    appId: "1:57164033797:web:c315903a913d8308e3d16c",
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

