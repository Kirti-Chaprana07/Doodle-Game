import { useEffect, useRef } from "react";
import { useSocket } from "../context/SocketContext";
import { useGame } from "../context/GameContext";

export function useGameSocket() {
  const { socket } = useSocket();
  const { state, dispatch, showNotification } = useGame();
  const timerRef = useRef(null);

  useEffect(() => {
    if (!socket) return;

    // ─── ROOM EVENTS ───────────────────────────────────────────────

    socket.on("player_joined", ({ players, message }) => {
      dispatch({ type: "UPDATE_PLAYERS", players });
      dispatch({ type: "ADD_CHAT", message: { id: Date.now(), type: "system", message } });
      showNotification(message, "info");
    });

    socket.on("player_left", ({ players, message }) => {
      dispatch({ type: "UPDATE_PLAYERS", players });
      dispatch({ type: "ADD_CHAT", message: { id: Date.now(), type: "system", message } });
      showNotification(message, "warning");
    });

    socket.on("player_ready_changed", ({ players }) => {
      dispatch({ type: "UPDATE_PLAYERS", players });
    });

    socket.on("settings_updated", ({ settings }) => {
      dispatch({
        type: "UPDATE_ROOM",
        room: { ...state.room, settings },
      });
    });

    // ─── GAME EVENTS ───────────────────────────────────────────────

    socket.on("game_started", ({ room }) => {
      dispatch({ type: "GAME_STARTED", room });
      dispatch({ type: "CLEAR_CHAT" });
      showNotification("Game starting!", "success");
    });

    socket.on("round_info", ({ round, totalRounds, drawer, state: gameState }) => {
      dispatch({
        type: "UPDATE_GAME_STATE",
        payload: {
          state: "word-select",
          currentRound: round,
          totalRounds,
          drawer,
          hint: "",
          isDrawer: drawer.id === socket.id,
        },
      });
    });

    socket.on("word_options", ({ words, timeLimit }) => {
      dispatch({
        type: "UPDATE_GAME_STATE",
        payload: { wordOptions: words, state: "word-select" },
      });
    });

    socket.on("drawing_started", ({ word, hint, wordLength, drawTime, isDrawer }) => {
      if (timerRef.current) clearInterval(timerRef.current);

      dispatch({
        type: "UPDATE_GAME_STATE",
        payload: {
          state: "drawing",
          currentWord: word || null,
          hint: hint || "",
          wordLength: wordLength || (word ? word.length : 0),
          drawTime,
          timeLeft: drawTime,
          isDrawer,
          wordOptions: [],
        },
      });

      // Client-side countdown
      let t = drawTime;
      timerRef.current = setInterval(() => {
        t -= 1;
        dispatch({ type: "UPDATE_GAME_STATE", payload: { timeLeft: Math.max(0, t) } });
        if (t <= 0) clearInterval(timerRef.current);
      }, 1000);
    });

    socket.on("hint_update", ({ hint }) => {
      dispatch({ type: "UPDATE_GAME_STATE", payload: { hint } });
    });

    socket.on("round_ended", ({ word, scores, players }) => {
      if (timerRef.current) clearInterval(timerRef.current);
      dispatch({
        type: "UPDATE_GAME_STATE",
        payload: { state: "round-end", lastWord: word, scores },
      });
      dispatch({ type: "UPDATE_PLAYERS", players });
      dispatch({
        type: "ADD_CHAT",
        message: { id: Date.now(), type: "system", message: `The word was: "${word}"` },
      });
    });

    socket.on("game_ended", ({ scores, winner }) => {
      if (timerRef.current) clearInterval(timerRef.current);
      dispatch({
        type: "UPDATE_GAME_STATE",
        payload: { state: "game-end", scores },
      });
      showNotification(`🏆 ${winner.name} wins!`, "success", 6000);
    });

    socket.on("returned_to_lobby", ({ room }) => {
      dispatch({ type: "RETURN_TO_LOBBY", room });
    });

    // ─── SCORING ───────────────────────────────────────────────────

    socket.on("correct_guess", ({ points }) => {
      showNotification(`✅ Correct! +${points} points!`, "success");
    });

    socket.on("player_guessed", ({ playerName, points, players, scores }) => {
      dispatch({ type: "UPDATE_PLAYERS", players });
      dispatch({ type: "UPDATE_GAME_STATE", payload: { scores } });
      dispatch({
        type: "ADD_CHAT",
        message: {
          id: Date.now(),
          type: "correct",
          message: `${playerName} guessed the word! (+${points})`,
        },
      });
    });

    // ─── CHAT ──────────────────────────────────────────────────────

    socket.on("chat_message", (msg) => {
      dispatch({ type: "ADD_CHAT", message: msg });
    });

    socket.on("error_msg", ({ message }) => {
      showNotification(message, "error");
    });

    return () => {
      socket.off("player_joined");
      socket.off("player_left");
      socket.off("player_ready_changed");
      socket.off("settings_updated");
      socket.off("game_started");
      socket.off("round_info");
      socket.off("word_options");
      socket.off("drawing_started");
      socket.off("hint_update");
      socket.off("round_ended");
      socket.off("game_ended");
      socket.off("returned_to_lobby");
      socket.off("correct_guess");
      socket.off("player_guessed");
      socket.off("chat_message");
      socket.off("error_msg");
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [socket, dispatch, showNotification]);
}
