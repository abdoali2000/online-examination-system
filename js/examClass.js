// ============================================================
//  examClass.js — Exam and Question classes
//  Supports both T/F and MCQ question formats from questions.js
// ============================================================

const questionCards = document.querySelector(".exam-body");

// ──────────────────────────────────────────────────────────────
//  Exam class — holds grades, timer, and marked questions
// ──────────────────────────────────────────────────────────────
export class Exam {
  constructor({ examType }) {
    this.grades          = 0;
    this.examType        = examType;
    this.markedQuestions = [];
    this.timerInterval   = null;
    this.onTimeout       = null;
  }

  // ── Load questions from localStorage ──────────────────────
  getQuestions() {
    const allQuestions = JSON.parse(
      localStorage.getItem("adminQuestions") || "[]"
    );
    const filtered = allQuestions.filter(q => q.examType === this.examType);
    // Shuffle
    return filtered.sort(() => Math.random() - 0.5);
  }

  // ── Timer ──────────────────────────────────────────────────
  startTimer(durationSeconds, labelEl, fillEl, onTimeout) {
    this.onTimeout = onTimeout;
    let remaining  = durationSeconds;
    const total    = durationSeconds;

    const format = s => {
      const m   = String(Math.floor(s / 60)).padStart(2, "0");
      const sec = String(s % 60).padStart(2, "0");
      return `${m}:${sec}`;
    };

    labelEl.textContent = format(remaining);
    fillEl.style.width  = "100%";

    this.timerInterval = setInterval(() => {
      remaining -= 1;
      labelEl.textContent = format(remaining);

      const pct = (remaining / total) * 100;
      fillEl.style.width = `${pct}%`;

      fillEl.classList.remove("warning", "critical");
      if (pct <= 15)      fillEl.classList.add("critical");
      else if (pct <= 33) fillEl.classList.add("warning");

      if (remaining <= 0) {
        clearInterval(this.timerInterval);
        onTimeout();
      }
    }, 1000);
  }

  stopTimer() {
    if (this.timerInterval) clearInterval(this.timerInterval);
  }

  // ── Mark / Unmark ──────────────────────────────────────────
  toggleMark(questionIndex) {
    const pos = this.markedQuestions.indexOf(questionIndex);
    if (pos === -1) {
      this.markedQuestions.push(questionIndex);
      return true;
    } else {
      this.markedQuestions.splice(pos, 1);
      return false;
    }
  }

  isMarked(questionIndex) {
    return this.markedQuestions.includes(questionIndex);
  }
}

// ──────────────────────────────────────────────────────────────
//  Question class — renders and handles a single question
// ──────────────────────────────────────────────────────────────
export class Question {
  constructor(i, questionsArray, myExam) {
    this.index          = i;
    this.questionsArray = questionsArray;
    this.myExam         = myExam;
    this.isAnswered     = false;

    const q = questionsArray[i];
    this.questionType = q.type;           // "tf" | "mcq"
    this.questionText = q.text;
    this.examType     = q.examType;

    // Normalise correct answer and options list
    if (q.type === "tf") {
      this.correctAnswer = q.correct ? "True" : "False";
      this.allAnswers    = ["True", "False"];
    } else {
      this.correctAnswer = q.options[q.correctIndex];
      this.allAnswers    = q.options;     // Keep original A-B-C-D order
    }
  }

