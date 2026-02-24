// first of all we will do state  like we did in previous tasks
let boardState = ["","","","","","","","",""]
let currentPlayer = "X";
let isGameActive = true;

// the 8 possible winning conditions (indexes of the board array)
const winningConditions = [
    [0, 1, 2],
    [3, 4, 5],
    [6, 7, 8],
    [0, 3, 6],
    [1, 4, 7],
    [2, 5, 8],
    [0, 4, 8],
    [2, 4, 6],
];

// the DOM elements
const statusDisplay = document.getElementById('statusDisplay');
const cells = document.querySelectorAll('.cell')
const resetBtn = document.getElementById('resetBtn');

// core functions of this game

function handleCellClick(clickedCellEvent) { // on clicking a cell
    const clickedCell = clickedCellEvent.target;
    const cellIndex = parseInt(clickedCell.getAttribute('data-index')); // to get the data-index attribute as an integer

    if (boardState[cellIndex] !== "" || !isGameActive) { // if cell is already filled or the game is over, this does nothing
        return;
    }

    // update the state of the game and UI
    boardState[cellIndex] = currentPlayer;
    clickedCell.innerText = currentPlayer;

    // to check if a particular move won the game. this will be our next function
    checkWinOrDraw();
} // end of our cell click function

function checkWinOrDraw() {
    let roundWon = false;
    let winningCells = [];

    // loop through all 8 winning conditions we've made on line 7
    for (let i = 0; i < winningConditions.length; i++) {
        const winCondition = winningConditions[i];
        let a = boardState[winCondition[0]];
        let b = boardState[winCondition[1]];
        let c = boardState[winCondition[2]];

        if (a === "" || b === "" || c === "") { 
            continue;
        }

        if (a === b && b === c) { // if all 3 cells match, we have a winner of tic tac toe
            roundWon = true;
            winningCells = winCondition;
            break; // Stop the loop because we already found a winner
        }
    } 

    if (roundWon) {
        statusDisplay.innerText = `Player ${currentPlayer} has won!`;
        isGameActive = false; // disable the board

        winningCells.forEach(index => {
            cells[index].classList.add('win');
        })
        return;
    }

    // check for a draw (if there arent empty strings left in the board array)
    let roundDraw = !boardState.includes("");
    if (roundDraw) {
        statusDisplay.innerText = "Game ended in a draw!";
        isGameActive = false;
        return;
    }

    // if no win and no draw, then switch turns
    currentPlayer = currentPlayer === "X" ? "O" : "X";
    statusDisplay.innerText = `Player ${currentPlayer}'s turn`;
}

function resetGame() { // restart the game (or reset)
    boardState = ["", "", "", "", "", "", "", "", ""]; // reset board state
    currentPlayer = "X";
    isGameActive = true;
    statusDisplay.innerText = `Player X's turn`;
    cells.forEach(cell => {
        cell.innerText = "";
        cell.classList.remove('win'); // Remove the highlights
    });
}

// event handling
cells.forEach(cell => cell.addEventListener('click', handleCellClick)); // on clicking a cell it will call the handleCellClick function
resetBtn.addEventListener('click', resetGame); // on clicking "Restart Game" button, it will call resetGame