if(localStorage.getItem("email")){
    window.location.replace("index.html");
}
//name
const firstName = document.querySelector("#Fname");
const lastName = document.querySelector("#Lname");
const errorFirstName = document.querySelector("#error_fn");
const errorLastName = document.querySelector("#error_ln");

// email
const email = document.querySelector("#email");
const emailError = document.querySelector("#error_email");

// file
const file = document.querySelector("#file");
const imagePreview = document.querySelector("#imagePreview");
const fileError = document.querySelector("#error_file");

//password
const password = document.querySelector("#password");
const passwordError = document.querySelector("#error_pass");

// re password
const rePassword = document.querySelector("#re_password");
const erPasswordError = document.querySelector("#error_repass");

// form
const form = document.querySelector("#registrationForm");

//register btn
const btn = document.querySelector("#sbmit");

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

//validation name
let regexFname = /^[a-zA-Z]+$/;
function validFirstName() {
    const firstNameVal = firstName.value;
    if (regexFname.test(firstNameVal)) {
        valid(firstName, errorFirstName)
    } else {
        error(firstName, errorFirstName, "First name should contain letters only");
    }
}

// validation last name
let regexLastName = /^[a-zA-Z]+$/;
function validationLastName() {
    const lastNameVal = document.querySelector("#Lname").value;
    if (regexLastName.test(lastNameVal)) {
        valid(lastName, errorLastName)
    } else {
        error(lastName, errorLastName, "Last name should contain letters only");
    }
}

//validation email
let regexEmail = /^[a-zA-Z][a-zA-Z0-9]{3,19}@[a-zA-Z]+\.[a-zA-Z]{2,}$/;
function validationEmail() {
    const emailVal = document.querySelector("#email").value;
    if (regexEmail.test(emailVal)) {
        valid(email, emailError)
    } else {
        error(email, emailError, "email not valid")
    }
}

//validate files
function validateFiles(){
    valid(file, fileError);
    const files = file.files[0];
    if(files){
        const reader = new FileReader();
        reader.onload = function(e){
            imagePreview.src = e.target.result;
        }
        reader.readAsDataURL(files)
    }
}
// validation pass
let regexPass = /^[0-9]{6,}$/;
function validationPassword() {
    const passwordVal = document.querySelector("#password").value;
     if (regexPass.test(passwordVal)) {
        valid(password, passwordError)
    } else {
        error(password, passwordError, "Password should be numbers and at least 6 digits");
    }
}

// validation re password
function validationRePassword() {
    const passwordVal = document.querySelector("#password").value;
    const rePasswordVal = document.querySelector("#re_password").value;
    if (rePasswordVal === passwordVal) {
        valid(rePassword, erPasswordError);
    }
    else {
        error(rePassword, erPasswordError, "Passwords do not match");
    }
};

// form validation
form.addEventListener("submit", (e) => {
    e.preventDefault();

    let isValid = true; 

    // First Name
    if (firstName.value.trim() === "") {
        error(firstName, errorFirstName, "Please enter the First name");
        isValid = false;
    } else if (!regexFname.test(firstName.value)) {
        error(firstName, errorFirstName, "First name should contain letters only");
        isValid = false;
    } else {
        valid(firstName, errorFirstName);
    }

    // Last Name
    if (lastName.value.trim() === "") {
        error(lastName, errorLastName, "Please enter the Last name");
        isValid = false;
    } else if (!regexLastName.test(lastName.value)) {
        error(lastName, errorLastName, "Last name should contain letters only");
        isValid = false;
    } else {
        valid(lastName, errorLastName);
    }

    // Email
    if (email.value.trim() === "") {
        error(email, emailError, "Please enter the email");
        isValid = false;
    } else if (!regexEmail.test(email.value)) {
        error(email, emailError, "Please enter a valid email");
        isValid = false;
    } else {
        valid(email, emailError);
    }

    // File
    if (file.files.length === 0) {
        error(file, fileError, "Please choose image");
        isValid = false;
    } else {
        valid(file, fileError);
    }

    // Password
    if (password.value.trim() === "") {
        error(password, passwordError, "Please enter the password");
        isValid = false;
    } else if (!regexPass.test(password.value)) {
        error(password, passwordError, "Password should be numbers and at least 6 digits");
        isValid = false;
    } else {
        valid(password, passwordError);
    }

    // Re-password
    if (rePassword.value.trim() === "") {
        error(rePassword, erPasswordError, "Please re-enter the password");
        isValid = false;
    } else if (rePassword.value !== password.value) {
        error(rePassword, erPasswordError, "Passwords do not match");
        isValid = false;
    } else {
        valid(rePassword, erPasswordError);
    }

    //  true
    if (isValid) {
        localStorage.setItem("f_name", firstName.value)
        localStorage.setItem("l_name", lastName.value)
        localStorage.setItem("email", email.value)
        localStorage.setItem("password", password.value)
        localStorage.setItem("image", imagePreview.src)
        console.log(localStorage)
        setTimeout(() => {
            window.location.replace("index.html");
        }, 1500);
    }
});

