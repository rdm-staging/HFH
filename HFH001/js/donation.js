const donationAmountTarget = document.querySelector("#donationAmountTarget");
const donationContainer = document.getElementById("donationAmount");

//GUIDE
//
//1. CHANGING AMOUNTS
//change the amounts in the "amount" param
//001 should always be lowest donation amount, regardless of donation order, 002 will be next lowest, etc.
//
//2. CHANGING ORDER OF AMOUNT CHOICES
//you can specify the donation order in the donationOrder param, passed as an array
//the first value in the array will be shown first
//
//3. PRECHECKING A DONATION AMOUNT
//set the desired amount's prechecked param to true, while setting all other amount's prechecked params to false
//
//4. CHANGING LAYOUT OF DONATION CHOICES
//use the pageTemplate obj and its params to control how the choices look.
//rowGrid controls how many choices are in a row - default is set to 3
//setting freeformInsideLabel to true will put the freeform input inside its corresponding label (reference the ACS 1 page format)
//setting hideOtherLabel to true will hide the "Other" label, if it exists, and add placeholder text "Other" to the freeform input (reference STC 1 page format).
//setting hideOtherLabel to false will place the freeform input at the end of the choices by default.
//setting disableFreeformOnPageLoad to true will enable the free form on page load, and will keep it enabled when other choices are clicked as well
//setting disableFreeformOnPageLoad to false will disabled the freeform by default, and disable it when other choices are clicked
//
//5. CHANGING PROCESSING FEES
//show/ hide them by setting true/false
//change feePercentage to whatever decimal needed
//prechecked will check the checkbox on initial page load
//label text controls the opt in language
//totalDonationText controls what will be said in the total donation statement
//
//6. CHANGING MIN/MAX DONATIONS ALLOWED
//change min + max donation amounts in the minimumDonation/maximumDonation params below - passed as a number, please do not add any decimals, dollar signs, or extra digits.
//
//7. DONATION STATEMENTS
//change/add/remove donation statements in the pageTemplate donationStatements object
//if you simply want to remove statements from the page, change the "show" value to false
//make sure that each statement key (ex: statement001) has the 3 digit code that corresponds to its value in the donationParameters

