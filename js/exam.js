import { Exam }     from "./examClass.js";
import { Question } from "./examClass.js";
import { DEFAULT_EXAM_DURATION_SECONDS } from "./config.js";

// ── Auth guard ──────────────────────────────────────────────────────────
if (!localStorage.getItem("email")) {
  window.location.replace("index.html");
}

// ── Read exam type from session ─────────────────────────────────────────
const examType = sessionStorage.getItem("examType") || "medical";

// ── Check if already submitted ──────────────────────────────────────────
const userEmail   = localStorage.getItem("email");
const results     = JSON.parse(localStorage.getItem("examResults") || "[]");
const alreadyDone = results.some(r => r.studentEmail === userEmail && r.examType === examType);

if (alreadyDone) {
  window.location.replace("choose.html");
}

let questionsArray = [];
let myExam;
let examSubmitted   = false;
let violationCount  = 0;

// ══════════════════════════════════════════════════════════════════════════
//  FULLSCREEN HELPERS
// ══════════════════════════════════════════════════════════════════════════
function requestFullscreen() {
  const el = document.documentElement;
  if (el.requestFullscreen)          return el.requestFullscreen();
  if (el.webkitRequestFullscreen)    return el.webkitRequestFullscreen();
  if (el.mozRequestFullScreen)       return el.mozRequestFullScreen();
  if (el.msRequestFullscreen)        return el.msRequestFullscreen();
  return Promise.resolve();
}

function exitFullscreen() {
  if (document.exitFullscreen)          return document.exitFullscreen();
  if (document.webkitExitFullscreen)    return document.webkitExitFullscreen();
  if (document.mozCancelFullScreen)     return document.mozCancelFullScreen();
  if (document.msExitFullscreen)        return document.msExitFullscreen();
  return Promise.resolve();
}

function isFullscreen() {
  return !!(
    document.fullscreenElement       ||
    document.webkitFullscreenElement ||
    document.mozFullScreenElement    ||
    document.msFullscreenElement
  );
}

// ── Listen for fullscreen exit during exam ──────────────────────────────
["fullscreenchange", "webkitfullscreenchange", "mozfullscreenchange", "msfullscreenchange"]
  .forEach(evt => document.addEventListener(evt, onFullscreenChange));

function onFullscreenChange() {
  if (!isFullscreen() && !examSubmitted) {
    violationCount++;
    const badge = document.getElementById("violationCountEl");
    if (badge) badge.textContent = violationCount;

    const warning = document.getElementById("fullscreenWarning");
    if (warning) warning.style.display = "flex";
  }
}

// ── Return to fullscreen button ─────────────────────────────────────────
window.addEventListener("DOMContentLoaded", () => {
  // Return button inside warning overlay
  const returnBtn = document.getElementById("returnFullscreenBtn");
  if (returnBtn) {
    returnBtn.addEventListener("click", async () => {
      await requestFullscreen().catch(() => {});
      document.getElementById("fullscreenWarning").style.display = "none";
    });
  }

  // Gate: Enter Fullscreen & Start
  const enterBtn = document.getElementById("enterFullscreenBtn");
  if (enterBtn) {
    enterBtn.addEventListener("click", async () => {
      await requestFullscreen().catch(() => {});
      document.getElementById("fullscreenGate").style.display = "none";
      initExam();
    });
  }
});

// ══════════════════════════════════════════════════════════════════════════
//  EXAM INIT (called after user enters fullscreen)
// ══════════════════════════════════════════════════════════════════════════
function initExam() {
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
    examSubmitted = true;
    exitFullscreen().catch(() => {});
    showGradesPage();
  });
}

// ── Save exam result to localStorage for admin ─────────────────────────────────────────
function saveExamResult(isTimeout) {
  try {
    if (!myExam || !questionsArray || questionsArray.length === 0) {
      console.error("[saveExamResult] Cannot save: exam not initialized.");
      return;
    }

    const firstName    = localStorage.getItem("f_name") || "Student";
    const lastName     = localStorage.getItem("l_name") || "";
    const studentEmail = localStorage.getItem("email")  || "";

    const answers = questionsArray.map(q => {
      const correctAnswer = q.type === "tf"
        ? (q.correct ? "True" : "False")
        : q.options[q.correctIndex];
      const selected = q.selectedAnswer || null;
      return {
        questionId:     q.id,
        questionText:   q.text,
        questionType:   q.type,
        options:        q.type === "mcq" ? q.options : ["True", "False"],
        selectedAnswer: selected,
        correctAnswer:  correctAnswer,
        isCorrect:      selected !== null && selected === correctAnswer,
        skipped:        selected === null || selected === undefined
      };
    });

    const calculatedScore = answers.filter(a => a.isCorrect).length;

    const result = {
      id:             Date.now(),
      timestamp:      new Date().toISOString(),
      examType:       examType,
      studentName:    `${firstName} ${lastName}`.trim(),
      studentEmail:   studentEmail,
      score:          calculatedScore,
      total:          questionsArray.length,
      isTimeout:      isTimeout,
      violations:     violationCount,
      answers:        answers
    };

    const existing = JSON.parse(localStorage.getItem("examResults") || "[]");
    existing.push(result);
    localStorage.setItem("examResults", JSON.stringify(existing));
    console.log("[saveExamResult] Saved result for", studentEmail, "score:", result.score, "/", result.total);
  } catch (err) {
    console.error("[saveExamResult] Error saving result:", err);
  }
}

// ── Result Page (submitted on time) ──────────────────────────────────────
function showGradesPage() {
  saveExamResult(false);

  const firstName  = localStorage.getItem("f_name") || "Student";
  const lastName   = localStorage.getItem("l_name") || "";
  const savedImage = localStorage.getItem("image")  || "";
  const imgTag = savedImage
    ? `<img id="imagepreview" src="${savedImage}" alt="Profile" />`
    : "";

  document.querySelector(".exam-page").innerHTML = `
    <div class="result-page animate__animated animate__zoomIn">
      ${imgTag}
      <div class="result-icon">🎉</div>
      <h2>Well done, <span class="result-name">${firstName} ${lastName}</span>!</h2>
      <p>Your exam has been submitted successfully.<br/>Thank you for your time and effort!</p>
      <div class="result-actions">
        <button class="btn-retry" onclick="window.location.href='choose.html'">← Choose Exam</button>
      </div>
    </div>
  `;
}

// ── Timeout Page ──────────────────────────────────────────────────────────
function showTimeoutPage() {
  examSubmitted = true;
  saveExamResult(true);
  exitFullscreen().catch(() => {});

  const firstName  = localStorage.getItem("f_name") || "Student";
  const lastName   = localStorage.getItem("l_name") || "";
  const savedImage = localStorage.getItem("image")  || "";
  const imgTag = savedImage
    ? `<img id="imagepreview" src="${savedImage}" alt="Profile" />`
    : "";

  document.querySelector(".exam-page").innerHTML = `
    <div class="result-page timeout animate__animated animate__zoomIn">
      ${imgTag}
      <div class="result-icon">⏰</div>
      <h2>Time's up, <span class="result-name">${firstName} ${lastName}</span>!</h2>
      <p>
        Your exam time has ended. Your responses have been recorded.<br/>
        Thank you for participating!
      </p>
      <div class="result-actions">
        <button class="btn-retry" onclick="window.location.href='choose.html'">← Choose Exam</button>
      </div>
    </div>
  `;
}