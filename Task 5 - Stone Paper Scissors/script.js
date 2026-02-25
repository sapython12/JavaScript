// usual dom elements
const userScoreEl = document.getElementById('userScore');
const compScoreEl = document.getElementById('compScore');
const userChoiceDisplay = document.getElementById('userChoiceDisplay');
const compChoiceDisplay = document.getElementById('compChoiceDisplay');
const resultMessage = document.getElementById('resultMessage');
const choiceButtons = document.querySelectorAll('.choice-btn');
const resetBtn = document.getElementById('resetBtn');

// game state at starting
let userScore = 0;
let compScore = 0;

// mapping values to choices
const choicesMap = {
    0: 'Stone',
    1: 'Paper',
    2: 'Scissor'
};

// core game logic
function playGame(userChoice) {
    // generate computer choice (0,1,2)
    const compChoice = Math.floor(Math.random() * 3);

    // update display area
    userChoiceDisplay.innerText = choicesMap[userChoice];
    compChoiceDisplay.innerText = choicesMap[compChoice];

    // determine winner and update score
    if (userChoice === compChoice) {
        // draw
        resultMessage.innerText = "It's a Draw!";
        resultMessage.style.color = "#e47200";
    } else if (
        (userChoice === 0 && compChoice === 2) || // stone beats scissor
        (userChoice === 1 && compChoice === 0) || // paper beats stone
        (userChoice === 2 && compChoice === 1)    // scissor beats paper
    ) {
        // yuser wins
        userScore++;
        userScoreEl.innerText = userScore;
        resultMessage.innerText = "You Win!";
        resultMessage.style.color = "#28a745"; // success color
    } else {
        // computer wins
        compScore++;
        compScoreEl.innerText = compScore;
        resultMessage.innerText = "Computer Wins!";
        resultMessage.style.color = "#dc3545"; // error color
    }
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
}

// event listeners
choiceButtons.forEach(button => {
    button.addEventListener('click', () => {
        // retrieve the data-choice attribute and convert it to a number
        const userChoice = parseInt(button.getAttribute('data-choice'));
        playGame(userChoice);
    });
});

resetBtn.addEventListener('click', resetGame);