import { Exam } from "./examClass.js";
import { Question } from "./examClass.js";
import { auth, DEFAULT_EXAM_DURATION_SECONDS, db } from "./config.js";
import {
  collection, addDoc, query, where, getDocs, doc, getDoc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// ── Auth guard ──────────────────────────────────────────────────────────
if (!localStorage.getItem("email")) {
  window.location.replace("login.html");
}

// ── Read exam identity from session ─────────────────────────────────────
// New: prefer examDocId (Firestore-backed); fallback to legacy examType
const examDocId  = sessionStorage.getItem("examDocId")  || null;
const examType   = sessionStorage.getItem("examType")   || "medical";
const userEmail  = localStorage.getItem("email");

let questionsArray = [];
let myExam;
let examSubmitted  = false;
let violationCount = 0;

// ── Resolved exam metadata (filled after Firestore fetch) ─────────────────
let resolvedExamType  = examType;   // kept for examResults compatibility
let resolvedTitle     = "";
let resolvedDuration  = parseInt(localStorage.getItem("examDuration") || String(DEFAULT_EXAM_DURATION_SECONDS), 10);

// ══════════════════════════════════════════════════════════════════════════
//  FULLSCREEN HELPERS
// ══════════════════════════════════════════════════════════════════════════
function requestFullscreen() {
  const el = document.documentElement;
  if (el.requestFullscreen) return el.requestFullscreen();
  if (el.webkitRequestFullscreen) return el.webkitRequestFullscreen();
  if (el.mozRequestFullScreen) return el.mozRequestFullScreen();
  if (el.msRequestFullscreen) return el.msRequestFullscreen();
  return Promise.resolve();
}

function exitFullscreen() {
  if (document.exitFullscreen) return document.exitFullscreen();
  if (document.webkitExitFullscreen) return document.webkitExitFullscreen();
  if (document.mozCancelFullScreen) return document.mozCancelFullScreen();
  if (document.msExitFullscreen) return document.msExitFullscreen();
  return Promise.resolve();
}

function isFullscreen() {
  return !!(
    document.fullscreenElement ||
    document.webkitFullscreenElement ||
    document.mozFullScreenElement ||
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

// ══════════════════════════════════════════════════════════════════════════
//  LOAD EXAM DATA FROM FIRESTORE
//  Fetches questions and metadata from the exams/ collection.
//  Falls back to localStorage if no examDocId is in session.
// ══════════════════════════════════════════════════════════════════════════
async function loadExamData() {
  if (examDocId) {
    // ── Firestore-backed exam ────────────────────────────────────────────
    try {
      const snap = await getDoc(doc(db, "exams", examDocId));
      if (!snap.exists()) {
        console.error("[exam] Exam doc not found:", examDocId);
        return null;
      }
      const data = snap.data();
      resolvedTitle    = data.title || "";
      resolvedDuration = data.durationSeconds || DEFAULT_EXAM_DURATION_SECONDS;
      // Map Firestore questions to the shape examClass.js expects
      const qs = (data.questions || []).map((q, i) => ({
        id:           q.id ?? (i + 1),
        examType:     data.subject || "general",   // used in UI badge
        type:         q.type,
        text:         q.text,
        correct:      q.correct,           // tf
        options:      q.options,           // mcq
        correctIndex: q.correctIndex,      // mcq
      }));
      // Store subject as resolvedExamType for examResults (best-effort)
      resolvedExamType = data.subject || examType;
      return qs;
    } catch (err) {
      console.error("[exam] Firestore fetch error:", err);
      return null;
    }
  } else {
    // ── Legacy localStorage path ─────────────────────────────────────────
    const allQ = JSON.parse(localStorage.getItem("adminQuestions") || "[]");
    return allQ.filter(q => q.examType === examType);
  }
}

// ══════════════════════════════════════════════════════════════════════════
//  UI SETUP
// ══════════════════════════════════════════════════════════════════════════

// Return to fullscreen button
const returnBtn = document.getElementById("returnFullscreenBtn");
if (returnBtn) {
  returnBtn.addEventListener("click", async () => {
    await requestFullscreen().catch(() => { });
    document.getElementById("fullscreenWarning").style.display = "none";
  });
}

// Gate: Enter Fullscreen & Start
const enterBtn = document.getElementById("enterFullscreenBtn");
if (enterBtn) {
  enterBtn.addEventListener("click", async () => {
    await requestFullscreen().catch(() => { });
    document.getElementById("fullscreenGate").style.display = "none";
    initExam();
  });
}

// ── Check if already submitted ───────────────────────────────────────────
async function checkAlreadyDone() {
  if (!examDocId) {
    // Legacy path
    try {
      const q = query(
        collection(db, "examResults"),
        where("studentEmail", "==", userEmail),
        where("examType",     "==", examType)
      );
      const snap = await getDocs(q);
      if (!snap.empty) window.location.replace("choose.html");
    } catch (err) {
      console.error("[exam] checkAlreadyDone (legacy) error:", err);
    }
    return;
  }
  // Firestore-backed: check by examDocId
  try {
    const q = query(
      collection(db, "examResults"),
      where("studentEmail", "==", userEmail),
      where("examDocId",    "==", examDocId)
    );
    const snap = await getDocs(q);
    if (!snap.empty) window.location.replace("choose.html");
  } catch (err) {
    console.error("[exam] checkAlreadyDone error:", err);
  }
}
checkAlreadyDone();

// ══════════════════════════════════════════════════════════════════════════
//  EXAM INIT (called after user enters fullscreen)
// ══════════════════════════════════════════════════════════════════════════
async function initExam() {
  // Show loading state while we fetch
  const body = document.querySelector(".exam-body");
  if (body) body.innerHTML = `<div class="admin-loading" style="padding:2rem;text-align:center">Loading exam…</div>`;

  const loadedQuestions = await loadExamData();

  const titleEl = document.querySelector(".exam-title");
  if (titleEl) {
    if (resolvedTitle) {
      titleEl.textContent = resolvedTitle;
    } else {
      titleEl.textContent = examType === "medical" ? "🏥 Medical Exam" : "💼 Soft Skills Exam";
    }
  }

  myExam = new Exam({ examType: resolvedExamType, questions: loadedQuestions });
  questionsArray = myExam.getQuestions();

  if (questionsArray.length === 0) {
    if (body) body.innerHTML = `
      <div class="no-questions-msg">
        <div style="font-size:3rem">📭</div>
        <h3>No Questions Available</h3>
        <p>The admin hasn't added any questions for this exam yet.</p>
        <button onclick="window.location.href='choose.html'" class="btn-retry">← Go Back</button>
      </div>
    `;
    return;
  }

  new Question(0, questionsArray, myExam).displayQuestions();

  const labelEl = document.getElementById("timerLabel");
  const fillEl  = document.getElementById("timerFill");
  myExam.startTimer(resolvedDuration, labelEl, fillEl, showTimeoutPage);

  document.getElementById("submitBtn").addEventListener("click", () => {
    myExam.stopTimer();
    examSubmitted = true;
    exitFullscreen().catch(() => { });
    showGradesPage();
  });
}

// ── Save exam result to Firestore ─────────────────────────────────────────
async function saveExamResult(isTimeout) {
  try {
    if (!myExam || !questionsArray || questionsArray.length === 0) {
      console.error("[saveExamResult] Cannot save: exam not initialized.");
      return;
    }

    const firstName    = localStorage.getItem("f_name") || "Student";
    const lastName     = localStorage.getItem("l_name") || "";
    const studentEmail = auth.currentUser?.email || "";
    const uid          = auth.currentUser?.uid   || "";

    const answers = questionsArray.map(q => {
      const correctAnswer = q.type === "tf"
        ? (q.correct ? "True" : "False")
        : q.options[q.correctIndex];
      const selected = q.selectedAnswer || null;
      return {
        questionId:    q.id,
        questionText:  q.text,
        questionType:  q.type,
        options:       q.type === "mcq" ? q.options : ["True", "False"],
        selectedAnswer: selected,
        correctAnswer:  correctAnswer,
        isCorrect:     selected !== null && selected === correctAnswer,
        skipped:       selected === null || selected === undefined
      };
    });

    const calculatedScore = answers.filter(a => a.isCorrect).length;

    const result = {
      id:           Date.now(),
      timestamp:    new Date().toISOString(),
      examType:     resolvedExamType,
      examDocId:    examDocId || null,      // null for legacy exams
      examTitle:    resolvedTitle  || null,
      studentName:  `${firstName} ${lastName}`.trim(),
      studentEmail: studentEmail,
      uid:          uid,
      score:        calculatedScore,
      total:        questionsArray.length,
      isTimeout:    isTimeout,
      violations:   violationCount,
      answers:      answers
    };

    await addDoc(collection(db, "examResults"), result);
    console.log("[saveExamResult] Saved for", studentEmail, "score:", calculatedScore, "/", questionsArray.length);

  } catch (err) {
    console.error("[saveExamResult] Firestore error:", err);
  }
}

// ── Result Page ──────────────────────────────────────────────────────────
function showGradesPage() {
  saveExamResult(false);

  const firstName  = localStorage.getItem("f_name") || "Student";
  const lastName   = localStorage.getItem("l_name") || "";
  const savedImage = localStorage.getItem("image")  || "";
  const imgTag     = savedImage
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
  exitFullscreen().catch(() => { });

  const firstName  = localStorage.getItem("f_name") || "Student";
  const lastName   = localStorage.getItem("l_name") || "";
  const savedImage = localStorage.getItem("image")  || "";
  const imgTag     = savedImage
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