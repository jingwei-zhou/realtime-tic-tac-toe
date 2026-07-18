// TicTacToeGame — the pure rules engine for one game.
// It knows nothing about networking or the browser; it only tracks a board,
// enforces the rules, and reports results. This makes the rules easy to reuse
// and to test on their own.
//
// Board: SIZE x SIZE grid (5x5). A player wins by getting CONNECT (3) of their
// own symbols in a row — horizontally, vertically, or diagonally, anywhere on
// the board.

const SIZE = 5;          // board is SIZE x SIZE
const CONNECT = 3;       // symbols in a row needed to win
const CELL_COUNT = SIZE * SIZE;

// Precompute every straight line of length CONNECT on the grid, in all four
// directions (right, down, down-right, down-left), as arrays of cell indices.
function buildWinLines(size, connect) {
  const lines = [];
  const directions = [
    [0, 1],   // horizontal →
    [1, 0],   // vertical ↓
    [1, 1],   // diagonal ↘
    [1, -1],  // diagonal ↙
  ];
  for (let row = 0; row < size; row++) {
    for (let col = 0; col < size; col++) {
      for (const [dr, dc] of directions) {
        const line = [];
        for (let k = 0; k < connect; k++) {
          const r = row + dr * k;
          const c = col + dc * k;
          if (r < 0 || r >= size || c < 0 || c >= size) break; // runs off the board
          line.push(r * size + c);
        }
        if (line.length === connect) lines.push(line);
      }
    }
  }
  return lines;
}

const WIN_LINES = buildWinLines(SIZE, CONNECT);

class TicTacToeGame {
  constructor() {
    this.reset();
  }

  // Start (or restart) a fresh game. X always moves first.
  reset() {
    this.board = Array(CELL_COUNT).fill(null);
    this.turn = 'X';
    this.winner = null;   // 'X' | 'O' | null
    this.isDraw = false;
    this.over = false;
  }

  // Return a snapshot of the current board and whose turn it is.
  getState() {
    return { board: [...this.board], turn: this.turn };
  }

  // Attempt to play the current player's symbol at cellIndex (0 .. CELL_COUNT-1).
  // Always returns: { valid, symbol, winner, isDraw, board } (plus `line`
  // for the winning cells, and `reason` when the move was rejected).
  makeMove(cellIndex) {
    if (this.over) {
      return this._result(false, null, 'game is already over');
    }
    if (!Number.isInteger(cellIndex) || cellIndex < 0 || cellIndex >= CELL_COUNT) {
      return this._result(false, null, `cell index must be an integer 0-${CELL_COUNT - 1}`);
    }
    if (this.board[cellIndex] !== null) {
      return this._result(false, null, 'cell is already taken');
    }

    const symbol = this.turn;
    this.board[cellIndex] = symbol;

    const line = this._winningLine();
    if (line) {
      this.winner = symbol;
      this.over = true;
    } else if (this.board.every((cell) => cell !== null)) {
      this.isDraw = true;
      this.over = true;
    } else {
      this.turn = this.turn === 'X' ? 'O' : 'X';
    }

    return this._result(true, symbol, null, line);
  }

  // Return the winning line of cell indices, or null if there's no winner yet.
  _winningLine() {
    for (const line of WIN_LINES) {
      const first = this.board[line[0]];
      if (first && line.every((i) => this.board[i] === first)) {
        return line;
      }
    }
    return null;
  }

  // Build the standard result object returned by makeMove.
  _result(valid, symbol, reason, line = null) {
    return {
      valid,
      symbol,
      winner: this.winner,
      isDraw: this.isDraw,
      board: [...this.board],
      line,
      reason,
    };
  }
}

module.exports = TicTacToeGame;
module.exports.SIZE = SIZE;
module.exports.CONNECT = CONNECT;