//need to set this params object to the window so our ext JS files can access it
const donationParameters = {
  "001": { amount: "20", prechecked: false, inputType: "radio" },
  "002": { amount: "23", prechecked: true, inputType: "radio" },
  "003": { amount: "25", prechecked: false, inputType: "radio" },
  "004": { amount: "", prechecked: false, inputType: "radio" },
  donationOrder: ["003", "002", "001", "004"],
  pageTemplate: {
    rowGrid: 3,
    freeformInsideLabel: true,
    hideOtherLabel: false,
    disableFreeformOnPageLoad: false,
    donationStatements: {
      show: false,
      statement001: ``,
      statement002: ``,
      statement003: ``,
      statement004: ``,
    },
  },
  processingFees: {
    show: true,
    feePercentage: 0.04,
    prechecked: true,
    labelText: `I want 100% to go to Habitat for Humanity. Please increase my 
    amount to cover credit card transaction fees, increasing my total monthly donation to`,
    totalDonationText: "",
  },
  minimumDonation: 20,
  maximumDonation: 500,
  initDonationGridCSS: function () {
    //create + inject stylesheet that automatically formats divs
    const styles = document.createElement("style");
    const rowGridSize = this.pageTemplate.rowGrid;
    let childNodesCount = 0;
    for (const child of donationAmountTarget.childNodes) {
      if (
        child.nodeName.toLowerCase() === "div" &&
        child.classList.contains("donation-grid-item")
      ) {
        childNodesCount++;
      }
    }
    styles.textContent = `
.donation-grid {
display: flex;
flex-wrap: wrap;
align-items: space-evenly;
width: 100%;
}
.donation-grid-item {
flex-basis: ${95 / rowGridSize}%;
margin: ${(100 / rowGridSize - 95 / rowGridSize) * 0.5}%;
}
label.contains-freeform {
display: flex;
}
.donation-grid-item.item-end {
order: ${childNodesCount + 1};
}
.donation-grid-item label {
margin: 0;
}
.freeform-container, form .freeform-container input[type="text"] {
height: 100%;
}
.accept-fees-container {
display: flex;
align-items: space-evenly;
}
.fees-checkbox-container {
flex-basis: 10%;
}
.fees-checkbox-container .accept-fees {
display: flex;
align-self: center;
}
.fees-label-container {
flex-basis: 90%;
}
`;
    donationAmountTarget.prepend(styles);
  },
  //method to create inputs
  createInput: function (code) {
    //define once so we don't have to keep calculating
    const inputType = this[code].inputType;
    const inputAmount = this[code].amount;
    let items = {};
    const id =
      inputAmount.length === 0 ? "amountOther" : `amount${code.slice(-1)}`;
    const input = createNode("input", {
      type: inputType,
      name: "selection",
      id: id,
      class: inputType === "radio" ? "hidden" : "gift",
      value: code,
    });
    const label = createNode("label", {
      for: id,
      class: "donation-choice",
    });
    const labelText = inputAmount === "" ? `Other` : `$${inputAmount}`;
    label.textContent = labelText;
    input.addEventListener("click", function (ev) {
      const val = this.value;
      donationChoiceHandler(ev.target.value, donationParameters[val].amount);
    });
    items["input"] = input;
    items["label"] = label;
    //empty amount means we need freeform input
    if (this[code].amount === "") {
      const freeformInput = createNode("input", {
        name: "giftAmount",
        class: "donation-other",
        id: "giftAmount",
        optional: "",
        type: "text",
        placeholder: this.pageTemplate.hideOtherLabel ? "Other" : "",
        value: "",
      });
      const freeformContainer = createNode("div", {
        id: "gift",
        class: "freeform-container",
      });
      if (this.pageTemplate.disableFreeformOnPageLoad) {
        freeformInput.setAttribute("disabled", "disabled");
        freeformContainer.classList.add("disabled");
      }
      freeformContainer.appendChild(freeformInput);
      items["freeform"] = freeformContainer;
    }
    return items;
  },
  populateChoice: function () {
    if (sessionStorage.getItem("donation") === null) {
      for (const value of Object.values(this.donationOrder)) {
        if (this[value].prechecked) {
          const donationPreCheckCode = value;
          const donationPreCheckValue = this[value].amount;
          const preCheckInput = document.querySelector(
            `[value="${donationPreCheckCode}"]`
          );
          preCheckInput.checked = true;
          const preCheckLabel = document.querySelector(
            `[for="${preCheckInput.id}"]`
          );
          preCheckLabel.classList.add("donation-selected");
          donationChoiceHandler(donationPreCheckCode, donationPreCheckValue);
          this.displayDonationStatements(donationPreCheckCode);
        }
      }
    } else {
      if (donationAmt < donationParameters.minimumDonation) {
        errorHandling(1);
      } else if (donationAmt > donationParameters.maximumDonation) {
        errorHandling(2);
      }
      donationCode = sessionStorage.getItem("donation");
      donationAmt = sessionStorage.getItem("amount");
      donationChoiceHandler(donationCode, donationAmt);
      this.displayDonationStatements(donationCode);
    }
  },
  //populate donation buttons based on the order we want
  displayDonationAmounts: function () {
    const donationAmountOrder = this.donationOrder;
    let count = 0;
    //need to reverse the order, so the desired first amount is appended last
    donationAmountOrder.reverse();
    for (const code of this.donationOrder) {
      //create a new element for every loop iteration
      const donationAmtDiv = createNode("div", {
        class: "donation-grid-item",
      });
      const inputAndLabel = this.createInput(code);
      const donationInput = inputAndLabel.input;
      const donationLabel = inputAndLabel.label;
      donationAmtDiv.append(donationInput);
      donationAmtDiv.append(donationLabel);
      if (this.pageTemplate.hideOtherLabel && this[code].amount === "") {
        donationLabel.classList.add("hidden");
        if (donationLabel.parentNode.classList.contains("donation-grid-item")) {
          donationLabel.parentNode.classList.add("hidden");
        }
      }
      if (inputAndLabel.freeform) {
        if (this.pageTemplate.freeformInsideLabel) {
          inputAndLabel.label.append(inputAndLabel.freeform);
          inputAndLabel.label.classList.add("contains-freeform");
        } else {
          const freeformDonationAmtDiv = createNode("div", {
            class: this.pageTemplate.hideOtherLabel
              ? "donation-grid-item"
              : "donation-grid-item item-end",
          });
          freeformDonationAmtDiv.appendChild(inputAndLabel.freeform);
          donationAmountTarget.appendChild(freeformDonationAmtDiv);
        }
      }
      donationAmountTarget.classList.add("donation-grid");
      donationAmountTarget.prepend(donationAmtDiv);
      count++;
    }
    if (this.processingFees.show) {
      const feesConatiner = createNode("div", {
        class: "accept-fees-container",
      });
      const feesCheckboxContainer = createNode("div", {
        class: "fees-checkbox-container",
      });
      const feesCheckbox = createNode("input", {
        type: "checkbox",
        name: "acceptFees",
        id: "acceptFees",
        optional: "",
        class: "accept-fees",
      });
      const feesLabelContainer = createNode("div", {
        class: "fees-label-container",
      });
      const feesLabel = createNode("label", {
        for: "acceptFees",
        class: "accept-label",
      });
      feesLabel.textContent = this.processingFees.labelText;
      const totalDonationContainer = createNode("p", {
        class: "total-donation-container",
      });
      const totalDonation = createNode("span", {
        class: "total-donation",
      });
      totalDonationContainer.textContent =
        " " + this.processingFees.totalDonationText;
      totalDonationContainer.prepend(totalDonation);
      feesCheckboxContainer.appendChild(feesCheckbox);
      feesLabelContainer.appendChild(feesLabel);
      feesConatiner.appendChild(feesCheckboxContainer);
      feesConatiner.appendChild(feesLabelContainer);
      feesConatiner.appendChild(totalDonationContainer);
      donationContainer.appendChild(feesConatiner);
    }
    this.populateChoice();
  },
  displayDonationStatements: function (code) {
    const showStatements = this.pageTemplate.donationStatements.show;
    const statementAppendReference = document.querySelector(
      ".accept-fees-container"
    );
    let statement;
    if (showStatements) {
      statement = document.querySelector("#donation-statement");
      if (statement) {
        statement.innerHTML = "";
      } else {
        statement = createNode("p", {
          id: "donation-statement",
          class: `donation-statement`,
          statement: code,
        });
      }
      statement.innerHTML =
        donationParameters.pageTemplate.donationStatements[`statement${code}`];
      donationContainer.insertBefore(statement, statementAppendReference);
    }
  },
};

