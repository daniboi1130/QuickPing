/**
 * Firebase Configuration and Setup
 * 
 * This module initializes and configures Firebase services for the QuickPinger app.
 * It provides access to:
 * 1. Authentication - For user login and account management
 * 2. Firestore Database - For storing contacts and user data
 * 3. Local Storage - For offline data persistence
 * 
 * @module Firebase/Config
 */

/**
 * External Dependencies
 * Core Firebase modules and local storage functionality
 * 
 * @requires firebase/app - Core Firebase functionality
 * @requires firebase/auth - User authentication services
 * @requires firebase/firestore - Cloud database services
 * @requires @react-native-async-storage/async-storage - Local data storage
 */
import { initializeApp } from "firebase/app";
import { 
  initializeAuth, 
  getReactNativePersistence 
} from 'firebase/auth';
import { getFirestore } from "firebase/firestore";
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Firebase Project Configuration
 * 
 * Security credentials and settings for the QuickPinger Firebase project.
 * These values are obtained from the Firebase Console:
 * https://console.firebase.google.com/
 * 
 * SECURITY NOTE: In a production environment, these values should be stored
 * in environment variables or secure configuration management system.
 * 
 * @constant {Object} firebaseConfig
 * @property {string} apiKey - Project API authentication key
 * @property {string} authDomain - Firebase Auth domain name
 * @property {string} projectId - Unique project identifier
 * @property {string} storageBucket - Cloud Storage bucket location
 * @property {string} messagingSenderId - Cloud Messaging identifier
 * @property {string} appId - Unique app registration identifier
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
 * Firebase Application Instance
 * 
 * Creates the main Firebase app instance using the configuration.
 * This is the core connection to Firebase services.
 * 
 * @constant {FirebaseApp} app
 * @throws {FirebaseError} If initialization fails
 */
const app = initializeApp(firebaseConfig);

/**
 * Firestore Database Connection
 * 
 * Initializes connection to Cloud Firestore database.
 * Used for storing and retrieving:
 * - User profiles
 * - Contact lists
 * - Application data
 * 
 * @constant {Firestore} db
 * @throws {FirebaseError} If database connection fails
 */
const db = getFirestore(app);

/**
 * Authentication Service
 * 
 * Sets up Firebase Authentication with local data persistence.
 * Features:
 * - User login/signup
 * - Session management
 * - Offline authentication state
 * 
 * Uses AsyncStorage for persistent login sessions.
 * 
 * @constant {Auth} auth
 * @throws {FirebaseError} If authentication setup fails
 */
const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage)
});

/**
 * Module Exports
 * 
 * Provides access to initialized Firebase services:
 * @exports app - Core Firebase application instance
 * @exports db - Firestore database connection
 * @exports auth - Authentication service
 */
export { app, db, auth };