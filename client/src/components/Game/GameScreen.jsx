import { useGame } from "../../context/GameContext";
import DrawingCanvas from "../Canvas/DrawingCanvas";
import ChatPanel from "../Chat/ChatPanel";
import GameHeader from "./GameHeader";
import PlayerList from "./PlayerList";
import WordSelectOverlay from "./WordSelectOverlay";
import RoundEndOverlay from "./RoundEndOverlay";
import GameEndScreen from "./GameEndScreen";

export default function GameScreen() {
  const { state } = useGame();
  const { gameState } = state;

  const isDrawer = gameState.isDrawer;

  return (
    <div className="min-h-screen flex flex-col p-2 md:p-4 gap-3 relative z-10">
      {/* Header */}
      <GameHeader />

      {/* Main area */}
      <div className="flex-1 flex gap-3 min-h-0" style={{ maxHeight: "calc(100vh - 120px)" }}>
        {/* Player list - desktop left column */}
        <div className="hidden md:flex flex-col w-44 flex-shrink-0">
          <PlayerList />
        </div>

        {/* Canvas */}
        <div className="flex-1 relative flex flex-col min-w-0">
          <DrawingCanvas isDrawer={isDrawer} />

          {/* Overlays */}
          <WordSelectOverlay />
          <RoundEndOverlay />
          <GameEndScreen />
        </div>

        {/* Chat */}
        <div className="hidden md:flex flex-col w-60 flex-shrink-0">
          <ChatPanel disabled={false} />
        </div>
      </div>

      {/* Mobile bottom: players + chat tabs */}
      <div className="md:hidden flex gap-2 h-48">
        <div className="flex-1">
          <PlayerList />
        </div>
        <div className="flex-1">
          <ChatPanel disabled={false} />
        </div>
      </div>
    </div>
  );
}
