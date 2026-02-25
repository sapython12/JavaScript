// usual dom elements
const userScoreEl = document.getElementById('userScore');
const compScoreEl = document.getElementById('compScore');
const userChoiceDisplay = document.getElementById('userChoiceDisplay');
const compChoiceDisplay = document.getElementById('compChoiceDisplay');
const resultMessage = document.getElementById('resultMessage');
const choiceButtons = document.querySelectorAll('.choice-btn');
const resetBtn = document.getElementById('resetBtn');

// win board elements
const winBoard = document.getElementById('winBoard');
const winMessage = document.getElementById('winMessage');
const playAgainBtn = document.getElementById('playAgainBtn');

// game state at starting
let userScore = 0;
let compScore = 0;
let isWaiting = false; // prevents clicking while computer is "thinking"
const MAX_SCORE = 10; // Target score to win

// mapping values to choices
const choicesMap = {
    0: '🪨 Stone',
    1: '📄 Paper',
    2: '✂️ Scissor'
};

// core game logic
function playGame(userChoice) {
    // If waiting for animation or game over, do nothing
    if (isWaiting || userScore >= MAX_SCORE || compScore >= MAX_SCORE) return;

    isWaiting = true;
    
    // Disable buttons temporarily
    choiceButtons.forEach(btn => btn.classList.add('disabled'));

    // Show user choice immediately
    userChoiceDisplay.innerText = choicesMap[userChoice];
    
    // Start "thinking" animation
    resultMessage.innerText = "Computer is deciding...";
    resultMessage.style.color = "#888";
    compChoiceDisplay.classList.add('thinking');

    // Shuffle options rapidly to look like it's deciding
    let shuffleInterval = setInterval(() => {
        const randomChoice = Math.floor(Math.random() * 3);
        compChoiceDisplay.innerText = choicesMap[randomChoice];
    }, 150);

    // After 1.5 seconds, lock in the choice and determine winner
    setTimeout(() => {
        clearInterval(shuffleInterval);
        compChoiceDisplay.classList.remove('thinking');
        
        // generate final computer choice
        const compChoice = Math.floor(Math.random() * 3);
        compChoiceDisplay.innerText = choicesMap[compChoice];

        // determine winner and update score
        if (userChoice === compChoice) {
            resultMessage.innerText = "It's a Draw!";
            resultMessage.style.color = "#e47200";
        } else if (
            (userChoice === 0 && compChoice === 2) || 
            (userChoice === 1 && compChoice === 0) || 
            (userChoice === 2 && compChoice === 1)    
        ) {
            userScore++;
            userScoreEl.innerText = userScore;
            resultMessage.innerText = "You Win!";
            resultMessage.style.color = "#28a745"; 
        } else {
            compScore++;
            compScoreEl.innerText = compScore;
            resultMessage.innerText = "Computer Wins!";
            resultMessage.style.color = "#dc3545"; 
        }

        isWaiting = false;
        choiceButtons.forEach(btn => btn.classList.remove('disabled'));

        // Check if anyone reached the max score
        checkWinCondition();

    }, 1500); // 1.5 seconds delay
}

// Check for final winner
function checkWinCondition() {
    if (userScore >= MAX_SCORE) {
        showWinBoard("You Won the Match! 🎉", "#28a745");
    } else if (compScore >= MAX_SCORE) {
        showWinBoard("Computer Won! 🤖", "#dc3545");
    }
}

// Show the win board
function showWinBoard(message, color) {
    winMessage.innerText = message;
    winMessage.style.color = color;
    winBoard.classList.remove('hidden');
}

// reset logic
function resetGame() {
    userScore = 0;
    compScore = 0;
    userScoreEl.innerText = userScore;
    compScoreEl.innerText = compScore;
    
    userChoiceDisplay.innerText = '...';
    compChoiceDisplay.innerText = '...';
    
    resultMessage.innerText = 'Make your move!';
    resultMessage.style.color = "#333";
    
    // hide win board if active
    winBoard.classList.add('hidden');
    isWaiting = false;
    choiceButtons.forEach(btn => btn.classList.remove('disabled'));
    compChoiceDisplay.classList.remove('thinking');
}

// event listeners
choiceButtons.forEach(button => {
    button.addEventListener('click', () => {
        const userChoice = parseInt(button.getAttribute('data-choice'));
        playGame(userChoice);
    });
});

