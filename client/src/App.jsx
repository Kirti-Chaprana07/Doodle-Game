import { useGame } from "./context/GameContext";
import { useGameSocket } from "./hooks/useGameSocket";
import HomeScreen from "./components/Lobby/HomeScreen";
import LobbyScreen from "./components/Lobby/LobbyScreen";
import GameScreen from "./components/Game/GameScreen";
import Notification from "./components/UI/Notification";

function AppContent() {
  const { state } = useGame();
  useGameSocket();

  return (
    <>
      <Notification />
      {state.screen === "home" && <HomeScreen />}
      {state.screen === "lobby" && <LobbyScreen />}
      {state.screen === "game" && <GameScreen />}
    </>
  );
}

export default AppContent;
