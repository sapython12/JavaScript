// starting with DOM elements
const balance = document.getElementById('balance');
const moneyplus = document.getElementById('money-plus');
const moneyMinus = document.getElementById('money-minus');
const list = document.getElementById('list');
const form = document.getElementById('form');
const textInput = document.getElementById('text');
const amountInput = document.getElementById('amount');
const errorMsg = document.getElementById('error-msg');

// like we did in to-do list, state management
// fetech from local storage, or inside an empty array.
let transactions = JSON.parse(localStorage.getItem('transactions')) || [];

// core functions

function calculateTotals() { // update the balance, income and expense numbers using reduce()
    const amounts = transactions.map(transaction => transaction.amount); // makes an array of just the amounts
    const total = amounts.reduce((accumulator, item) => (accumulator += item), 0).toFixed(2); // calculate total balance
    const income = amounts // calculate income (filters positive numbers then reduce)
        .filter(item => item > 0)
        .reduce((accumulator, item) => (accumulator += item), 0)
        .toFixed(2);
    const expense = (amounts // calculate expense (filter negative numbers, reduce, multiply by -1 to remove the minus sign for the ui)
        .filter(item => item < 0)
        .reduce((accumulator, item) => (accumulator += item), 0) * -1)
        .toFixed(2);

    balance.innerText = `₹${total}`; // updates the dom
    moneyplus.innerText = `+₹${income}`;
    moneyMinus.innerText = `-₹${expense}`;
}

function generateID() { // generate a random id for new transactions
    return Math.floor(Math.random() * 100000000);
}

function addTransaction(e) {
    e.preventDefault() // prevents from submitting and refreshing the page
    const textValue = textInput.value.trim();
    const amountValue = parseFloat(amountInput.value.trim());

    if (textValue === '' || isNaN(amountValue)) { // this checks if the inputs are invalid or empty
        errorMsg.innerText = 'Please provide a valid text and amount.';
        errorMsg.style.display = 'block';
        return;
    }

    errorMsg.style.display = 'none';

    const newTransaction = { // creates new transaction
        id: generateID(), // calls the generateID function
        text: textValue,
        amount: amountValue
    };
    transactions.push(newTransaction); // update state
    textInput.value = '';
    amountInput.value = '';
    updateUI();
}

function deleteTransaction(id) { // deletes a transaction by id
    transactions = transactions.filter(transaction => transaction.id !== id); // filters out the transaction with the matching ID
    updateUI();
}

function saveToLocalStorage() { // saves to local storage like we did in todo list
    localStorage.setItem('transactions', JSON.stringify(transactions));
}

function renderList() {
    list.innerHTML = ''; // Clear current list

    transactions.forEach(transaction => {
        // determines the CSS class based on positive/negative amount
        const cssClass = transaction.amount < 0 ? 'minus' : 'plus';
        // format the sign for display
        const sign = transaction.amount < 0 ? '-' : '+';
        // Math.abs to remove the minus sign so we can format it nicely: -₹50 instead of --50
        const displayAmount = Math.abs(transaction.amount);

        const li = document.createElement('li');
        li.classList.add(cssClass);
        
        // builds the inner HTML. we pass the transaction.id to the delete function
        li.innerHTML = `
            ${transaction.text} <span>${sign}₹${displayAmount}</span>
            <button class="delete-btn" onclick="deleteTransaction(${transaction.id})">x</button>
        `;

        list.appendChild(li);
    });
}

// master function to update everything
function updateUI() {
    renderList();
    calculateTotals();
    saveToLocalStorage();
}

// event listnerws
form.addEventListener('submit', addTransaction);

// ususal initialization
updateUI();