resetBtn.addEventListener('click', resetGame);
playAgainBtn.addEventListener('click', resetGame);// usual dom elements
const userScoreEl = document.getElementById('userScore');
const compScoreEl = document.getElementById('compScore');
const userChoiceDisplay = document.getElementById('userChoiceDisplay');
const compChoiceDisplay = document.getElementById('compChoiceDisplay');
const resultMessage = document.getElementById('resultMessage');
const choiceButtons = document.querySelectorAll('.choice-btn');
const resetBtn = document.getElementById('resetBtn');

// win board elements
const winBoard = document.getElementById('winBoard');
const winMessage = document.getElementById('winMessage');
const playAgainBtn = document.getElementById('playAgainBtn');

// game state at starting
let userScore = 0;
let compScore = 0;
let isWaiting = false; // prevents clicking while computer is "thinking"
const MAX_SCORE = 10; // Target score to win

// mapping values to choices
const choicesMap = {
    0: '🪨 Stone',
    1: '📄 Paper',
    2: '✂️ Scissor'
};

// core game logic
function playGame(userChoice) {
    // If waiting for animation or game over, do nothing
    if (isWaiting || userScore >= MAX_SCORE || compScore >= MAX_SCORE) return;

    isWaiting = true;
    
    // Disable buttons temporarily
    choiceButtons.forEach(btn => btn.classList.add('disabled'));

    // Show user choice immediately
    userChoiceDisplay.innerText = choicesMap[userChoice];
    
    // Start "thinking" animation
    resultMessage.innerText = "Computer is deciding...";
    resultMessage.style.color = "#888";
    compChoiceDisplay.classList.add('thinking');

    // Shuffle options rapidly to look like it's deciding
    let shuffleInterval = setInterval(() => {
        const randomChoice = Math.floor(Math.random() * 3);
        compChoiceDisplay.innerText = choicesMap[randomChoice];
    }, 150);

    // After 1.5 seconds, lock in the choice and determine winner
    setTimeout(() => {
        clearInterval(shuffleInterval);
        compChoiceDisplay.classList.remove('thinking');
        
        // generate final computer choice
        const compChoice = Math.floor(Math.random() * 3);
        compChoiceDisplay.innerText = choicesMap[compChoice];

        // determine winner and update score
        if (userChoice === compChoice) {
            resultMessage.innerText = "It's a Draw!";
            resultMessage.style.color = "#e47200";
        } else if (
            (userChoice === 0 && compChoice === 2) || 
            (userChoice === 1 && compChoice === 0) || 
            (userChoice === 2 && compChoice === 1)    
        ) {
            userScore++;
            userScoreEl.innerText = userScore;
            resultMessage.innerText = "You Win!";
            resultMessage.style.color = "#28a745"; 
        } else {
            compScore++;
            compScoreEl.innerText = compScore;
            resultMessage.innerText = "Computer Wins!";
            resultMessage.style.color = "#dc3545"; 
        }

        isWaiting = false;
        choiceButtons.forEach(btn => btn.classList.remove('disabled'));

        // Check if anyone reached the max score
        checkWinCondition();

    }, 1500); // 1.5 seconds delay
}

// Check for final winner
function checkWinCondition() {
    if (userScore >= MAX_SCORE) {
        showWinBoard("You Won the Match! 🎉", "#28a745");
    } else if (compScore >= MAX_SCORE) {
        showWinBoard("Computer Won! 🤖", "#dc3545");
    }
}

// Show the win board
function showWinBoard(message, color) {
    winMessage.innerText = message;
    winMessage.style.color = color;
    winBoard.classList.remove('hidden');
}

// reset logic
function resetGame() {
    userScore = 0;
    compScore = 0;
    userScoreEl.innerText = userScore;
    compScoreEl.innerText = compScore;
    
    userChoiceDisplay.innerText = '...';
    compChoiceDisplay.innerText = '...';
    
    resultMessage.innerText = 'Make your move!';
    resultMessage.style.color = "#333";
    
    // hide win board if active
    winBoard.classList.add('hidden');
    isWaiting = false;
    choiceButtons.forEach(btn => btn.classList.remove('disabled'));
    compChoiceDisplay.classList.remove('thinking');
}

// event listeners
choiceButtons.forEach(button => {
    button.addEventListener('click', () => {
        const userChoice = parseInt(button.getAttribute('data-choice'));
        playGame(userChoice);
    });
});

resetBtn.addEventListener('click', resetGame);
playAgainBtn.addEventListener('click', resetGame);
