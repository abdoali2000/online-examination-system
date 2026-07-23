import { defaultQuestions } from "./questions.js";
import { DEFAULT_EXAM_DURATION_SECONDS } from "./config.js";

// ── Auth guard ──────────────────────────────────────────────────────────
if (!localStorage.getItem("email")) {
  window.location.replace("index.html");
}

// ── Seed questions into localStorage if first time ──────────────────────
if (!localStorage.getItem("adminQuestions")) {
  localStorage.setItem("adminQuestions", JSON.stringify(defaultQuestions));
}

// ── Seed exam duration if first time ────────────────────────────────────
if (!localStorage.getItem("examDuration")) {
  localStorage.setItem("examDuration", String(DEFAULT_EXAM_DURATION_SECONDS));
}

// ── Display user's name ──────────────────────────────────────────────────
const firstName = localStorage.getItem("f_name") || "Student";
const lastName  = localStorage.getItem("l_name") || "";
document.getElementById("displayName").textContent =
  `${firstName} ${lastName}`.trim();

// ── Show live question counts ────────────────────────────────────────────
const questions = JSON.parse(localStorage.getItem("adminQuestions") || "[]");
const medCount  = questions.filter(q => q.examType === "medical").length;
const softCount = questions.filter(q => q.examType === "softskills").length;
document.getElementById("medicalCount").textContent = `${medCount} Questions`;
document.getElementById("softCount").textContent    = `${softCount} Questions`;

// ── Navigate to exam ─────────────────────────────────────────────────────
function startExam(type) {
  sessionStorage.setItem("examType", type);
  window.location.href = "exam.html";
}

document.getElementById("medicalBtn").addEventListener("click",  () => startExam("medical"));
document.getElementById("softBtn").addEventListener("click",     () => startExam("softskills"));
document.getElementById("medicalCard").addEventListener("keydown", e => e.key === "Enter" && startExam("medical"));
document.getElementById("softCard").addEventListener("keydown",   e => e.key === "Enter" && startExam("softskills"));

// ── Logout ───────────────────────────────────────────────────────────────
document.getElementById("logoutBtn").addEventListener("click", () => {
  sessionStorage.clear();
  window.location.replace("index.html");
});
