import { useGame } from "../../context/GameContext";

function PlayerAvatar({ player }) {
  return (
    <div
      className="w-10 h-10 rounded-xl flex items-center justify-center font-display font-bold text-white shadow-md flex-shrink-0"
      style={{ backgroundColor: player.avatar?.color || "#888" }}
    >
      {player.avatar?.initial || player.name?.[0]?.toUpperCase() || "?"}
    </div>
  );
}

export default function RoundEndOverlay() {
  const { state } = useGame();
  const { gameState } = state;

  if (gameState.state !== "round-end") return null;

  const scores = gameState.scores || [];

  return (
    <div className="absolute inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center z-50 rounded-2xl">
      <div className="glass-card p-6 text-center max-w-sm w-full mx-4 animate-bounce-in">
        <p className="font-display text-3xl text-white mb-1">Round Over!</p>
        <p className="text-white/60 mb-1">The word was:</p>
        <p className="font-display text-4xl text-orange-400 capitalize mb-6">
          {gameState.lastWord}
        </p>

        <div className="space-y-2 text-left">
          {scores.slice(0, 5).map((s, i) => (
            <div key={s.id} className={`flex items-center gap-3 p-2 rounded-xl ${i === 0 ? "bg-yellow-500/20" : "bg-white/5"}`}>
              <span className="text-2xl">{["🥇", "🥈", "🥉", "4️⃣", "5️⃣"][i]}</span>
              <PlayerAvatar player={s} />
              <span className="flex-1 font-bold text-white text-sm truncate">{s.name}</span>
              <span className="font-display text-orange-400">{s.score}</span>
            </div>
          ))}
        </div>

        <p className="text-white/40 text-sm mt-4 animate-pulse">Next round starting...</p>
      </div>
    </div>
  );
}
