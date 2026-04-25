const categoryList = document.querySelector("#categoryMenu");
const difficultyList = document.querySelector("#difficultyOptions");
const numbersOfQuestionsList = document.querySelector("#questionsNumber");
const startBTn = document.querySelector("#startQuiz");

startBTn.addEventListener("click", () => {

    const values = {
        category: categoryList.value,
        difficulty: difficultyList.value,
        numbers: numbersOfQuestionsList.value,
    }
    
    sessionStorage.setItem("examOptions", JSON.stringify(values));

    window.location.href = "exam.html";

    let exam = new Exam(values);

    console.log(exam);
    
})

