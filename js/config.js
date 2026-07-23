// ============================================================
//  Admin Configuration
//  Change credentials and settings here or via Admin Dashboard
// ============================================================

export const ADMIN_EMAIL    = "admin@bioexam.com";
export const ADMIN_PASSWORD = "Bio@Admin2025";

// Default exam duration in seconds (2700 = 45 minutes)
export const DEFAULT_EXAM_DURATION_SECONDS = 2700;

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
