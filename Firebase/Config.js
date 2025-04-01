// External imports
import { initializeApp } from "firebase/app";
import { initializeAuth, getReactNativePersistence } from 'firebase/auth';
import { getFirestore } from "firebase/firestore";
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Firebase Configuration Object
 * Contains essential firebase setup parameters
 */
const firebaseConfig = {
    apiKey: "AIzaSyDsx1ZUVBiE83sCrAdS2IOrnAEywgmy93g",
    authDomain: "quickping-8e201.firebaseapp.com",
    projectId: "quickping-8e201",
    storageBucket: "quickping-8e201.firebasestorage.app",
    messagingSenderId: "983742320636",
    appId: "1:983742320636:web:3cc0e171cc7ceb6623ec79"
  };

/**
 * Firebase Initialization
 * Initialize the Firebase app and database connection
 */
const app = initializeApp(firebaseConfig);

// Initialize Firestore
const db = getFirestore(app);

// Initialize Auth with AsyncStorage persistence
const auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage)
});

export { app, db, auth };