  // ── Render question card ───────────────────────────────────
  displayQuestions() {
    const total    = this.questionsArray.length;
    const isMarked = this.myExam.isMarked(this.index);
    const typeBadge = this.questionType === "tf" ? "True / False" : "MCQ";
    const examLabel = this.examType === "medical" ? "🏥 Medical" : "💼 Soft Skills";

    questionCards.innerHTML = `
      <!-- Left column: question card -->
      <div class="question-card animate__animated animate__fadeIn">

        <!-- Category + type badge + counter -->
        <div class="question-meta">
          <span class="question-category">${examLabel}</span>
          <span class="question-type-badge ${this.questionType}">${typeBadge}</span>
          <span class="question-counter">Q ${this.index + 1} / ${total}</span>
        </div>

        <!-- Question text -->
        <p class="question-text">${this.questionText}</p>

        <!-- Answer choices -->
        <ul class="answers-list">
          ${this.allAnswers
            .map((ans, idx) => {
              const label = this.questionType === "mcq"
                ? `<span class="ans-label">${String.fromCharCode(65 + idx)}.</span>`
                : "";
              return `<li class="answer-item" data-answer="${ans}">
                ${label}<span class="ans-text">${ans}</span>
                <span class="answer-dot"></span>
              </li>`;
            })
            .join("")}
        </ul>

        <!-- Navigation -->
        <div class="question-nav">
          <button class="btn-nav btn-prev" ${this.index === 0 ? "disabled" : ""}>← Prev</button>
          <button class="btn-nav btn-next" ${this.index === total - 1 ? "disabled" : ""}>Next →</button>
          <button class="btn-mark ${isMarked ? "marked" : ""}">Mark</button>
        </div>
      </div>

      <!-- Right column: marked sidebar -->
      <aside class="mark-sidebar">
        <h4>📌 Marked</h4>
        <ul class="mark-list" id="markList"></ul>
      </aside>
    `;

    this.renderMarkList();
    this.attachListeners();

    // Show submit button only on the last question
    const submitBtn = document.getElementById("submitBtn");
    if (submitBtn) {
      submitBtn.style.display = this.index === total - 1 ? "inline-block" : "none";
    }
  }

  // ── Render marked question sidebar ────────────────────────
  renderMarkList() {
    const markList = document.getElementById("markList");
    if (!markList) return;

    if (this.myExam.markedQuestions.length === 0) {
      markList.innerHTML = `<li class="mark-empty">No questions marked yet.</li>`;
      return;
    }

    const sorted = [...this.myExam.markedQuestions].sort((a, b) => a - b);
    markList.innerHTML = sorted
      .map(idx => `<li class="mark-list-item" data-idx="${idx}">Q ${idx + 1} — marked</li>`)
      .join("");

    markList.querySelectorAll(".mark-list-item").forEach(item => {
      item.addEventListener("click", () => {
        new Question(
          parseInt(item.dataset.idx),
          this.questionsArray,
          this.myExam
        ).displayQuestions();
      });
    });
  }

  // ── Attach DOM listeners ───────────────────────────────────
  attachListeners() {
    // Answer clicks
    document.querySelectorAll(".answer-item").forEach(li =>
      li.addEventListener("click", () => this.checkAnswers(li))
    );

    // Restore previously saved answer — neutral highlight only, no correct/wrong reveal
    const saved = this.questionsArray[this.index].selectedAnswer;
    if (saved) {
      this.isAnswered = true;
      document.querySelectorAll(".answer-item").forEach(item => {
        if (item.dataset.answer === saved) {
          item.classList.add("selected");
        }
      });
    }

    // Navigation
    document.querySelector(".btn-next")
      ?.addEventListener("click", () => this.displayNextQuestion());
    document.querySelector(".btn-prev")
      ?.addEventListener("click", () => this.displayPreviousQuestion());

    // Mark button
    document.querySelector(".btn-mark")
      ?.addEventListener("click", e => {
        const nowMarked = this.myExam.toggleMark(this.index);
        e.currentTarget.classList.toggle("marked", nowMarked);
        this.renderMarkList();
      });
  }

  // ── Check answer ───────────────────────────────────────────
  checkAnswers(li) {
    if (this.isAnswered) return;
    this.isAnswered = true;

    const chosen = li.dataset.answer;
    this.questionsArray[this.index].selectedAnswer = chosen;

    // Track grade silently for admin — no visual feedback shown to student
    if (chosen === this.correctAnswer) {
      this.myExam.grades++;
    }

    // Just show neutral "selected" state
    document.querySelectorAll(".answer-item").forEach(item => item.classList.remove("selected"));
    li.classList.add("selected");
  }

  // ── Navigation ─────────────────────────────────────────────
  displayNextQuestion() {
    if (this.index < this.questionsArray.length - 1) {
      new Question(this.index + 1, this.questionsArray, this.myExam).displayQuestions();
    }
  }

  displayPreviousQuestion() {
    if (this.index > 0) {
      new Question(this.index - 1, this.questionsArray, this.myExam).displayQuestions();
    }
  }
}