//check if donation choice exists, if yes select that amount
let donationCode = sessionStorage.getItem("donation") || "";
let donationAmt = sessionStorage.getItem("amount") || "";
const donationForm = document.getElementsByTagName("form")[0];

//used to show different error msgs based on user input in the "Other" donation amount field
const errorMapping = {
  0: ``,
  1: `The amount entered is less than the minimum donation amount. Please choose an amount greater than $${donationParameters.minimumDonation}.00.`,
  2: `The amount entered exceeds the maximum donation amount. Please choose an amount less than or equal to $${donationParameters.maximumDonation}.00.`,
  3: `No special characters or letters, and no more than 2 decimal places allowed.`,
};
//function to output errors based on "Other" input values
function errorHandling(errorMappingNum) {
  const userErrorDivs = document.getElementsByClassName("userInputError");
  const donationFormSubmit = donationForm.getElementsByTagName("button")[0];
  const errorAppendReference = document.querySelector("#donationAmountTarget");
  //if passed a value of 0 - that means that user input is valid
  //remove all error mssgs if they exist
  //allow user to click btn
  if (errorMappingNum == 0) {
    for (var i = 0; i < userErrorDivs.length; i++) {
      donationContainer.removeChild(userErrorDivs[i]);
    }
    donationFormSubmit.removeAttribute("disabled");
  }
  //else remove current error msg (we may need a different one)
  //append new msg + disable btn
  else {
    for (var i = 0; i < userErrorDivs.length; i++) {
      donationContainer.removeChild(userErrorDivs[i]);
    }
    //create our error element (one may not exist) + style it
    const errorText = createNode("p", {
      class: "userInputError w-100 d-block",
      style: "color:red",
    });
    //give the appropriate message based on the n value passed in
    errorText.textContent = errorMapping[errorMappingNum];
    donationContainer.insertBefore(errorText, errorAppendReference);
    //show generic "Your donation" text instead of the invalid user input
    $(".total-donation").text(`Your donation`);
    donationFormSubmit.setAttribute("disabled", "disabled");
  }
}
function removeErrorClass(el) {
  const e = el[0];
  let elemsToClassChange = [e];
  //loop through and remove all error classes if they are placed on our donation choices
  if (
    e.nodeName.toLowerCase() === "label" &&
    e.classList.contains("donation-choice")
  ) {
    elemsToClassChange = [];
    elemsToClassChange = [...document.querySelectorAll(".error")];
  }
  //loop through our array and remove error class from element and its closest parent element (if it has error class)
  for (const element of elemsToClassChange) {
    const parent = element.closest(".error");
    if (element.classList.contains("error") || parent) {
      element.classList.remove("error");
      parent.classList.remove("error");
    }
  }
}

