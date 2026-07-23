import { auth, db } from "./config.js";
import {
  createUserWithEmailAndPassword
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import {
  doc, setDoc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// ── DOM refs ─────────────────────────────────────────────────────────────
const firstName      = document.querySelector("#Fname");
const lastName       = document.querySelector("#Lname");
const errorFirstName = document.querySelector("#error_fn");
const errorLastName  = document.querySelector("#error_ln");

const email      = document.querySelector("#email");
const emailError = document.querySelector("#error_email");

const file         = document.querySelector("#file");
const imagePreview = document.querySelector("#imagePreview");
const fileError    = document.querySelector("#error_file");

const password      = document.querySelector("#password");
const passwordError = document.querySelector("#error_pass");

const rePassword    = document.querySelector("#re_password");
const erPasswordError = document.querySelector("#error_repass");

const form = document.querySelector("#registrationForm");
const btn  = document.querySelector("#sbmit");

// ── UI helpers ────────────────────────────────────────────────────────────
function error(input, div, msg) {
    input.style.border    = "2px solid red";
    input.style.color     = "";
    input.style.animation = "shake 0.5s ease-in-out";
    div.innerHTML  = msg;
    div.style.color = "red";
}

function valid(input, div) {
    input.style.border    = "2px solid green";
    input.style.color     = "green";
    input.style.animation = "";
    div.innerHTML  = "";
    div.style.color = "green";
}

// ── Inline validation ────────────────────────────────────────────────────
const regexFname    = /^[a-zA-Z]+$/;
const regexLastName = /^[a-zA-Z]+$/;
const regexEmail    = /^[a-zA-Z][a-zA-Z0-9]{3,19}@[a-zA-Z]+\.[a-zA-Z]{2,}$/;
const regexPass     = /^.{6,}$/;

function validFirstName() {
    const v = firstName.value;
    regexFname.test(v)
        ? valid(firstName, errorFirstName)
        : error(firstName, errorFirstName, "First name should contain letters only");
}

function validationLastName() {
    const v = lastName.value;
    regexLastName.test(v)
        ? valid(lastName, errorLastName)
        : error(lastName, errorLastName, "Last name should contain letters only");
}

function validationEmail() {
    const v = email.value;
    regexEmail.test(v)
        ? valid(email, emailError)
        : error(email, emailError, "Email not valid");
}

function validateFiles() {
    valid(file, fileError);
    const f = file.files[0];
    if (f) {
        const reader = new FileReader();
        reader.onload = e => {
            imagePreview.src = e.target.result;
            imagePreview.style.display = "block";
        };
        reader.readAsDataURL(f);
    } else {
        imagePreview.src = "";
        imagePreview.style.display = "none";
    }
}

function validationPassword() {
    const v = password.value;
    regexPass.test(v)
        ? valid(password, passwordError)
        : error(password, passwordError, "Password must be at least 6 characters");
}

function validationRePassword() {
    rePassword.value === password.value
        ? valid(rePassword, erPasswordError)
        : error(rePassword, erPasswordError, "Passwords do not match");
}

// Expose inline handlers used in HTML attributes
window.validFirstName      = validFirstName;
window.validationLastName  = validationLastName;
window.validationEmail     = validationEmail;
window.validateFiles       = validateFiles;
window.validationPassword  = validationPassword;
window.validationRePassword = validationRePassword;

// ── Form submit ───────────────────────────────────────────────────────────
form.addEventListener("submit", async (e) => {
    e.preventDefault();

    let isValid = true;

    // First Name
    if (!firstName.value.trim()) {
        error(firstName, errorFirstName, "Please enter the First name"); isValid = false;
    } else if (!regexFname.test(firstName.value)) {
        error(firstName, errorFirstName, "First name should contain letters only"); isValid = false;
    } else { valid(firstName, errorFirstName); }

    // Last Name
    if (!lastName.value.trim()) {
        error(lastName, errorLastName, "Please enter the Last name"); isValid = false;
    } else if (!regexLastName.test(lastName.value)) {
        error(lastName, errorLastName, "Last name should contain letters only"); isValid = false;
    } else { valid(lastName, errorLastName); }

    // Email
    if (!email.value.trim()) {
        error(email, emailError, "Please enter the email"); isValid = false;
    } else if (!regexEmail.test(email.value)) {
        error(email, emailError, "Please enter a valid email"); isValid = false;
    } else { valid(email, emailError); }

    // File (optional)
    valid(file, fileError);

    // Password
    if (!password.value.trim()) {
        error(password, passwordError, "Please enter the password"); isValid = false;
    } else if (!regexPass.test(password.value)) {
        error(password, passwordError, "Password must be at least 6 characters"); isValid = false;
    } else { valid(password, passwordError); }

    // Re-password
    if (!rePassword.value.trim()) {
        error(rePassword, erPasswordError, "Please re-enter the password"); isValid = false;
    } else if (rePassword.value !== password.value) {
        error(rePassword, erPasswordError, "Passwords do not match"); isValid = false;
    } else { valid(rePassword, erPasswordError); }

    if (!isValid) return;

    // ── Firebase Registration ────────────────────────────────────────────
    const submitBtn = form.querySelector("button[type='submit']");
    submitBtn.disabled    = true;
    submitBtn.textContent = "Registering...";

    try {
        // 1. Create user in Firebase Auth
        const userCredential = await createUserWithEmailAndPassword(
            auth,
            email.value.trim(),
            password.value
        );
        const uid = userCredential.user.uid;

        // 2. Save profile to Firestore users/{uid}
        const imageData = file.files.length > 0 ? imagePreview.src : "";
        await setDoc(doc(db, "users", uid), {
            f_name: firstName.value.trim(),
            l_name: lastName.value.trim(),
            email:  email.value.trim(),
            image:  imageData,
            createdAt: new Date().toISOString()
        });

        // 3. Save session info to localStorage (for fast access this session)
        localStorage.setItem("uid",     uid);
        localStorage.setItem("f_name",  firstName.value.trim());
        localStorage.setItem("l_name",  lastName.value.trim());
        localStorage.setItem("email",   email.value.trim());
        localStorage.setItem("image",   imageData);

        submitBtn.textContent = "✅ Registered!";
        setTimeout(() => {
            window.location.replace("choose.html");
        }, 1000);

    } catch (err) {
        submitBtn.disabled    = false;
        submitBtn.textContent = "Register";

        // Map Firebase error codes to friendly messages
        if (err.code === "auth/email-already-in-use") {
            error(email, emailError, "This email is already registered. Please login.");
        } else if (err.code === "auth/invalid-email") {
            error(email, emailError, "Invalid email format.");
        } else if (err.code === "auth/weak-password") {
            error(password, passwordError, "Password is too weak (min 6 characters).");
        } else {
            emailError.innerHTML  = "";
            passwordError.innerHTML = `Registration failed: ${err.message}`;
            passwordError.style.color = "red";
        }
        console.error("[register] Firebase error:", err);
    }
});

// ── Toggle password visibility ─────────────────────────────────────────
const showPasswordToggle = document.querySelector("#showPasswordToggle");
if (showPasswordToggle) {
    showPasswordToggle.addEventListener("change", () => {
        const type = showPasswordToggle.checked ? "text" : "password";
        password.type   = type;
        rePassword.type = type;
    });
}
