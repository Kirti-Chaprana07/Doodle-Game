const { v4: uuidv4 } = require("uuid");
const { getRandomWords } = require("./words");

const rooms = new Map();

function generateRoomCode() {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

function createRoom(hostId, hostName, settings = {}) {
  let code;
  do {
    code = generateRoomCode();
  } while (rooms.has(code));

  const room = {
    code,
    hostId,
    players: [
      {
        id: hostId,
        name: hostName,
        score: 0,
        isReady: false,
        isHost: true,
        hasGuessed: false,
        avatar: getAvatar(hostName),
      },
    ],
    settings: {
      maxPlayers: settings.maxPlayers || 8,
      rounds: settings.rounds || 3,
      drawTime: settings.drawTime || 80,
      wordCount: settings.wordCount || 3,
      hints: settings.hints !== undefined ? settings.hints : true,
    },
    state: "lobby", // lobby | word-select | drawing | round-end | game-end
    currentRound: 0,
    currentDrawerIndex: 0,
    currentWord: null,
    currentWordOptions: [],
    roundStartTime: null,
    timer: null,
    hintTimer: null,
    revealedLetters: [],
    chat: [],
    drawHistory: [],
    scores: [],
  };

  rooms.set(code, room);
  return room;
}

function getRoom(code) {
  return rooms.get(code);
}

function deleteRoom(code) {
  const room = rooms.get(code);
  if (room) {
    if (room.timer) clearTimeout(room.timer);
    if (room.hintTimer) clearInterval(room.hintTimer);
    rooms.delete(code);
  }
}

function addPlayer(code, playerId, playerName) {
  const room = rooms.get(code);
  if (!room) return { error: "Room not found" };
  if (room.players.length >= room.settings.maxPlayers)
    return { error: "Room is full" };
  if (room.state !== "lobby") return { error: "Game already in progress" };

  const existingPlayer = room.players.find((p) => p.id === playerId);
  if (existingPlayer) return { room, player: existingPlayer };

  const player = {
    id: playerId,
    name: playerName,
    score: 0,
    isReady: false,
    isHost: false,
    hasGuessed: false,
    avatar: getAvatar(playerName),
  };

  room.players.push(player);
  return { room, player };
}

function removePlayer(code, playerId) {
  const room = rooms.get(code);
  if (!room) return null;

  room.players = room.players.filter((p) => p.id !== playerId);

  if (room.players.length === 0) {
    deleteRoom(code);
    return null;
  }

  // Transfer host if needed
  if (!room.players.find((p) => p.isHost)) {
    room.players[0].isHost = true;
    room.hostId = room.players[0].id;
  }

  return room;
}

function getPlayer(code, playerId) {
  const room = rooms.get(code);
  if (!room) return null;
  return room.players.find((p) => p.id === playerId);
}

function setPlayerReady(code, playerId, isReady) {
  const room = rooms.get(code);
  if (!room) return null;
  const player = room.players.find((p) => p.id === playerId);
  if (player) player.isReady = isReady;
  return room;
}

function getCurrentDrawer(room) {
  return room.players[room.currentDrawerIndex % room.players.length];
}

function startGame(code) {
  const room = rooms.get(code);
  if (!room) return null;

  room.state = "starting";
  room.currentRound = 1;
  room.currentDrawerIndex = 0;
  room.scores = room.players.map((p) => ({ id: p.id, name: p.name, score: 0 }));
  room.players.forEach((p) => {
    p.score = 0;
    p.hasGuessed = false;
  });

  return room;
}

function startWordSelect(code) {
  const room = rooms.get(code);
  if (!room) return null;

  room.state = "word-select";
  room.currentWord = null;
  room.revealedLetters = [];
  room.drawHistory = [];
  room.currentWordOptions = getRandomWords(room.settings.wordCount);
  room.players.forEach((p) => (p.hasGuessed = false));

  return room;
}

function selectWord(code, word) {
  const room = rooms.get(code);
  if (!room) return null;

  room.currentWord = word;
  room.state = "drawing";
  room.roundStartTime = Date.now();

  // Initialize hint: all underscores except spaces
  room.revealedLetters = word.split("").map((ch) => (ch === " " ? " " : "_"));

  return room;
}

function buildHint(room) {
  return room.revealedLetters.join("");
}

function revealLetter(code) {
  const room = rooms.get(code);
  if (!room || !room.currentWord) return null;

  const word = room.currentWord;
  const hidden = room.revealedLetters
    .map((ch, i) => (ch === "_" ? i : -1))
    .filter((i) => i !== -1);

  if (hidden.length === 0) return room;

  const idx = hidden[Math.floor(Math.random() * hidden.length)];
  room.revealedLetters[idx] = word[idx];

  return room;
}

function calculateGuesserScore(drawTime, timeLeft) {
  const maxScore = 500;
  const minScore = 50;
  const ratio = timeLeft / drawTime;
  return Math.max(minScore, Math.round(maxScore * ratio));
}

function calculateDrawerScore(correctGuesses, totalPlayers) {
  return correctGuesses * 50;
}

function submitGuess(code, playerId, guess) {
  const room = rooms.get(code);
  if (!room || !room.currentWord || room.state !== "drawing") return null;

  const player = room.players.find((p) => p.id === playerId);
  if (!player || player.hasGuessed) return null;

  const drawer = getCurrentDrawer(room);
  if (player.id === drawer.id) return null;

  const isCorrect =
    guess.toLowerCase().trim() === room.currentWord.toLowerCase();

  if (isCorrect) {
    const timeLeft = Math.max(
      0,
      room.settings.drawTime - (Date.now() - room.roundStartTime) / 1000
    );
    const points = calculateGuesserScore(room.settings.drawTime, timeLeft);

    player.hasGuessed = true;
    player.score += points;

    // Drawer gets points
    drawer.score += 50;

    const correctGuessers = room.players.filter(
      (p) => p.hasGuessed && p.id !== drawer.id
    ).length;

    // Sync scores
    room.scores = room.players.map((p) => ({ id: p.id, name: p.name, score: p.score }));

    return { isCorrect, points, player, correctGuessers };
  }

  return { isCorrect: false, guess };
}

function endRound(code) {
  const room = rooms.get(code);
  if (!room) return null;

  room.state = "round-end";
  if (room.timer) clearTimeout(room.timer);
  if (room.hintTimer) clearInterval(room.hintTimer);

  room.scores = room.players.map((p) => ({
    id: p.id,
    name: p.name,
    score: p.score,
    avatar: p.avatar,
  }));

  return room;
}

function nextTurn(code) {
  const room = rooms.get(code);
  if (!room) return null;

  room.currentDrawerIndex++;

  const totalTurns = room.settings.rounds * room.players.length;
  const completedTurns = (room.currentRound - 1) * room.players.length + room.currentDrawerIndex;

  if (room.currentDrawerIndex >= room.players.length) {
    room.currentDrawerIndex = 0;
    room.currentRound++;
  }

  if (room.currentRound > room.settings.rounds) {
    room.state = "game-end";
    room.scores = room.players
      .map((p) => ({ id: p.id, name: p.name, score: p.score, avatar: p.avatar }))
      .sort((a, b) => b.score - a.score);
    return room;
  }

  return room;
}

function getAvatar(name) {
  const colors = ["#FF6B6B", "#4ECDC4", "#45B7D1", "#96CEB4", "#FECA57", "#FF9FF3", "#54A0FF", "#5F27CD"];
  const hash = name.split("").reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
  return { color: colors[hash % colors.length], initial: name[0]?.toUpperCase() || "?" };
}

function getRooms() {
  return rooms;
}

module.exports = {
  createRoom,
  getRoom,
  deleteRoom,
  addPlayer,
  removePlayer,
  getPlayer,
  setPlayerReady,
  getCurrentDrawer,
  startGame,
  startWordSelect,
  selectWord,
  buildHint,
  revealLetter,
  submitGuess,
  endRound,
  nextTurn,
  getRooms,
};
