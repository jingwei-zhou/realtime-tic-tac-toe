const path = require('path');
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const matchmaking = require('./matchmaking');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static(path.join(__dirname, 'client')));

io.on('connection', (socket) => {
  console.log('Player connected', socket.id);

  // A client asks to be matched into a game.
  socket.on('find-game', () => {
    matchmaking.addToQueue(socket, io);
  });

  // A player attempts a move.
  socket.on('make-move', ({ index }) => {
    const roomId = matchmaking.playerRooms.get(socket.id);
    if (!roomId) return;

    const entry = matchmaking.activeGames.get(roomId);
    if (!entry) return;

    const { game, players } = entry;

    // Only the player whose turn it is may move.
    const { turn } = game.getState();
    if (players[turn] !== socket.id) return;

    const result = game.makeMove(index);
    if (!result.valid) return;

    io.to(roomId).emit('move-made', {
      index,
      symbol: result.symbol,
      board: result.board,
      turn: game.getState().turn,
    });

    if (result.winner || result.isDraw) {
      io.to(roomId).emit('game-over', {
        winner: result.winner,   // 'X' | 'O' | null
        isDraw: result.isDraw,
        line: result.line,       // winning cells, or null
      });
      // Free both players so they can queue up for a new game.
      matchmaking.endGame(roomId);
    }
  });

  socket.on('disconnect', () => {
    console.log('Player disconnected', socket.id);
    matchmaking.handleDisconnect(socket, io);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
