//form.js controls the logic that lets user step through form
//this file should contain any logic that governs the behavior of the form (steps to show, when to show them, when not to move forward, etc)

window.addEventListener("DOMContentLoaded", screenSizeCheck);
window.addEventListener("resize", screenSizeCheck);

//change page behavior based on screen size
//desktop is multi-step and mobile show whole form
function screenSizeCheck() {
  if (window.innerWidth > 980) {
    appController("desktop");
  } else {
    appController("mobile");
  }
}

function appController(clientScreenSize) {
  const firstStageDone = Number(document.getElementById("firstStageDone").value);
  if(firstStageDone == 1) {
    return;
  }
  //if client screen size is desktop, we'll show only the correct step.
  if (clientScreenSize == "desktop") {
    formLoadDisplayHandler();
  }
  //if client screen size is mobile, show full form
  else{
    //show forms function handles displaying each form step
    //argument 1 = pass in the step that will be the current one
    //argument 2 = the amount of steps we want to show (showing step 3, so we want steps 2 and 1 showing as well
    //using 0 based index, so 0, 1, 2 will have our for loop run 3 times when i = 0 and i <= 2)
    showForms("step-2", 1);
  }
}

window.addEventListener("load", function () {
  const formButtons = document.getElementsByClassName("form-button");

  for (var i = 0; i < formButtons.length; i++) {
    if (formButtons[i].id == "checkout-button") {
      continue;
    }  
    formButtons[i].addEventListener("click", formStepper);
  }
});
//utility to find an element's (el) specific parent by class name (clas)
function findParent(el, clas) {
  let parent = el.parentNode;
  while (parent !== document.body) {
    if (parent.hasAttribute(clas)) {
      return parent; // Return the element if it has the attribute
    }
    parent = parent.parentNode;
  } 

  return el;
}

//utility to check whether element is a checkbox - used in validateForm() and showErrors()
const isCheckbox = (input) =>
  (input.getAttribute("type") === "checkbox") == true ? true : false;

//handler function that governs the showForms() function on page load
function formLoadDisplayHandler() {
  const formSteps = document.querySelectorAll('[step-container]');
  let currentStep = sessionStorage.getItem("current-step") ?? "step-1";

  //remove active and visible classes + attributes
  for (var i = 0; i < formSteps.length; i++) {
    formSteps[i].classList.remove("step-visible");
    delete formSteps[i].dataset["data-step-active"];
  }

  //check our currentStep value and call showForms() with the current step to show + amount of previous steps we want to show
  if (currentStep === "step-1") {
    showForms(currentStep, 0);
  } else {
    showForms(currentStep, 1);
  }
  sessionStorage.setItem("current-step", currentStep);
}

//function that shows form steps on button click
function formStepper(ev) {
  const nextStep = ev.target.getAttribute("data-form-target");
  const currentStep = sessionStorage.getItem("current-step");

  //set current step to be the next one
  //check current step for errors
  sessionStorage.setItem("current-step", nextStep);
  validateForm(nextStep, currentStep);
}

//params are targetStep (step we are currently on), and number of previous steps to show
function showForms(targetStep, numOfPrevSteps) {
  const formSteps = document.querySelectorAll('[step-container]');
  const formButtons = document.getElementsByClassName("form-button");
  const formContainer = document.getElementsByClassName("form-container")[0];
  //make sure all steps are 0 height so we dont have extra space once we show the right form step
  formContainer.style.height = "";

  //use our n parameter to govern how many steps to show
  for (var i = 0; i <= numOfPrevSteps; i++) {
    formSteps[i].classList.add("step-visible");
    formSteps[i].setAttribute("data-step-active", true);
  }

  //use our targetStep parameter to show the correct button
  for (var i = 0; i < formButtons.length; i++) {
    if (formButtons[i].id == "checkout-button") {
      continue;
    }
    formButtons[i].style.display = "none";
    if (formButtons[i].getAttribute("data-parent") === targetStep) {
      formButtons[i].style.display = "block";
    }
  }
}

