const previousOperandElement = document.getElementById('previousOperand');
const currentOperandElement = document.getElementById('currentOperand');
const numberButtons = document.querySelectorAll('.number');
const operationButtons = document.querySelectorAll('.operator:not(.equals)');
const equalsButton = document.getElementById('equalsBtn');
const clearButton = document.getElementById('clearBtn');

// variables to track the state of our calculations
let currentOperand = '0';
let previousOperand = '';
let operation = undefined;

// resets everything
function clear() {
    currentOperand = '0';
    previousOperand = '';
    operation = undefined;
}

// adds numbers to the screen when clicked
function appendNumber(number) {
    // if "Error" is currently on the screen, clear it out when a new number is pressed
    if (currentOperand === 'Error') {
        currentOperand = '0';
    }

    // prevent multiple decimals
    if (number === '.' && currentOperand.includes('.')) return; 
    
    // replace the initial '0' with the newly typed number, unless typing a decimal
    if (currentOperand === '0' && number !== '.') {
        currentOperand = number;
    } else {
        currentOperand = currentOperand.toString() + number.toString();
    }
}

// saves the first number and waits for the second
function chooseOperation(op) {
    // prevent operations if there's an error or no current number
    if (currentOperand === 'Error' || currentOperand === '') return;
    
    // if we already have numbers, calculate them before chaining the next operator
    if (previousOperand !== '') {
        compute();
    }
    
    // if computing just caused a divide-by-zero error, stop here
    if (currentOperand === 'Error') return;
    
    operation = op;
    previousOperand = currentOperand;
    currentOperand = '';
}

// performs the actual math
function compute() {
    let computation;
    const prev = parseFloat(previousOperand);
    const current = parseFloat(currentOperand);
    
    // stop if there aren't two numbers to calculate
    if (isNaN(prev) || isNaN(current)) return;

    switch (operation) {
        case '+':
            computation = prev + current;
            break;
        case '-':
            computation = prev - current;
            break;
        case '*':
            computation = prev * current;
            break;
        case '/':
            if (current === 0) {
                // show Error on the screen and reset the memory
                currentOperand = 'Error';
                operation = undefined;
                previousOperand = '';
                return; // stop the function completely
            }
            computation = prev / current;
            break;
        default:
            return;
    }
    
    currentOperand = computation.toString();
    operation = undefined;
    previousOperand = '';
}

// updates the HTML text dynamically
function updateDisplay() {
    currentOperandElement.innerText = currentOperand;
    if (operation != null) {
        // show the operator symbol on the top screen
        let symbol = operation;
        if (operation === '*') symbol = '×';
        if (operation === '/') symbol = '÷';
        
        previousOperandElement.innerText = `${previousOperand} ${symbol}`;
    } else {
        previousOperandElement.innerText = '';
    }
}

// event listeners

numberButtons.forEach(button => {
    button.addEventListener('click', () => {
        appendNumber(button.innerText);
        updateDisplay();
    });
});

operationButtons.forEach(button => {
    button.addEventListener('click', () => {
        chooseOperation(button.getAttribute('data-action'));
        updateDisplay();
    });
});

equalsButton.addEventListener('click', () => {
    compute();
    updateDisplay();
});

clearButton.addEventListener('click', () => {
    clear();
    updateDisplay();
});