//initialize donation
function initDonation() {
  let feesAccepted = sessionStorage.getItem("fees-accepted") || "";
  //if fees accepted hasn't been pushed to storage yet, we can assume it's first page load
  if (feesAccepted.length == 0) {
    //check our params for how to handle our checkbox on page load
    //push to storage
    if (donationParameters.processingFees.prechecked) {
      $("#acceptFees").prop("checked", true);
      sessionStorage.setItem("fees-accepted", 1);
    } else {
      $("#acceptFees").prop("checked", false);
      initialFeesChoice = 0;
      sessionStorage.setItem("fees-accepted", 0);
    }
  }
  //display our donation amounts and process the initial donation amount
  donationParameters.displayDonationAmounts();
  donationParameters.initDonationGridCSS();
  processingFeesHandler();
}

const firstStageDone = Number(document.getElementById("firstStageDone").value);

if (firstStageDone == 0) {
  initDonation();
}

//save user donation choice to sessionStorage
function updateDonation(donationCode, donationAmt) {
  sessionStorage.setItem("donation", donationCode);
  sessionStorage.setItem("amount", donationAmt);
}

//handles the logic associated w/ the "Other" donation amount field events (click, keyup, blur)
function otherAmountHandler(code, amt) {
  //show generic "Your donation" text if the donation amt is undefined or empty string
  $("#giftAmount").removeAttr("disabled");
  $("#giftAmount").focus();
  $("#giftAmount").parents().removeClass("disabled");
  //empty out the previous value
  $("#giftAmount").val("");
  if (amt === "") {
    $(".total-donation").text("Your donation");
    sessionStorage.setItem("total-donation", "");
  } else {
    $("#giftAmount").val(amt);
  }
  //update our donation and recalculate total amount
  updateDonation(code, amt);
  processingFeesHandler();

  $("#giftAmount").keyup(function (event) {
    amt = event.target.value;
    $("#giftAmount").val(amt);
    updateDonation(code, amt);
    processingFeesHandler();
  });

  //wait to output the donation value the user entered until they have unfocused the "Other" field, this way we van be sure they're done entering values
  $("#giftAmount").blur(function (ev) {
    //prevet multiple blur calls stacking
    ev.stopImmediatePropagation();
    const giftAmountVal = $("#giftAmount").val();
    let donationOutput = currency(giftAmountVal).value;
    //this code block normalizes user input to 2 decimal places / adds a zero at the end if only 1 decimal place is entered
    //check if user entered an amount w/ decimals
    if (giftAmountVal.length > 0) {
      $("#giftAmount").val(currency(donationOutput));
      sessionStorage.setItem("amount", donationOutput);
    }
  });
}
//function that handles the users donation choice
function donationChoiceHandler(code, amt) {
  if (donationParameters[code].amount === "") {
    $("#giftAmount").focus();
    otherAmountHandler(code, amt);
  }
  $(".donation-choice").removeClass("donation-selected");
  //dynamically get the radio button id
  const choiceLabel = document.querySelector(`input[value="${code}"]`);
  const choiceLabelId = choiceLabel.id;
  //use the id to get the label we want to add selected class to
  const labelToSelect = document.querySelector(`label[for="${choiceLabelId}"]`);
  labelToSelect.classList.add("donation-selected");
  choiceLabel.checked = true;
  updateDonation(code, amt);
  processingFeesHandler();
}
//function to calculate the selected donation amount + processing fees
function calcTotalDonation(feesAccepted) {
  //get updated donation amount from our updateDonation() function from user click, "Other" input, or from page load donationChoiceHandler() function
  let donationAmt = sessionStorage.getItem("amount") || "";
  //dont calculate if donation amount is undefined
  switch (donationAmt) {
    case undefined:
    case "undefined":
      $(".total-donation").text("Your donation");
      break;
    default:
      //match user input from 'other' field against our regex pattern (no special chars, letters, or more than 2 decimals)
      if (
        !!donationAmt.match(
          /(?=.*?\d)^\$?(([1-9]\d{0,2}(,\d{3})*)|\d+)?(\.\d{1,2})?$/
        )
      ) {
        //validate user input against $500 max and $19 min
        //show proper error msg if invalid
        //don't want to do calculation on invalid input
        if (donationAmt > 500) {
          //pass in error #2 - greater than $500
          errorHandling(2);
        } else if (donationAmt < Number(donationParameters.minimumDonation)) {
          //pass in error #1 - less than $19
          errorHandling(1);
        } else {
          //input is valid - continue on
          errorHandling(0);
          //now that input is valid, check to see if this function (calcTotalDonation()) was passed 1 or 0 for feesAccepted
          //if v == 0, we do not need to calculate processing fees, just normalize user input and output it.
          let totalDonation;
          if (feesAccepted == 0) {
            totalDonation = currency(donationAmt);
          }
          //calculate fees if feesAccepted == 1
          else if (feesAccepted == 1) {
            const processingFee = currency(donationAmt).multiply(
              donationParameters.processingFees.feePercentage
            );
            //multiply procFee by donationAmt to get total
            totalDonation = currency(donationAmt).add(processingFee).value;
          }
          sessionStorage.setItem("total-donation", totalDonation);
          $(".total-donation").text(currency(totalDonation).format());
        }
      } else {
        //error #3 - user input did not pass regex pattern
        errorHandling(3);
      }
  }
}
//function to check/uncheck processing fees checkbox on page load and control how we calculate the final amount in calcTotalDonation()
function processingFeesHandler() {
  const donationAmt = sessionStorage.getItem("amount" || "");
  const feesAccepted = sessionStorage.getItem("fees-accepted" || "");
  //general statement if donationAmt isn't set
  if (donationAmt == undefined || donationAmt === "") {
    $(".total-donation").text("Your donation");
  } else {
    //if sessionStorage fees-accepted isnt set, or if it equals 1 - check the checkbox
    if (feesAccepted == 1) {
      $("#acceptFees").prop("checked", true);
      //tell our calcTotalDonation function to calculate the processing fees + total donation
      calcTotalDonation(1);
      $(".total-donation-container").show();
    }
    //else, the user has chosen to uncheck the box, so let's uncheck for them
    else if (feesAccepted == 0) {
      if (donationParameters.processingFees.hideIfNotAccepted) {
        $(".total-donation-container").hide();
      }
      $("#acceptFees").prop("checked", false);
      //tell our calcTotalDonation function to calculate total donation w/o processing fees
      calcTotalDonation(0);
    }
  }
}

