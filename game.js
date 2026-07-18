// TicTacToeGame — the pure rules engine for one game of tic-tac-toe.
// It knows nothing about networking or the browser; it only tracks a board,
// enforces the rules, and reports results. This makes the rules easy to reuse
// and to test on their own.

const WIN_LINES = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8], // rows
  [0, 3, 6], [1, 4, 7], [2, 5, 8], // columns
  [0, 4, 8], [2, 4, 6],            // diagonals
];

class TicTacToeGame {
  constructor() {
    this.reset();
  }

  // Start (or restart) a fresh game. X always moves first.
  reset() {
    this.board = Array(9).fill(null);
    this.turn = 'X';
    this.winner = null;   // 'X' | 'O' | null
    this.isDraw = false;
    this.over = false;
  }

  // Return a snapshot of the current board and whose turn it is.
  getState() {
    return { board: [...this.board], turn: this.turn };
  }

  // Attempt to play the current player's symbol at cellIndex (0-8).
  // Always returns: { valid, symbol, winner, isDraw, board } (plus `line`
  // for the winning cells, and `reason` when the move was rejected).
  makeMove(cellIndex) {
    if (this.over) {
      return this._result(false, null, 'game is already over');
    }
    if (!Number.isInteger(cellIndex) || cellIndex < 0 || cellIndex > 8) {
      return this._result(false, null, 'cell index must be an integer 0-8');
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

  // Return the winning trio of cell indices, or null if there's no winner yet.
  _winningLine() {
    for (const line of WIN_LINES) {
      const [a, b, c] = line;
      if (this.board[a] && this.board[a] === this.board[b] && this.board[a] === this.board[c]) {
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
