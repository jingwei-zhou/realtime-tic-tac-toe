const socket = io();

const statusEl = document.getElementById('status');
const spinnerEl = document.getElementById('spinner');
const cells = Array.from(document.querySelectorAll('.cell'));
const findBtn = document.getElementById('find');
const rematchBtn = document.getElementById('rematch');

let mySymbol = null;   // 'X' or 'O'
let myTurn = false;
let gameActive = false;

function setStatus(text) {
  statusEl.textContent = text;
}

// Tint the status to the active player's color and pulse it on this player's turn.
function showTurnIndicator(activeSymbol) {
  statusEl.dataset.player = activeSymbol;                       // 'X' or 'O'
  statusEl.classList.toggle('your-turn', activeSymbol === mySymbol);
}

function clearTurnIndicator() {
  delete statusEl.dataset.player;
  statusEl.classList.remove('your-turn');
}

// Show/hide the loading spinner and disable Find Game while searching.
function setSearching(on) {
  spinnerEl.hidden = !on;
  findBtn.disabled = on;
}

function render(board) {
  board.forEach((mark, i) => {
    cells[i].textContent = mark || '';
    if (mark) {
      cells[i].dataset.mark = mark;
    } else {
      delete cells[i].dataset.mark;
    }
  });
}

function setCellsEnabled(enabled) {
  cells.forEach((cell) => {
    cell.disabled = !enabled || !!cell.textContent;
  });
}

function clearBoard() {
  cells.forEach((c) => c.classList.remove('win'));
  render(Array(9).fill(null));
  setCellsEnabled(false);
}

// Enter matchmaking (used by both "Find Game" and "Play Again").
function findGame() {
  clearBoard();
  clearTurnIndicator();
  rematchBtn.hidden = true;
  findBtn.hidden = false;
  setSearching(true);
  setStatus('Searching for opponent…');
  socket.emit('find-game');
}

findBtn.addEventListener('click', findGame);
rematchBtn.addEventListener('click', findGame);

cells.forEach((cell) => {
  cell.addEventListener('click', () => {
    const index = Number(cell.dataset.index);
    if (!gameActive || !myTurn || cell.textContent) return;
    socket.emit('make-move', { index });
  });
});

socket.on('connect', () => {
  setSearching(false);
  findBtn.hidden = false;
  rematchBtn.hidden = true;
  clearTurnIndicator();
  setStatus('Click Find Game to start');
});

socket.on('waiting', () => setStatus('Waiting for another player…'));

socket.on('game-start', ({ symbol }) => {
  mySymbol = symbol;
  gameActive = true;
  setSearching(false);
  findBtn.hidden = true;
  rematchBtn.hidden = true;
  clearBoard();
  myTurn = mySymbol === 'X';   // X always moves first
  setStatus(`You are ${mySymbol}. ${myTurn ? 'Your turn.' : "Opponent's turn."}`);
  showTurnIndicator('X');
  setCellsEnabled(myTurn);
});

socket.on('move-made', ({ board, turn }) => {
  render(board);
  myTurn = gameActive && turn === mySymbol;
  if (gameActive) {
    setStatus(myTurn ? 'Your turn.' : "Opponent's turn.");
    showTurnIndicator(turn);
    setCellsEnabled(myTurn);
  }
});

socket.on('game-over', ({ winner, isDraw, line }) => {
  gameActive = false;
  myTurn = false;
  setSearching(false);
  setCellsEnabled(false);
  clearTurnIndicator();
  if (Array.isArray(line)) {
    line.forEach((i) => cells[i].classList.add('win'));
  }
  if (isDraw) {
    setStatus("It's a draw!");
  } else {
    setStatus(winner === mySymbol ? 'You win! 🎉' : 'You lose.');
  }
  rematchBtn.hidden = false;
});

socket.on('opponent-left', () => {
  gameActive = false;
  myTurn = false;
  setSearching(false);
  setCellsEnabled(false);
  clearTurnIndicator();
  setStatus('Your opponent left the game.');
  rematchBtn.hidden = false;
});

socket.on('disconnect', () => {
  gameActive = false;
  myTurn = false;
  setSearching(false);
  setCellsEnabled(false);
  clearTurnIndicator();
  setStatus('Disconnected from server.');
  findBtn.hidden = true;
  rematchBtn.hidden = true;
});
