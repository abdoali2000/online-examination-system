import { auth, db } from "./config.js";
import {
  signInWithEmailAndPassword
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import {
  doc, getDoc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// ── If already logged in, skip to choose ─────────────────────────────────
if (localStorage.getItem("email")) {
    window.location.replace("choose.html");
}

// ── DOM refs ──────────────────────────────────────────────────────────────
const email         = document.querySelector("#email");
const emailError    = document.querySelector("#error_email");
const password      = document.querySelector("#password");
const passwordError = document.querySelector("#error_pass");
const form          = document.querySelector("#loginForm");

// ── UI helpers ────────────────────────────────────────────────────────────
function error(input, div, msg) {
    input.style.border    = "2px solid red";
    input.style.color     = "";
    input.style.animation = "shake 0.5s ease-in-out";
    div.innerHTML   = msg;
    div.style.color = "red";
}

function valid(input, div) {
    input.style.border    = "2px solid green";
    input.style.color     = "green";
    input.style.animation = "";
    div.innerHTML   = "";
    div.style.color = "green";
}

// ── Inline validation ────────────────────────────────────────────────────
const regexEmail = /^[a-zA-Z][a-zA-Z0-9]{3,19}@[a-zA-Z]+\.[a-zA-Z]{2,}$/;
const regexPass  = /^.{6,}$/;

function validateEmail() {
    const v = email.value;
    regexEmail.test(v) ? valid(email, emailError) : error(email, emailError, "Email not valid");
}

function validatePassword() {
    const v = password.value;
    regexPass.test(v) ? valid(password, passwordError) : error(password, passwordError, "Password must be at least 6 characters");
}

// Expose inline handlers
window.validateEmail    = validateEmail;
window.validatePassword = validatePassword;

// ── Form submit ───────────────────────────────────────────────────────────
form.addEventListener("submit", async (e) => {
    e.preventDefault();

    let isValid = true;

    if (!email.value.trim()) {
        error(email, emailError, "Please enter the email"); isValid = false;
    } else if (!regexEmail.test(email.value)) {
        error(email, emailError, "Please enter a valid email"); isValid = false;
    } else { valid(email, emailError); }

    if (!password.value.trim()) {
        error(password, passwordError, "Please enter the password"); isValid = false;
    } else if (!regexPass.test(password.value)) {
        error(password, passwordError, "Password must be at least 6 characters"); isValid = false;
    } else { valid(password, passwordError); }

    if (!isValid) return;

    // ── Firebase Login ───────────────────────────────────────────────────
    const submitBtn = form.querySelector("button[type='submit']");
    submitBtn.disabled    = true;
    submitBtn.textContent = "Logging in...";

    try {
        // 1. Sign in via Firebase Auth
        const userCredential = await signInWithEmailAndPassword(
            auth,
            email.value.trim(),
            password.value
        );
        const uid = userCredential.user.uid;

        // 2. Fetch profile from Firestore users/{uid}
        const userDocRef  = doc(db, "users", uid);
        const userDocSnap = await getDoc(userDocRef);

        let fName = "", lName = "", image = "";
        if (userDocSnap.exists()) {
            const data = userDocSnap.data();
            fName = data.f_name || "";
            lName = data.l_name || "";
            image = data.image  || "";
        }

        // 3. Save session to localStorage (fast access)
        localStorage.setItem("uid",    uid);
        localStorage.setItem("email",  email.value.trim());
        localStorage.setItem("f_name", fName);
        localStorage.setItem("l_name", lName);
        localStorage.setItem("image",  image);

        submitBtn.textContent = "✅ Success!";
        setTimeout(() => {
            window.location.replace("choose.html");
        }, 1000);

    } catch (err) {
        submitBtn.disabled    = false;
        submitBtn.textContent = "Login";

        // Map Firebase error codes to friendly messages
        if (
            err.code === "auth/user-not-found" ||
            err.code === "auth/invalid-credential" ||
            err.code === "auth/invalid-email"
        ) {
            error(email, emailError, "Email does not exist or is invalid.");
        } else if (err.code === "auth/wrong-password") {
            error(password, passwordError, "Password is incorrect.");
        } else if (err.code === "auth/too-many-requests") {
            error(email, emailError, "Too many failed attempts. Please try again later.");
        } else {
            error(email, emailError, `Login failed: ${err.message}`);
        }
        console.error("[login] Firebase error:", err);
    }
});

// ── Toggle password visibility ─────────────────────────────────────────
const showPasswordToggle = document.querySelector("#showPasswordToggle");
if (showPasswordToggle) {
    showPasswordToggle.addEventListener("change", () => {
        password.type = showPasswordToggle.checked ? "text" : "password";
    });
}