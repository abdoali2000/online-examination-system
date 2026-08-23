import { db } from "./config.js";
import {
  collection, getDocs, query, where
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// ── Auth guard ──────────────────────────────────────────────────────────
if (!localStorage.getItem("email")) {
  window.location.replace("login.html");
}

// ── Display user's name ──────────────────────────────────────────────────
const firstName = localStorage.getItem("f_name") || "Student";
const lastName  = localStorage.getItem("l_name") || "";
document.getElementById("displayName").textContent = `${firstName} ${lastName}`.trim();

// ── Determine which exams this student has already completed ─────────────
const userEmail = localStorage.getItem("email");

// ─────────────────────────────────────────────────────────────────────────
//  ICON MAP — picks a relevant emoji based on exam subject/title keywords
// ─────────────────────────────────────────────────────────────────────────
function pickIcon(exam) {
  const text = `${exam.title} ${exam.subject}`.toLowerCase();
  if (text.includes("medical") || text.includes("pharma") || text.includes("clinical")) return "🏥";
  if (text.includes("soft") || text.includes("skill") || text.includes("communication")) return "💼";
  if (text.includes("science") || text.includes("biology") || text.includes("chem")) return "🔬";
  if (text.includes("sales") || text.includes("marketing")) return "📊";
  if (text.includes("safety") || text.includes("compliance")) return "🛡️";
  return "📝";
}

// Card CSS class — alternates between two styles for visual variety
const CARD_STYLES = ["medical-card", "soft-card"];
const BTN_STYLES  = ["", "soft-btn"];

// ─────────────────────────────────────────────────────────────────────────
//  MAIN — fetch exams & completed status, then render cards
// ─────────────────────────────────────────────────────────────────────────
async function init() {
  const container = document.getElementById("examCardsContainer");

  try {
    // 1. Fetch all available exams
    const examsSnap = await getDocs(collection(db, "exams"));
    const exams = examsSnap.docs.map(d => ({ _docId: d.id, ...d.data() }));

    // Sort by createdAt ascending so Medical comes first (oldest seed)
    exams.sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));

    // 2. Fetch completed exams for this student
    let completedDocIds = new Set();
    try {
      const resultsSnap = await getDocs(
        query(collection(db, "examResults"), where("studentEmail", "==", userEmail))
      );
      resultsSnap.forEach(d => {
        const data = d.data();
        if (data.examDocId) completedDocIds.add(data.examDocId);
        // Legacy: match by examType if no examDocId stored
      });
    } catch (err) {
      console.error("[choose] Failed to load completion status:", err);
    }

    // 3. Remove loading spinner
    container.innerHTML = "";

    if (exams.length === 0) {
      container.innerHTML = `
        <div class="exam-card-empty">
          <div style="font-size:3rem">📭</div>
          <h3>No Exams Available</h3>
          <p>No exams have been set up yet. Please check back later.</p>
        </div>`;
      return;
    }

    // 4. Render one card per exam
    exams.forEach((exam, idx) => {
      const isCompleted = completedDocIds.has(exam._docId);
      const qCount      = (exam.questions || []).length;
      const duration    = Math.round((exam.durationSeconds || 2700) / 60);
      const icon        = pickIcon(exam);
      const cardCls     = CARD_STYLES[idx % CARD_STYLES.length];
      const btnCls      = BTN_STYLES[idx % BTN_STYLES.length];
      const glowCls     = cardCls === "medical-card" ? "medical-glow" : "soft-glow";

      const card = document.createElement("div");
      card.className = `exam-card ${cardCls}${isCompleted ? " completed-card" : ""}`;
      card.setAttribute("tabindex", isCompleted ? "-1" : "0");
      card.setAttribute("role", "button");
      card.setAttribute("aria-label", `${isCompleted ? "Completed: " : "Start "}${exam.title}`);
      card.dataset.docId = exam._docId;

      card.innerHTML = `
        <div class="card-glow ${glowCls}"></div>
        <div class="card-icon">${icon}</div>
        <h2 class="card-title">${escHtml(exam.title)}</h2>
        <p class="card-desc">${escHtml(exam.subject || "")}</p>
        <div class="card-meta-row">
          <span class="card-badge">${qCount} Questions</span>
          <span class="card-badge">${duration} Minutes</span>
        </div>
        <button class="card-btn ${btnCls}" ${isCompleted ? "disabled" : ""}>
          ${isCompleted ? "Completed ✅" : `Start Exam <span class="arrow">→</span>`}
        </button>`;

      container.appendChild(card);

      if (!isCompleted) {
        const btn = card.querySelector(".card-btn");
        const startExam = () => {
          sessionStorage.setItem("examDocId", exam._docId);
          sessionStorage.setItem("examType",  exam.subject || "general");
          window.location.href = "exam.html";
        };
        btn.addEventListener("click", startExam);
        card.addEventListener("keydown", e => e.key === "Enter" && startExam());
      }
    });

  } catch (err) {
    console.error("[choose] init error:", err);
    container.innerHTML = `
      <div class="exam-card-empty">
        <div style="font-size:3rem">⚠️</div>
        <h3>Failed to load exams</h3>
        <p>${escHtml(err.message)}</p>
      </div>`;
  }
}

// Simple HTML escape
function escHtml(str) {
  if (typeof str !== "string") return "";
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

init();

// ── Logout ───────────────────────────────────────────────────────────────
document.getElementById("logoutBtn").addEventListener("click", () => {
  localStorage.removeItem("uid");
  localStorage.removeItem("email");
  localStorage.removeItem("f_name");
  localStorage.removeItem("l_name");
  localStorage.removeItem("password");
  localStorage.removeItem("image");
  sessionStorage.clear();
  window.location.replace("login.html");
});
