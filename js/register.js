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

    // ── Image Compression Helper ─────────────────────────────────────────
    // Returns a compressed JPEG Data URL, or "" if no valid image is given.
    const compressImage = (imageFile, maxWidth, maxHeight, quality) => {
        return new Promise((resolve, reject) => {
            // Guard 1: no file passed in at all → skip compression
            if (!imageFile) {
                resolve("");
                return;
            }
            // Guard 2: file is not an image MIME type → skip compression
            if (!imageFile.type.startsWith("image/")) {
                reject(new Error(`Selected file is not an image (type: ${imageFile.type}).`));
                return;
            }

            const reader = new FileReader();
            reader.readAsDataURL(imageFile);

            reader.onload = () => {
                // Use reader.result directly (safer than event.target.result)
                const dataUrl = reader.result;
                if (!dataUrl || typeof dataUrl !== "string") {
                    reject(new Error("FileReader returned an empty or invalid result."));
                    return;
                }

                const img = new Image();
                img.onload = () => {
                    let width  = img.width;
                    let height = img.height;

                    // Guard 3: image has no dimensions (corrupt / unsupported)
                    if (!width || !height) {
                        reject(new Error("Image has invalid dimensions (0×0)."));
                        return;
                    }

                    // Scale down while keeping aspect ratio
                    if (width > height) {
                        if (width > maxWidth) {
                            height = Math.round((height * maxWidth) / width);
                            width  = maxWidth;
                        }
                    } else {
                        if (height > maxHeight) {
                            width  = Math.round((width * maxHeight) / height);
                            height = maxHeight;
                        }
                    }

                    const canvas = document.createElement("canvas");
                    canvas.width  = width;
                    canvas.height = height;
                    const ctx = canvas.getContext("2d");
                    ctx.drawImage(img, 0, 0, width, height);

                    resolve(canvas.toDataURL("image/jpeg", quality));
                };

                img.onerror = () => reject(new Error("Browser could not decode the selected image."));
                img.src = dataUrl;
            };

            reader.onerror = () => reject(new Error("Failed to read the selected image file."));
        });
    };

    // ── Firebase Registration ────────────────────────────────────────────
    const submitBtn = form.querySelector("button[type='submit']");
    submitBtn.disabled    = true;
    submitBtn.textContent = "Registering...";

    let registeredUser = null; // track for rollback

    try {
        // 1. Create user in Firebase Auth
        const userCredential = await createUserWithEmailAndPassword(
            auth,
            email.value.trim(),
            password.value
        );
        registeredUser = userCredential.user;
        const uid = registeredUser.uid;

        // 2. Compress image if provided — guarded: skip if no file or invalid type
        //    (runs AFTER auth so that if it throws, we can rollback the auth account)
        let imageData = "";
        const selectedFile = file.files[0]; // undefined when no file chosen
        if (selectedFile && selectedFile.type.startsWith("image/")) {
            imageData = await compressImage(selectedFile, 250, 250, 0.8);
        }


        // 3. Save profile to Firestore users/{uid}
        //    email MUST equal auth.currentUser.email (enforced by Firestore rules),
        //    so we read it from the auth token, not from the input field.
        await setDoc(doc(db, "users", uid), {
            f_name: firstName.value.trim(),
            l_name: lastName.value.trim(),
            email:  registeredUser.email,   // ← auth token email, satisfies Firestore rule
            image:  imageData,
            createdAt: new Date().toISOString()
        });

        // 4. Save session info to localStorage (for fast access this session)
        localStorage.setItem("uid",    uid);
        localStorage.setItem("f_name", firstName.value.trim());
        localStorage.setItem("l_name", lastName.value.trim());
        localStorage.setItem("email",  registeredUser.email);
        localStorage.setItem("image",  imageData);

        submitBtn.textContent = "✅ Registered!";
        setTimeout(() => {
            window.location.replace("choose.html");
        }, 1000);

    } catch (err) {
        // Rollback: delete the auth account if it was created but something
        // after it (image compression or Firestore write) failed.
        if (registeredUser) {
            try { await registeredUser.delete(); } catch (_) { /* best-effort */ }
        }

        submitBtn.disabled    = false;
        submitBtn.textContent = "Register";

        // Safe message extraction — err may be a Firebase Error, a plain JS Error,
        // or a raw DOM Event (no .message). Use optional chaining + fallback.
        const friendlyMsg = err?.message || "An unknown error occurred. Please try again.";

        // Map Firebase error codes to friendly messages
        if (err?.code === "auth/email-already-in-use") {
            error(email, emailError, "This email is already registered. Please login.");
        } else if (err?.code === "auth/invalid-email") {
            error(email, emailError, "Invalid email format.");
        } else if (err?.code === "auth/weak-password") {
            error(password, passwordError, "Password is too weak (min 6 characters).");
        } else {
            emailError.innerHTML    = "";
            passwordError.innerHTML = `Registration failed: ${friendlyMsg}`;
            passwordError.style.color = "red";
        }
        console.error("[register] Registration error:", err);
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
