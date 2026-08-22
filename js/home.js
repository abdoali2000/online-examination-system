import { auth } from "./config.js";
import {
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

const startBtn = document.querySelector("#startBtn");

startBtn.addEventListener("click", () => {
    startBtn.disabled = true;
    startBtn.textContent = "Checking...";

    // Use onAuthStateChanged for a reliable auth state check (not just localStorage)
    const unsubscribe = onAuthStateChanged(auth, (user) => {
        unsubscribe(); // unsubscribe immediately — one-shot check

        if (user && localStorage.getItem("email")) {
            // Already logged in → go straight to exam selection
            window.location.replace("choose.html");
        } else {
            // Not logged in → go to login
            window.location.replace("login.html");
        }
    });
});
