if(!localStorage.getItem("email")){
    window.location.replace("register.html");
}
// name
const email = document.querySelector("#email");
const emailError = document.querySelector("#error_email");

//passwod
const password = document.querySelector("#password");
const passwordError = document.querySelector("#error_pass");

// form
const form = document.querySelector("#loginForm");

// btn
const btn = document.querySelector("#submt");

// error function
function error(input, div, msg) {
    input.style.border = "2px solid red";
    input.style.color = "";
    input.style.animation = "shake 0.5s ease-in-out ";
    div.innerHTML = msg;
    div.style.color = "red";
}

//valid function
function valid(input, div) {
    input.style.border = "2px solid green";
    input.style.color = "green";
    input.style.animation = "";
    div.innerHTML = "";
    div.style.color = "green";
}

//validation email
let regexEmail = /^[a-zA-Z][a-zA-Z0-9]{3,19}@[a-zA-Z]+\.[a-zA-Z]{2,}$/;
function validateEmail() {
    const emailVal = document.querySelector("#email").value;
    if (regexEmail.test(emailVal)) {
        valid(email, emailError)
    } else {
        error(email, emailError, "email not valid")
    }
}

// validation pass
let regexPass = /^[0-9]{6,}$/;
function validatePassword() {
    const passwordVal = document.querySelector("#password").value;
     if (regexPass.test(passwordVal)) {
        valid(password, passwordError)
    } else {
        error(password, passwordError, "Password should be numbers and at least 6 digits");
    }
}

form.addEventListener("submit", (e) => {
    e.preventDefault()

    // condition
    let isValid = true;

    //email
    if(email.value.trim() === ""){
        error(email, emailError, "Please enter the email");
        isValid = false;
    }
    else if(!regexEmail.test(email.value)){
        error(email, emailError, "Please enter a valid email");
        isValid = false;
    }
    else if(email.value !== localStorage.getItem("email")){
        error(email, emailError, "email is not Exist");
        isValid = false;
    }
    else{
        valid(email, emailError);
    }

    //password
    if(password.value.trim() === ""){
        error(password, passwordError, "Please enter the password");
        isValid = false;
    }
    else if(!regexPass.test(password.value)){
        error(password, passwordError, "Password should be numbers and at least 6 digits");
        isValid = false;
    }  //   string in input               string
    else if (password.value !== localStorage.getItem("password")){
        error(password, passwordError, "Password is not correct");
        isValid = false;
    }
    else{
         valid(password, passwordError);
    }

    // true
    if(isValid){
        setTimeout(() => {
            window.location.replace("start.html");
        }, 1500);
    }
    
})