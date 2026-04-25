import { Exam }     from "./examClass.js";
import { Question } from "./examClass.js";

// EXAM DURATION 
const EXAM_DURATION_SECONDS = 30;

let questionsArray = [];
let myExam;
let currentQuestion; 

window.addEventListener("DOMContentLoaded", async () => {
  const userOptions = JSON.parse(sessionStorage.getItem("examOptions"));

  myExam = new Exam(userOptions);


  questionsArray = await myExam.getQuestions();
  questionsArray.sort(() => Math.random() - 0.5);

  // Display first question
  currentQuestion = new Question(0, questionsArray, myExam);
  currentQuestion.displayQuestions();

  // Start the time bar 

  const labelEl = document.getElementById("timerLabel");
  const fillEl  = document.getElementById("timerFill");

  myExam.startTimer(
    EXAM_DURATION_SECONDS,
    labelEl,
    fillEl,
    showTimeoutPage          
  );

  // Submit button 
  document.getElementById("submitBtn").addEventListener("click", () => {
    myExam.stopTimer();      
    showGradesPage();
  });
});


//  Result Page
function showGradesPage() {
  const user        = JSON.parse(sessionStorage.getItem("userData") || "{}");
  const firstName   = localStorage.getItem("f_name") || "Student";
  const lastName    = localStorage.getItem("l_name") || "";
  const savedImage  = localStorage.getItem("image") || "296fe121-5dfa-43f4-98b5-db50019738a7.jpg";


  document.querySelector(".exam-page").innerHTML = `
    <div class="result-page">
          <img id="imagepreview" src="${savedImage}"/>
      <div class="result-icon">🎉</div>
      <h2>Well done, <span class="result-name">${firstName} ${lastName}</span>!</h2>
      <div class="score-badge">
        ${myExam.grades} <span>/ ${questionsArray.length}</span>
      </div>
      <p>You submitted the exam on time. Great job!</p>
      <button class="btn-retry" onclick="window.location.href='start.html'">
        Try Again
      </button>
    </div>
  `;
}

//  TIMEOUT PAGE

function showTimeoutPage() {
  const user        = JSON.parse(sessionStorage.getItem("userData") || "{}");
  const firstName   = localStorage.getItem("f_name") || "Student";
  const lastName    = localStorage.getItem("l_name") || "";
  const savedImage  = localStorage.getItem("image") || "296fe121-5dfa-43f4-98b5-db50019738a7.jpg";

  document.querySelector(".exam-page").innerHTML = `
    <div class="result-page timeout">
      <img id="imagepreview" src="${savedImage}"/>
      <div class="result-icon">⏰</div>
      <h2>Time's up, <span class="result-name">${firstName} ${lastName}</span>!</h2>
      <p>
        Unfortunately your exam time has ended before you could submit.<br/>
        You answered <strong>${myExam.grades}</strong> out of
        <strong>${questionsArray.length}</strong> correctly.
      </p>
      <button class="btn-retry" onclick="window.location.href='start.html'">
        Try Again
      </button>
    </div>
  `;
}