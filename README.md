# Tic-Tac-Toe

A real-time, two-player tic-tac-toe game you play against another person in the browser.

## How to Play

1. Open the game in your browser and click **Find Game**.
2. You're matched with the next player looking for a game. One of you is **X**, the other **O** — X moves first.
3. Take turns clicking an empty square. The board only lets you click on your own turn.
4. First to line up three in a row (across, down, or diagonally) wins; a full board with no winner is a draw.
5. Click **Play Again** to jump back into matchmaking for a new opponent.

## Tech Stack

- **Node.js** — runs the server-side JavaScript.
- **Express** — serves the browser files (HTML/CSS/JS).
- **Socket.io** — real-time, two-way communication between players over WebSockets.
- **Vanilla HTML / CSS / JS** — no front-end framework; the browser client is plain JavaScript.

## Run Locally

```bash
# 1. Get the project, then move into it
cd game-build-tic-tac-toe

# 2. Install dependencies (Express + Socket.io)
npm install

# 3. Start the server
node server.js

# 4. Open the game
#    Visit http://localhost:3000 in your browser.
#    Open a second tab (or share your local IP with a friend on the same
#    Wi-Fi) and click "Find Game" in both to play against each other.
```

The server listens on the `PORT` environment variable if set, otherwise port `3000`.

## Deploy (make it public)

This repo includes a `render.yaml` blueprint for [Render](https://render.com), which
supports the persistent WebSocket connection Socket.io needs and has a free tier.

1. Push this repo to GitHub (already done if you're reading it there).
2. Sign in to Render with your GitHub account.
3. Click **New → Blueprint**, pick this repository, and confirm.
4. Render reads `render.yaml`, runs `npm install`, then `node server.js`, and gives
   you a public URL like `https://realtime-tic-tac-toe.onrender.com`.
5. Share that URL — anyone can open it and click **Find Game** to play.

> Note: on Render's free tier the app sleeps after inactivity, so the first visit
> after a quiet period takes ~50s to wake up. Any always-on plan removes that delay.

## How It Works

The game has two halves:

- **The server** (`server.js`, `matchmaking.js`, `game.js`) — the authority. It pairs players, enforces the rules, tracks whose turn it is, and decides wins and draws. `game.js` is the pure rules engine, `matchmaking.js` pairs players into game rooms, and `server.js` wires everything to the network.
- **The client** (`client/`) — the web page each player sees. `index.html` is the board's structure, `style.css` its look, and `client.js` its behavior.

They talk over a **WebSocket** connection kept open by Socket.io, exchanging named events:

| Event | Direction | Meaning |
|-------|-----------|---------|
| `find-game` | client → server | Player wants a match |
| `waiting` | server → client | Queued, waiting for an opponent |
| `game-start` | server → client | Paired; here's your symbol |
| `make-move` | client → server | Player clicked a square |
| `move-made` | server → clients | A move was accepted; here's the new board |
| `game-over` | server → clients | Win or draw |
| `opponent-left` | server → client | The other player disconnected |

The client never decides the outcome itself — it sends clicks and renders whatever the server reports. Keeping the server authoritative is what stops players from cheating and keeps both screens in sync.

## Project Structure

```
game-build-tic-tac-toe/
├── server.js          # HTTP + Socket.io server; wires events to matchmaking
├── matchmaking.js     # pairs players, tracks rooms, handles disconnects
├── game.js            # TicTacToeGame — the pure rules engine
├── package.json       # dependencies
└── client/            # everything the browser loads
    ├── index.html
    ├── style.css
    └── client.js
```
