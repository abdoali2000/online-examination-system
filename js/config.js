// ============================================================
//  Firebase Configuration & Initialization
// ============================================================
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth }       from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore }  from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const firebaseConfig = {
  apiKey:            "AIzaSyDEG2YqdiVEGrr-zOWL3gwTF0DisYZ6DZ8",
  authDomain:        "online-examination-syste-61e71.firebaseapp.com",
  projectId:         "online-examination-syste-61e71",
  storageBucket:     "online-examination-syste-61e71.firebasestorage.app",
  messagingSenderId: "1082572588004",
  appId:             "1:1082572588004:web:89ae1581a3de7f85efbdf1",
  measurementId:     "G-8XCQ773ZZY"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db   = getFirestore(app);

// ============================================================
//  Admin Configuration
// ============================================================

// The Firebase Auth UID of the administrator account.
// Used to enforce admin-only access in Firestore Security Rules
// and in the client-side auth state guard.
export const ADMIN_UID = "Fq2RWyerWiYWzuLIzUJeLyjYx102";

// Default exam duration in seconds (2700 = 45 minutes)
export const DEFAULT_EXAM_DURATION_SECONDS = 2700;

