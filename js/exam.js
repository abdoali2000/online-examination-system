import { Exam }     from "./examClass.js";
import { Question } from "./examClass.js";
import { DEFAULT_EXAM_DURATION_SECONDS } from "./config.js";

// ── Auth guard ──────────────────────────────────────────────────────────
if (!localStorage.getItem("email")) {
  window.location.replace("index.html");
}

// ── Read exam type from session ─────────────────────────────────────────
const examType = sessionStorage.getItem("examType") || "medical";

let questionsArray = [];
let myExam;

window.addEventListener("DOMContentLoaded", () => {
  // Load duration from localStorage (admin may have changed it)
  const duration = parseInt(localStorage.getItem("examDuration") || String(DEFAULT_EXAM_DURATION_SECONDS), 10);

  // Update page title with exam type
  const titleEl = document.querySelector(".exam-title");
  if (titleEl) {
    titleEl.textContent = examType === "medical" ? "🏥 Medical Exam" : "💼 Soft Skills Exam";
  }

  // Build exam object and load questions
  myExam = new Exam({ examType });
  questionsArray = myExam.getQuestions();

  if (questionsArray.length === 0) {
    document.querySelector(".exam-body").innerHTML = `
      <div class="no-questions-msg">
        <div style="font-size:3rem">📭</div>
        <h3>No Questions Available</h3>
        <p>The admin hasn't added any questions for this exam type yet.</p>
        <button onclick="window.location.href='choose.html'" class="btn-retry">← Go Back</button>
      </div>
    `;
    return;
  }

  // Display first question
  new Question(0, questionsArray, myExam).displayQuestions();

  // Start timer
  const labelEl = document.getElementById("timerLabel");
  const fillEl  = document.getElementById("timerFill");
  myExam.startTimer(duration, labelEl, fillEl, showTimeoutPage);

  // Submit button
  document.getElementById("submitBtn").addEventListener("click", () => {
    myExam.stopTimer();
    showGradesPage();
  });
});

// ── Result Page ──────────────────────────────────────────────────────────
function showGradesPage() {
  const firstName  = localStorage.getItem("f_name") || "Student";
  const lastName   = localStorage.getItem("l_name") || "";
  const savedImage = localStorage.getItem("image")  || "";
  const total      = questionsArray.length;
  const score      = myExam.grades;
  const pct        = Math.round((score / total) * 100);

  const imgTag = savedImage
    ? `<img id="imagepreview" src="${savedImage}" alt="Profile" />`
    : "";

  document.querySelector(".exam-page").innerHTML = `
    <div class="result-page animate__animated animate__zoomIn">
      ${imgTag}
      <div class="result-icon">🎉</div>
      <h2>Well done, <span class="result-name">${firstName} ${lastName}</span>!</h2>
      <div class="score-badge">
        ${score} <span>/ ${total}</span>
      </div>
      <div class="score-pct">${pct}%</div>
      <p>You submitted the exam on time. Great job!</p>
      <div class="result-actions">
        <button class="btn-retry" onclick="window.location.href='choose.html'">← Choose Exam</button>
      </div>
    </div>
  `;
}

// ── Timeout Page ──────────────────────────────────────────────────────────
function showTimeoutPage() {
  const firstName  = localStorage.getItem("f_name") || "Student";
  const lastName   = localStorage.getItem("l_name") || "";
  const savedImage = localStorage.getItem("image")  || "";
  const total      = questionsArray.length;

  const imgTag = savedImage
    ? `<img id="imagepreview" src="${savedImage}" alt="Profile" />`
    : "";

  document.querySelector(".exam-page").innerHTML = `
    <div class="result-page timeout animate__animated animate__zoomIn">
      ${imgTag}
      <div class="result-icon">⏰</div>
      <h2>Time's up, <span class="result-name">${firstName} ${lastName}</span>!</h2>
      <p>
        Unfortunately your exam time has ended before you could submit.<br/>
        You answered <strong>${myExam.grades}</strong> out of
        <strong>${total}</strong> correctly.
      </p>
      <div class="result-actions">
        <button class="btn-retry" onclick="window.location.href='choose.html'">← Choose Exam</button>
      </div>
    </div>
  `;
}