//checks form steps for errors before allowing user to continue
function validateForm(nextStep, currentStep) {
  const formSteps = document.querySelectorAll('[step-container]');
  const donationAmt = sessionStorage.getItem("amount");
  const giftAmountInput = document.getElementById("giftAmount");  

  //create empty arrays for our inputs + selects
  let inputsArray = [];
  let selectsArray = [];
  //initial value is false for this - assume all fields are invalid until proven valid
  let formStepValid = false;
  //empty array for invalid inputs / selects
  let errorArray = [];

  //grab all selects/ inputs from the active steps (could be any number of them, we just want the active ones)
  for (var i = 0; i < formSteps.length; i++) {
    //make sure we target only the active steps
    if (formSteps[i].classList.contains("step-visible")) {
      let inputs = formSteps[i].getElementsByTagName("input");
      let selects = formSteps[i].getElementsByTagName("select");
      //we want access to all array methods like .push(), .concat(), etc, so let's save each input from the loop into an external array instead of overwriting on each loop iteration
      //using spread operator + .concat() here to extract the individual elements from HTML collection, so we can add them straight into our array on each loop iteration - instead of pushing the whole HTML collection into the array
      inputsArray = inputsArray.concat([...inputs]);
      selectsArray = selectsArray.concat([...selects]);
    }
  }

  //use spread operator again to create 1 new array from the 2 seperate arrays we created
  const fieldsToValidate = [...inputsArray, ...selectsArray];

  //checks to see if user has selected "Other", but hasn't input any value in #giftAmount
  //should be considered invalid input as no donation amount was entered
  //workaround for having the "optional" attribute on this input, as it isn't required for someone to fill this out unless they have chosen "Other"
  //the only way our donationAmt can be empty at this point is if "Other" is selected and nothing is input into the #giftAmount field
  if (donationAmt === "undefined" || donationAmt === "") {
    errorArray.push(giftAmountInput);
  }

  //here is where we will filter through our form fields
  //first make sure we have fields on the page to validate
  if (fieldsToValidate.length !== 0) {
    
    for (const el of fieldsToValidate) {
      el.classList.remove("error");
      //check to see if we have an email field
      if (el.getAttribute("type") === "email") {
        //check to see if email is valid
        if (!validateEmail(el.value)) {
          errorArray.push(el);
        }
      }

      const hasOptionalAttribute = el.hasAttribute("optional");
      //we want to ignore the submitOrder and pageSubmits hidden inputs
      //we want to ignore any inputs with optional attribute
      if (
        el.id !== "submitOrder" &&
        el.id !== "pageSubmits" &&
        hasOptionalAttribute == false
      ) {
        //push unchecked checkboxes into error array
        if (isCheckbox(el) && el.checked == false) {
          errorArray.push(el);
        }
        //push empty fields into errorArray
        else if (el.value.length == 0 || el.value === "") {
          errorArray.push(el);
        }
        //if none of these conditions are met, then all fields are valid
        else {
          formStepValid = true;
        }
      }
    }

    const emailFields = document.querySelectorAll('[type="email"]');
    if(emailFields[0].value !== emailFields[1].value) {
      errorArray.push(emailFields[0]);
      errorArray.push(emailFields[1]);
    } 
  }
  //no inputs on the page / in our array, we can set to true
  else {
    formStepValid = true;
  }
  // if we have valid inputs + selects and our error Array is empty we can show the next form step / submit
  if (formStepValid && errorArray.length == 0) {
    if (currentStep === "step-1") {
      nextStep = "step-2";
      showForms(nextStep, 1);
    }    
    else {
      submitOrd();
    }
    sessionStorage.setItem("current-step", nextStep);
  }
  //we have invalid fields and we need to keep our form on the current step + show errors
  else {
    sessionStorage.setItem("current-step", currentStep);
    showErrors(errorArray);
  }
}

//takes in errorArray as an argument
function showErrors(arr) {
  const errorMsgs = document.getElementsByClassName("error-msg");
  const errorText = document.createElement("span");
  errorText.textContent = `Please review these errors (marked in red) and try again.`;
  errorText.id = "error-text";
  errorText.classList.add("error-msg");

  //loop through error array + add error class
  for (const el of arr) {
    el.classList.add("error");
    //if input is checkbox, then add error class to the label
    //its difficult to reliably style checkboxes across browsers, so instead just make the label text look like error
    if (isCheckbox(el)) {
      const checkBoxParent = el.parentElement;
      checkBoxParent.nextElementSibling.classList.add("error");
    }
  }
  //check to see if error messages exist + remove if yes
  if (errorMsgs.length !== 0) {
    errorMsgs[0].remove();
  }
  //place error message in form step where first error input occurs + scroll to it
  const errorParent = findParent(arr[0], "step-container");
  (errorParent.querySelector('[error-container]') || errorParent).prepend(errorText);
  arr[0].scrollIntoView({ behavior: "smooth", block: "end", inline: "end" });
}

function validateEmail(email) {
  if (!email) {
    return false; // Handle empty input
  }
  // Regular expression for basic email format validation
  const emailPattern = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/;
  if (!emailPattern.test(email)) {
    return false; // Invalid format
  }
  // Additional checks (optional)
  if (email.length > 254) {
    return false; // Exceeds maximum length
  }

  return true; // Valid email
}
