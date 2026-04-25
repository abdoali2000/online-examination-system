const questionCards = document.querySelector(".exam-body");
export class Exam {
  constructor({ category, difficulty, numbers }) {
    this.grades   = 0;
    this.category = category;
    this.difficulty = difficulty;
    this.numbers  = numbers;
    // Mark feature
    this.markedQuestions = [];
    // Timer 
    this.timerInterval;  
    this.onTimeout;   
  }

  // Fetch data

  getQuestions = async () => {
    try {
      const res  = await fetch(
        `https://opentdb.com/api.php?amount=${this.numbers}&category=${this.category}&difficulty=${this.difficulty}`
      );
      const data = await res.json();
      return data.results;
    } catch (err) {
      throw err;
    }
  };

 // Time bar
  startTimer = (durationSeconds, labelEl, fillEl, onTimeout) => {
    this.onTimeout = onTimeout;
    let remaining   = durationSeconds;        
    const total     = durationSeconds;         

    const format = (s) => {
      const m = String(Math.floor(s / 60)).padStart(2, "0");
      const sec = String(s % 60).padStart(2, "0");
      return `${m}:${sec}`;
    };

    // Modify format and bar style according to duration
    labelEl.textContent      = format(remaining);
    fillEl.style.width       = "100%";


    this.timerInterval = setInterval(() => {
      remaining -= 1;

      labelEl.textContent = format(remaining);

      const pct = (remaining / total) * 100;  
      fillEl.style.width = `${pct}%`;

      // change bar color
      fillEl.classList.remove("warning", "critical");
      if (pct <= 15) {
        fillEl.classList.add("critical");      
      } else if (pct <= 33) {
        fillEl.classList.add("warning");       
      }

      // Timeout
      if (remaining <= 0) {
        clearInterval(this.timerInterval);
        onTimeout();
      }
    }, 1000);
  };

  // Stop the timer manually
  stopTimer = () => {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
    }
  };


// Toggle marked questions
  toggleMark = (questionIndex) => {
    const pos = this.markedQuestions.indexOf(questionIndex);
    if (pos === -1) {
      this.markedQuestions.push(questionIndex);  
      return true;
    } else {
      this.markedQuestions.splice(pos, 1);      
      return false;
    }
  };

  isMarked = (questionIndex) => this.markedQuestions.includes(questionIndex);
}


// Question class
export class Question {
  constructor(i, questionsArray, myExam) {
    this.index          = i;
    this.questionsArray = questionsArray;
    this.myExam         = myExam;

    const current         = questionsArray[i];
    this.difficulty       = current.difficulty;
    this.category         = current.category;
    this.question         = current.question;
    this.correctAnswer    = current.correct_answer;
    this.incorrectAnswers = current.incorrect_answers;
    this.allAnswers       = this.randomizeAnswers();
    this.isAnswered       = false;
  }

  
  displayQuestions = () => {
    const total    = this.questionsArray.length;
    const isMarked = this.myExam.isMarked(this.index);

    questionCards.innerHTML = `
      <!-- Left column: question card -->
      <div class="question-card animate__animated animate__fadeIn">

        <!-- Category + counter -->
        <div class="question-meta">
          <span class="question-category">${this.category}</span>
          <span class="question-counter">Q ${this.index + 1} / ${total}</span>
        </div>

        <!-- Question text -->
        <p class="question-text">${this.question}</p>

        <!-- Answer choices -->
        <ul class="answers-list">
          ${this.allAnswers
            .map(
              (ans) =>
                `<li class="answer-item" data-answer="${ans}">
                  <span>${ans}</span>
                  <span class="answer-dot"></span>
                </li>`
            )
            .join("")}
        </ul>

        <!-- Navigation row: Prev | [num] | Next  +  Mark -->
        <div class="question-nav">
          <button class="btn-nav btn-prev" ${this.index === 0 ? "disabled" : ""}>← Prev</button>
          <button class="btn-nav btn-next" ${this.index === total - 1 ? "disabled" : ""}>Next →</button>

          <!-- MARK BUTTON -->
          <button class="btn-mark ${isMarked ? "marked" : ""}">
            Mark
          </button>
        </div>
      </div>

      <!-- Right column: mark sidebar -->
      <aside class="mark-sidebar">
        <h4>📌 Marked</h4>
        <ul class="mark-list" id="markList"></ul>
      </aside>
    `;

    
    this.renderMarkList();

    this.attachListeners();
  };


  renderMarkList = () => {
    const markList = document.getElementById("markList");
    if (!markList) return;

    if (this.myExam.markedQuestions.length === 0) {
      markList.innerHTML = `<li class="mark-empty">No questions marked yet.</li>`;
      return;
    }

    const sorted = [...this.myExam.markedQuestions].sort((a, b) => a - b);

    markList.innerHTML = sorted
      .map(
        (idx) =>
          `<li class="mark-list-item" data-idx="${idx}">
             Q ${idx + 1} — marked
           </li>`
      )
      .join("");

    
    markList.querySelectorAll(".mark-list-item").forEach((item) => {
      item.addEventListener("click", () => {
        const target = new Question(
          parseInt(item.dataset.idx),
          this.questionsArray,
          this.myExam
        );
        target.displayQuestions();
      });
    });
  };

 
  attachListeners = () => {
    // Answer clicks
    document.querySelectorAll(".answer-item").forEach((li) =>
      li.addEventListener("click", () => this.checkAnswers(li))
    );

const saved = this.questionsArray[this.index].selectedAnswer;
if (saved) {
  this.isAnswered = true;
  document.querySelectorAll(".answer-item").forEach(item => {
    if (item.dataset.answer?.trim() === saved) {
      item.classList.add(saved === this.correctAnswer.trim() ? "correct" : "wrong");
    }
    if (item.dataset.answer?.trim() === this.correctAnswer.trim() && saved !== this.correctAnswer.trim()) {
      item.classList.add("correct");
    }
  });
}

    // Next - Prev
    document.querySelector(".btn-next")
      ?.addEventListener("click", () => this.displayNextQuestion());
    document.querySelector(".btn-prev")
      ?.addEventListener("click", () => this.displayPreviousQuestion());

    // Mark button
    document.querySelector(".btn-mark")
      ?.addEventListener("click", (e) => {
        const nowMarked = this.myExam.toggleMark(this.index);

        // Toggle state of button 
        e.currentTarget.classList.toggle("marked", nowMarked);

        // Refresh sidebar 
        this.renderMarkList();
      });
  };

  
  checkAnswers = (li) => {
  if (this.isAnswered) return;
  this.isAnswered = true;

  const chosen = li.dataset.answer?.trim();
  
  this.questionsArray[this.index].selectedAnswer = chosen;

  if (chosen === this.correctAnswer.trim()) {
    this.myExam.grades++;
    li.classList.add("correct", "animate__animated", "animate__pulse");
  } else {
    li.classList.add("wrong", "animate__animated", "animate__shakeX");
    document.querySelectorAll(".answer-item").forEach(item => {
      if (item.dataset.answer?.trim() === this.correctAnswer.trim())
        item.classList.add("correct");
    });
  }
};


  randomizeAnswers = () => {
    return [...this.incorrectAnswers, this.correctAnswer].sort(
      () => Math.random() - 0.5
    );
  };

  displayNextQuestion = () => {
    if (this.index < this.questionsArray.length - 1) {
      new Question(this.index + 1, this.questionsArray, this.myExam).displayQuestions();
    }
  };

  displayPreviousQuestion = () => {
    if (this.index > 0) {
      new Question(this.index - 1, this.questionsArray, this.myExam).displayQuestions();
    }
  };
}