/**
 * firebase.js — Bella Massa
 * Configuração e helpers do Firebase
 * Firestore Database + Authentication
 */
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js';
import {
  getFirestore,
  collection,
  addDoc,
  doc,
  updateDoc,
  deleteDoc,
  setDoc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  orderBy,
  where,
  limit,
  serverTimestamp,
  Timestamp,
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';
import {
  getAuth,
  signInWithEmailAndPassword,
  onAuthStateChanged,
  signOut,
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDxojU5g6t_rYRw7G2WBWDDqWtB4yIJIe4",
  authDomain: "bella-massa-82faf.firebaseapp.com",
  projectId: "bella-massa-82faf",
  storageBucket: "bella-massa-82faf.firebasestorage.app",
  messagingSenderId: "478400697656",
  appId: "1:478400697656:web:586306072bb9646340ddcd",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// Expose helpers no escopo global
window.Firebase = {
  app,
  db,
  auth,
  fs: { collection, addDoc, doc, updateDoc, deleteDoc, setDoc, getDoc, getDocs, onSnapshot, query, orderBy, where, limit, serverTimestamp, Timestamp },
  authApi: { signInWithEmailAndPassword, onAuthStateChanged, signOut },
};

console.log('🔥 Firebase inicializado — projeto:', firebaseConfig.projectId);
