import { defaultQuestions }                from "./questions.js";
import { DEFAULT_EXAM_DURATION_SECONDS, db } from "./config.js";
import {
  collection, query, where, getDocs
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// ── Auth guard ──────────────────────────────────────────────────────────
if (!localStorage.getItem("email")) {
  window.location.replace("index.html");
}

// ── Seed questions/duration into localStorage if first time ─────────────
if (!localStorage.getItem("adminQuestions")) {
  localStorage.setItem("adminQuestions", JSON.stringify(defaultQuestions));
}
if (!localStorage.getItem("examDuration")) {
  localStorage.setItem("examDuration", String(DEFAULT_EXAM_DURATION_SECONDS));
}

// ── Display user's name ──────────────────────────────────────────────────
const firstName = localStorage.getItem("f_name") || "Student";
const lastName  = localStorage.getItem("l_name") || "";
document.getElementById("displayName").textContent = `${firstName} ${lastName}`.trim();

// ── Show live question counts ─────────────────────────────────────────────
const questions = JSON.parse(localStorage.getItem("adminQuestions") || "[]");
const medCount  = questions.filter(q => q.examType === "medical").length;
const softCount = questions.filter(q => q.examType === "softskills").length;
document.getElementById("medicalCount").textContent = `${medCount} Questions`;
document.getElementById("softCount").textContent    = `${softCount} Questions`;

// ── Check completed exams via Firestore ──────────────────────────────────
const userEmail = localStorage.getItem("email");

async function initCompletionStatus() {
  let hasMedical = false;
  let hasSoft    = false;

  try {
    const q = query(
      collection(db, "examResults"),
      where("studentEmail", "==", userEmail)
    );
    const snap = await getDocs(q);
    snap.forEach(docSnap => {
      const data = docSnap.data();
      if (data.examType === "medical")    hasMedical = true;
      if (data.examType === "softskills") hasSoft    = true;
    });
  } catch (err) {
    console.error("[choose] Firestore query error:", err);
  }

  // ── Mark completed cards ──────────────────────────────────────────────
  if (hasMedical) {
    const medCard = document.getElementById("medicalCard");
    const medBtn  = document.getElementById("medicalBtn");
    medCard.classList.add("completed-card");
    medCard.removeAttribute("tabindex");
    medBtn.disabled = true;
    medBtn.innerHTML = "Completed ✅";
  }

  if (hasSoft) {
    const softCard = document.getElementById("softCard");
    const softBtn  = document.getElementById("softBtn");
    softCard.classList.add("completed-card");
    softCard.removeAttribute("tabindex");
    softBtn.disabled = true;
    softBtn.innerHTML = "Completed ✅";
  }

  // ── Navigate to exam ──────────────────────────────────────────────────
  function startExam(type) {
    if (type === "medical"    && hasMedical) return;
    if (type === "softskills" && hasSoft)    return;
    sessionStorage.setItem("examType", type);
    window.location.href = "exam.html";
  }

  if (!hasMedical) {
    document.getElementById("medicalBtn").addEventListener("click",   () => startExam("medical"));
    document.getElementById("medicalCard").addEventListener("keydown", e => e.key === "Enter" && startExam("medical"));
  }

  if (!hasSoft) {
    document.getElementById("softBtn").addEventListener("click",    () => startExam("softskills"));
    document.getElementById("softCard").addEventListener("keydown",  e => e.key === "Enter" && startExam("softskills"));
  }
}

initCompletionStatus();

// ── Logout ───────────────────────────────────────────────────────────────
document.getElementById("logoutBtn").addEventListener("click", () => {
  localStorage.removeItem("uid");
  localStorage.removeItem("email");
  localStorage.removeItem("f_name");
  localStorage.removeItem("l_name");
  localStorage.removeItem("password");
  localStorage.removeItem("image");
  sessionStorage.clear();
  window.location.replace("index.html");
});
