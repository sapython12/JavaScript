// call the DOM elements we need to interact with
const num1Input = document.getElementById('num1');
const num2Input = document.getElementById('num2');
const resultDisplay = document.getElementById('resultDisplay');
const errorDisplay = document.getElementById('errorDisplay');

// now it's time for the main calculations. so we will add a function here
function calculate(operation) {
    errorDisplay.innerText = ""; // to clear any error displayed
    const val1 = num1Input.value; // to get the values from the inputs we've made
    const val2 = num2Input.value;
    if (val1 === "" || val2 === "") { // the input validation. it will show error if either of the inputs are empty or if both are empty.
        errorDisplay.innerText = "Error: Please enter numbers in both of the inputs!";
        resultDisplay.innerText = "0";
        return; // stop this function here
    }
    const number1 = parseFloat(val1); // this will convert string values to actual numbers
    const number2 = parseFloat(val2);
    let finalResult = 0;

    switch (operation) { // a conditional statement to handle the calculation
        case '+':
            finalResult = number1 + number2;
            break;
        case '-':
            finalResult = number1 - number2;
            break
        case '*':
            finalResult = number1 * number2;
            break
        case '/': // input validation to prevent division by 0
            if (number2 === 0) {
                errorDisplay.innerText = "Error: 0 cannot be divided.";
                resultDisplay.innerText = "0";
                return; // again, we stop this function here
            }
            finalResult = number1 / number2;
            break;
    }

    // for dispaying the result dynamically
    resultDisplay.innerText = finalResult;
}

// event listeners
// when any of the 4 buttons are clicked, it will call the calculate function we've made and passes the maths symbol
document.getElementById('addBtn').addEventListener('click', function() {
    calculate('+');
})

document.getElementById('subBtn').addEventListener('click', function() {
    calculate('-');
});

document.getElementById('mulBtn').addEventListener('click', function() {
    calculate('*');
});

document.getElementById('divBtn').addEventListener('click', function() {
    calculate('/');
});

// end of our javascript code