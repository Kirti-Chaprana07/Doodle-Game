const {
  createRoom,
  getRoom,
  addPlayer,
  removePlayer,
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
} = require("../game/gameManager");

const WORD_SELECT_TIME = 15000; // 15s to pick word
const ROUND_END_DELAY = 5000;   // 5s between rounds

function setupSocketHandlers(io) {
  // Map socketId -> { roomCode, playerName }
  const socketRoomMap = new Map();

  io.on("connection", (socket) => {
    console.log(`✅ Connected: ${socket.id}`);

    // ─── ROOM MANAGEMENT ───────────────────────────────────────────

    socket.on("create_room", ({ playerName, settings }, callback) => {
      try {
        const room = createRoom(socket.id, playerName, settings);
        socket.join(room.code);
        socketRoomMap.set(socket.id, { roomCode: room.code, playerName });

        callback({ success: true, room: sanitizeRoom(room), playerId: socket.id });
        console.log(`🏠 Room created: ${room.code} by ${playerName}`);
      } catch (err) {
        callback({ success: false, error: err.message });
      }
    });

    socket.on("join_room", ({ roomCode, playerName }, callback) => {
      try {
        const code = roomCode.toUpperCase().trim();
        const result = addPlayer(code, socket.id, playerName);

        if (result.error) return callback({ success: false, error: result.error });

        socket.join(code);
        socketRoomMap.set(socket.id, { roomCode: code, playerName });

        const room = result.room;

        // Notify existing players
        socket.to(code).emit("player_joined", {
          player: result.player,
          players: room.players,
          message: `${playerName} joined the room!`,
        });

        callback({ success: true, room: sanitizeRoom(room), playerId: socket.id });
        console.log(`👤 ${playerName} joined room ${code}`);
      } catch (err) {
        callback({ success: false, error: err.message });
      }
    });

    socket.on("set_ready", ({ isReady }) => {
      const info = socketRoomMap.get(socket.id);
      if (!info) return;

      const room = setPlayerReady(info.roomCode, socket.id, isReady);
      if (!room) return;

      io.to(info.roomCode).emit("player_ready_changed", {
        playerId: socket.id,
        isReady,
        players: room.players,
      });
    });

    socket.on("update_settings", ({ settings }) => {
      const info = socketRoomMap.get(socket.id);
      if (!info) return;
      const room = getRoom(info.roomCode);
      if (!room || room.hostId !== socket.id) return;

      room.settings = { ...room.settings, ...settings };
      io.to(info.roomCode).emit("settings_updated", { settings: room.settings });
    });

    // ─── GAME FLOW ─────────────────────────────────────────────────

    socket.on("start_game", () => {
      const info = socketRoomMap.get(socket.id);
      if (!info) return;
      const room = getRoom(info.roomCode);
      if (!room || room.hostId !== socket.id) return;
      if (room.players.length < 2) {
        socket.emit("error_msg", { message: "Need at least 2 players to start!" });
        return;
      }

      const updatedRoom = startGame(info.roomCode);
      io.to(info.roomCode).emit("game_started", { room: sanitizeRoom(updatedRoom) });

      setTimeout(() => beginWordSelect(io, info.roomCode), 2000);
    });

    socket.on("select_word", ({ word }) => {
      const info = socketRoomMap.get(socket.id);
      if (!info) return;
      const room = getRoom(info.roomCode);
      if (!room) return;

      const drawer = getCurrentDrawer(room);
      if (drawer.id !== socket.id) return;
      if (!room.currentWordOptions.includes(word)) return;

      if (room.wordSelectTimer) {
        clearTimeout(room.wordSelectTimer);
        room.wordSelectTimer = null;
      }

      beginDrawingPhase(io, info.roomCode, word);
    });

    // ─── DRAWING ───────────────────────────────────────────────────

    socket.on("draw", (data) => {
      const info = socketRoomMap.get(socket.id);
      if (!info) return;
      const room = getRoom(info.roomCode);
      if (!room || room.state !== "drawing") return;

      const drawer = getCurrentDrawer(room);
      if (drawer.id !== socket.id) return;

      // Save to history for reconnections
      room.drawHistory.push(data);

      // Broadcast to everyone else
      socket.to(info.roomCode).emit("draw", data);
    });

    socket.on("clear_canvas", () => {
      const info = socketRoomMap.get(socket.id);
      if (!info) return;
      const room = getRoom(info.roomCode);
      if (!room) return;

      const drawer = getCurrentDrawer(room);
      if (drawer.id !== socket.id) return;

      room.drawHistory = [];
      io.to(info.roomCode).emit("clear_canvas");
    });

    // ─── CHAT / GUESSING ───────────────────────────────────────────

    socket.on("send_message", ({ message }) => {
      const info = socketRoomMap.get(socket.id);
      if (!info) return;
      const room = getRoom(info.roomCode);
      if (!room) return;

      const player = room.players.find((p) => p.id === socket.id);
      if (!player) return;

      const drawer = room.state === "drawing" ? getCurrentDrawer(room) : null;

      // Handle guess
      if (room.state === "drawing" && drawer && socket.id !== drawer.id && !player.hasGuessed) {
        const result = submitGuess(info.roomCode, socket.id, message);

        if (result && result.isCorrect) {
          // Tell guesser privately
          socket.emit("correct_guess", { points: result.points });

          // Tell everyone the guess was correct (without revealing word)
          io.to(info.roomCode).emit("player_guessed", {
            playerId: socket.id,
            playerName: player.name,
            points: result.points,
            players: room.players,
            scores: room.scores,
          });

          // Check if all non-drawers guessed
          const nonDrawers = room.players.filter((p) => p.id !== drawer.id);
          const allGuessed = nonDrawers.every((p) => p.hasGuessed);
          if (allGuessed) {
            triggerRoundEnd(io, info.roomCode);
          }
          return;
        }

        // Close guess — send as chat but mark
        const closeGuess = isCloseGuess(message, room.currentWord);
        io.to(info.roomCode).emit("chat_message", {
          id: Date.now(),
          playerId: socket.id,
          playerName: player.name,
          message,
          type: closeGuess ? "close" : "chat",
          avatar: player.avatar,
        });
        return;
      }

      // Drawer can't chat during drawing (or already guessed)
      if (room.state === "drawing" && (socket.id === drawer?.id || player.hasGuessed)) {
        // Send only to themselves or guessers — keep word secret
        socket.emit("chat_message", {
          id: Date.now(),
          playerId: socket.id,
          playerName: player.name,
          message,
          type: "chat",
          avatar: player.avatar,
        });
        return;
      }

      // Regular lobby chat
      const chatMsg = {
        id: Date.now(),
        playerId: socket.id,
        playerName: player.name,
        message,
        type: "chat",
        avatar: player.avatar,
      };
      io.to(info.roomCode).emit("chat_message", chatMsg);
    });

    // ─── DISCONNECT ────────────────────────────────────────────────

    socket.on("disconnect", () => {
      const info = socketRoomMap.get(socket.id);
      if (!info) return;

      socketRoomMap.delete(socket.id);
      const room = removePlayer(info.roomCode, socket.id);

      if (!room) return;

      io.to(info.roomCode).emit("player_left", {
        playerId: socket.id,
        playerName: info.playerName,
        players: room.players,
        message: `${info.playerName} left the room`,
      });

      // If drawer left mid-game, end round early
      if (room.state === "drawing") {
        const drawer = getCurrentDrawer(room);
        if (!drawer || drawer.id === socket.id) {
          triggerRoundEnd(io, info.roomCode);
        }
      }

      console.log(`❌ Disconnected: ${socket.id} (${info.playerName})`);
    });

    // ─── RECONNECT ─────────────────────────────────────────────────
    socket.on("request_draw_history", () => {
      const info = socketRoomMap.get(socket.id);
      if (!info) return;
      const room = getRoom(info.roomCode);
      if (!room) return;

      socket.emit("draw_history", { history: room.drawHistory });
    });
  });

  // ─── GAME PHASE HELPERS ──────────────────────────────────────────

  function beginWordSelect(io, roomCode) {
    const room = startWordSelect(roomCode);
    if (!room) return;

    const drawer = getCurrentDrawer(room);

    // Send word options only to drawer
    const drawerSocket = io.sockets.sockets.get(drawer.id);
    if (drawerSocket) {
      drawerSocket.emit("word_options", {
        words: room.currentWordOptions,
        timeLimit: WORD_SELECT_TIME / 1000,
      });
    }

    // Tell everyone else who's drawing
    io.to(roomCode).emit("round_info", {
      round: room.currentRound,
      totalRounds: room.settings.rounds,
      drawer: { id: drawer.id, name: drawer.name, avatar: drawer.avatar },
      state: "word-select",
      wordLength: null,
    });

    // Auto-select word if drawer doesn't pick
    room.wordSelectTimer = setTimeout(() => {
      const r = getRoom(roomCode);
      if (!r || r.state !== "word-select") return;
      const randomWord = r.currentWordOptions[Math.floor(Math.random() * r.currentWordOptions.length)];
      beginDrawingPhase(io, roomCode, randomWord);
    }, WORD_SELECT_TIME);
  }

  function beginDrawingPhase(io, roomCode, word) {
    const room = selectWord(roomCode, word);
    if (!room) return;

    const drawer = getCurrentDrawer(room);
    const hint = buildHint(room);

    // Tell drawer the actual word
    const drawerSocket = io.sockets.sockets.get(drawer.id);
    if (drawerSocket) {
      drawerSocket.emit("drawing_started", {
        word,
        hint,
        drawTime: room.settings.drawTime,
        isDrawer: true,
      });
    }

    // Tell others the hint
    io.to(roomCode).except(drawer.id).emit("drawing_started", {
      word: null,
      hint,
      wordLength: word.length,
      drawTime: room.settings.drawTime,
      isDrawer: false,
    });

    // Hint reveal schedule — reveal letters at 1/3 and 2/3 of time
    const drawTime = room.settings.drawTime * 1000;
    const hint1Time = drawTime * (1 / 3);
    const hint2Time = drawTime * (2 / 3);

    if (room.settings.hints) {
      room.hintTimer = setTimeout(() => {
        const r = revealLetter(roomCode);
        if (r) {
          io.to(roomCode).except(drawer.id).emit("hint_update", { hint: buildHint(r) });
        }
        room.hintTimer2 = setTimeout(() => {
          const r2 = revealLetter(roomCode);
          if (r2) {
            io.to(roomCode).except(drawer.id).emit("hint_update", { hint: buildHint(r2) });
          }
        }, hint2Time - hint1Time);
      }, hint1Time);
    }

    // Round end timer
    room.timer = setTimeout(() => {
      triggerRoundEnd(io, roomCode);
    }, drawTime);

    console.log(`🎨 Drawing started in ${roomCode}: "${word}"`);
  }

  function triggerRoundEnd(io, roomCode) {
    const room = endRound(roomCode);
    if (!room) return;

    io.to(roomCode).emit("round_ended", {
      word: room.currentWord,
      scores: room.scores,
      players: room.players,
    });

    setTimeout(() => {
      const updatedRoom = nextTurn(roomCode);
      if (!updatedRoom) return;

      if (updatedRoom.state === "game-end") {
        io.to(roomCode).emit("game_ended", {
          scores: updatedRoom.scores,
          winner: updatedRoom.scores[0],
        });
        // Reset to lobby after 15s
        setTimeout(() => {
          const r = getRoom(roomCode);
          if (r) {
            r.state = "lobby";
            r.currentRound = 0;
            r.currentDrawerIndex = 0;
            r.currentWord = null;
            r.drawHistory = [];
            r.players.forEach((p) => {
              p.score = 0;
              p.hasGuessed = false;
              p.isReady = false;
            });
            io.to(roomCode).emit("returned_to_lobby", { room: sanitizeRoom(r) });
          }
        }, 15000);
      } else {
        beginWordSelect(io, roomCode);
      }
    }, ROUND_END_DELAY);
  }
}

function isCloseGuess(guess, word) {
  if (!word) return false;
  const g = guess.toLowerCase().trim();
  const w = word.toLowerCase();
  if (g === w) return false;
  // Levenshtein distance ≤ 2
  return levenshtein(g, w) <= 2;
}

function levenshtein(a, b) {
  const dp = Array.from({ length: a.length + 1 }, (_, i) =>
    Array.from({ length: b.length + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0))
  );
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      dp[i][j] =
        a[i - 1] === b[j - 1]
          ? dp[i - 1][j - 1]
          : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
    }
  }
  return dp[a.length][b.length];
}

function sanitizeRoom(room) {
  return {
    code: room.code,
    hostId: room.hostId,
    players: room.players,
    settings: room.settings,
    state: room.state,
    currentRound: room.currentRound,
    scores: room.scores,
  };
}

module.exports = { setupSocketHandlers };
