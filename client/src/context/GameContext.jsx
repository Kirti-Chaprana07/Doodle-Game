import { createContext, useContext, useReducer, useCallback } from "react";

const GameContext = createContext(null);

const initialState = {
  screen: "home", // home | lobby | game
  room: null,
  playerId: null,
  playerName: "",
  gameState: {
    state: "lobby",
    currentRound: 0,
    totalRounds: 3,
    drawer: null,
    hint: "",
    wordLength: 0,
    drawTime: 80,
    timeLeft: 80,
    isDrawer: false,
    currentWord: null,
    scores: [],
    wordOptions: [],
    lastWord: null,
  },
  chat: [],
  notification: null,
};

function gameReducer(state, action) {
  switch (action.type) {
    case "SET_PLAYER_INFO":
      return { ...state, playerId: action.playerId, playerName: action.playerName };
    case "JOIN_ROOM":
      return { ...state, screen: "lobby", room: action.room };
    case "UPDATE_ROOM":
      return { ...state, room: action.room };
    case "UPDATE_PLAYERS":
      return { ...state, room: { ...state.room, players: action.players } };
    case "GAME_STARTED":
      return { ...state, screen: "game", room: action.room, gameState: { ...state.gameState, state: "starting" } };
    case "UPDATE_GAME_STATE":
      return { ...state, gameState: { ...state.gameState, ...action.payload } };
    case "ADD_CHAT":
      return { ...state, chat: [...state.chat.slice(-100), action.message] };
    case "CLEAR_CHAT":
      return { ...state, chat: [] };
    case "SET_NOTIFICATION":
      return { ...state, notification: action.notification };
    case "LEAVE_ROOM":
      return { ...initialState };
    case "RETURN_TO_LOBBY":
      return { ...state, screen: "lobby", room: action.room, chat: [], gameState: { ...initialState.gameState } };
    default:
      return state;
  }
}

export function GameProvider({ children }) {
  const [state, dispatch] = useReducer(gameReducer, initialState);

  const showNotification = useCallback((message, type = "info", duration = 3000) => {
    dispatch({ type: "SET_NOTIFICATION", notification: { message, type, id: Date.now() } });
    setTimeout(() => dispatch({ type: "SET_NOTIFICATION", notification: null }), duration);
  }, []);

  return (
    <GameContext.Provider value={{ state, dispatch, showNotification }}>
      {children}
    </GameContext.Provider>
  );
}

export function useGame() {
  return useContext(GameContext);
}
