import { useGame } from "../../context/GameContext";

function PlayerAvatar({ player, size = "sm" }) {
  const sz = size === "lg" ? "w-12 h-12 text-xl" : "w-9 h-9 text-sm";
  return (
    <div
      className={`${sz} rounded-xl flex items-center justify-center font-display font-bold text-white shadow-md flex-shrink-0`}
      style={{ backgroundColor: player.avatar?.color || "#888" }}
    >
      {player.avatar?.initial || player.name?.[0]?.toUpperCase() || "?"}
    </div>
  );
}

export default function PlayerList() {
  const { state } = useGame();
  const { room, playerId, gameState } = state;

  if (!room) return null;

  const sortedPlayers = [...room.players].sort((a, b) => b.score - a.score);
  const drawerId = gameState.drawer?.id;

  return (
    <div className="glass-card overflow-hidden flex flex-col h-full">
      <div className="px-4 py-3 border-b border-white/10 flex-shrink-0">
        <h3 className="font-display text-lg text-white">Players</h3>
      </div>
      <div className="flex-1 overflow-y-auto">
        {sortedPlayers.map((player, idx) => {
          const isMe = player.id === playerId;
          const isDrawer = player.id === drawerId;
          const hasGuessed = gameState.state === "drawing" && player.hasGuessed && !isDrawer;

          return (
            <div
              key={player.id}
              className={`flex items-center gap-3 px-3 py-2.5 border-b border-white/5 transition-all
                ${isMe ? "bg-orange-500/10" : ""}
                ${isDrawer ? "bg-blue-500/10" : ""}
                ${hasGuessed ? "opacity-70" : ""}
              `}
            >
              {/* Rank */}
              <span className="text-white/40 text-xs font-bold w-4 flex-shrink-0">
                {idx + 1}
              </span>

              <PlayerAvatar player={player} />

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1 flex-wrap">
                  <p className={`font-bold text-sm truncate ${isMe ? "text-orange-300" : "text-white"}`}>
                    {player.name}
                  </p>
                  {player.isHost && <span className="text-yellow-400 text-xs">👑</span>}
                  {isDrawer && <span className="text-blue-300 text-xs">✏️</span>}
                  {hasGuessed && <span className="text-green-400 text-xs">✅</span>}
                </div>
                <p className="text-white/50 text-xs font-semibold">
                  {player.score} pts
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
