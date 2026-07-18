// matchmaking.js — pairs players into games and owns all the room bookkeeping.
// It knows about sockets and rooms, but delegates the actual game rules to
// TicTacToeGame. server.js talks to Socket.io; this module decides who plays whom.

const { randomUUID } = require('crypto');
const TicTacToeGame = require('./game');

// (1) Players waiting to be paired, in arrival order.
const waitingQueue = [];              // array of sockets

// (4) Bookkeeping for games in progress.
const activeGames = new Map();        // roomId -> { game, players: { X, O } }
const playerRooms = new Map();        // socketId -> roomId

// (2) Add a socket to matchmaking. Pair with a waiting player if one exists,
// otherwise park this socket in the queue.
function addToQueue(socket, io) {
  if (playerRooms.has(socket.id)) return; // already in an active game
  removeFromQueue(socket);                // never queue the same socket twice

  // Drop any stale (disconnected) sockets sitting at the front of the queue.
  while (waitingQueue.length > 0 && !waitingQueue[0].connected) {
    waitingQueue.shift();
  }

  if (waitingQueue.length > 0) {
    const opponent = waitingQueue.shift();
    const roomId = randomUUID();
    const game = new TicTacToeGame();

    // Randomly decide who is X and who is O.
    const [x, o] = Math.random() < 0.5 ? [opponent, socket] : [socket, opponent];
    x.join(roomId);
    o.join(roomId);

    const players = { X: x.id, O: o.id };
    activeGames.set(roomId, { game, players });
    playerRooms.set(x.id, roomId);
    playerRooms.set(o.id, roomId);

    x.emit('game-start', { symbol: 'X', roomId });
    o.emit('game-start', { symbol: 'O', roomId });
  } else {
    waitingQueue.push(socket);
    socket.emit('waiting');
  }
}

// (3) Remove a socket from the waiting queue (e.g. on disconnect).
function removeFromQueue(socket) {
  const i = waitingQueue.findIndex((s) => s.id === socket.id);
  if (i !== -1) waitingQueue.splice(i, 1);
}

// Tear down a finished/abandoned room and free both players.
function endGame(roomId) {
  const entry = activeGames.get(roomId);
  if (!entry) return;
  playerRooms.delete(entry.players.X);
  playerRooms.delete(entry.players.O);
  activeGames.delete(roomId);
}

// (5) Handle a disconnect: pull the socket from the queue, and if it was mid-game,
// tell the opponent and clean up the room.
function handleDisconnect(socket, io) {
  removeFromQueue(socket);

  const roomId = playerRooms.get(socket.id);
  if (!roomId) return;

  if (activeGames.has(roomId)) {
    socket.to(roomId).emit('opponent-left');
    endGame(roomId);
  }
  playerRooms.delete(socket.id);
}

module.exports = {
  addToQueue,
  removeFromQueue,
  handleDisconnect,
  endGame,
  activeGames,
  playerRooms,
  waitingQueue,
};