//handle user interaction w/ donation inputs

//push processing fees checkbox value to session storage
$("#acceptFees").change(function () {
  let feesAccepted;
  if ($("#acceptFees").is(":checked")) {
    feesAccepted = 1;
  } else {
    feesAccepted = 0;
  }
  sessionStorage.setItem("fees-accepted", feesAccepted);
  processingFeesHandler();
});

//handle donation chocies when clicked
$("input[name$='selection']").click(function (ev) {
  $(".donation-choice").removeClass("donation-selected");
  const donationChoice = ev.target.nextSibling;
  donationChoice.classList.add("donation-selected");
  if (ev.target.hasAttribute("for", "amountOther")) {
    $("#giftAmount").attr("disabled");
    $("#giftAmount").parent().addClass("disabled");
  }
  removeErrorClass($(this));
  $(".total-donation").text(" ");
  donationCode = $(this).val();
  //need some special logic if the user clicks the "Other" label
  if (donationParameters[donationCode].amount === "") {
    donationAmt = sessionStorage.getItem("amount") || "";
    otherAmountHandler(donationCode, donationAmt);
  }
  //else the user clicked choice that isnt amountOther and we can proceed to processing fees
  else {
    donationAmt = donationParameters[donationCode].amount;
    $("#giftAmount").val("");
    if (donationParameters.pageTemplate.disableFreeformOnPageLoad) {
      $("#giftAmount").attr("disabled", "disabled");
    }
    updateDonation(donationCode, donationAmt);
    processingFeesHandler();
  }
  donationParameters.displayDonationStatements(donationCode);
});

//add handler if user clicks freeform input directly instead of label + call our special "Other" input logic function

$("#giftAmount").click(function () {
  $(".donation-choice").removeClass("donation-selected");
  $(".total-donation").text(" ");
  let donationCode;
  //check if this code is the empty amout
  for (const code of donationParameters.donationOrder) {
    if (donationParameters[code].amount === "") {
      donationCode = code;
    }
  }
  const donationChoice = document.querySelector(`[value="${donationCode}"]`);
  donationChoice.nextSibling.classList.add("donation-selected");
  donationChoice.checked = true;
  sessionStorage.setItem("amount", "");
  if ($("#giftAmount").val().length > 0) {
    donationAmt = $("#giftAmount").val();
  } else {
    donationAmt = "";
  }
  updateDonation(donationCode, donationAmt);
  otherAmountHandler(donationCode, donationAmt);
  donationParameters.displayDonationStatements(donationCode);
});

//remove error classes (if they exist) on input interaction
$("input").keyup(function () {
  removeErrorClass($(this));
});
$("input[type='checkbox']").click(function () {
  removeErrorClass($(this));
});
$("select").change(function () {
  removeErrorClass($(this));
});
