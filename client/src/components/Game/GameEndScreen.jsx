import { useGame } from "../../context/GameContext";

function Confetti() {
  const pieces = Array.from({ length: 20 }, (_, i) => ({
    id: i,
    color: ["#FF6B6B", "#4ECDC4", "#FECA57", "#FF9FF3", "#54A0FF", "#5F27CD"][i % 6],
    left: `${Math.random() * 100}%`,
    delay: `${Math.random() * 2}s`,
    duration: `${2 + Math.random() * 2}s`,
    size: `${6 + Math.random() * 10}px`,
  }));

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-2xl">
      {pieces.map((p) => (
        <div
          key={p.id}
          className="absolute rounded"
          style={{
            left: p.left,
            top: "-20px",
            width: p.size,
            height: p.size,
            backgroundColor: p.color,
            animation: `confettiDrop ${p.duration} ${p.delay} ease-in forwards`,
          }}
        />
      ))}
    </div>
  );
}

function PlayerAvatar({ player }) {
  return (
    <div
      className="w-12 h-12 rounded-2xl flex items-center justify-center font-display font-bold text-white shadow-lg"
      style={{ backgroundColor: player.avatar?.color || "#888" }}
    >
      {player.avatar?.initial || player.name?.[0]?.toUpperCase() || "?"}
    </div>
  );
}

export default function GameEndScreen() {
  const { state } = useGame();
  const { gameState } = state;

  if (gameState.state !== "game-end") return null;

  const scores = gameState.scores || [];
  const winner = scores[0];

  const medals = ["🥇", "🥈", "🥉"];

  return (
    <div className="absolute inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 rounded-2xl">
      <Confetti />

      <div className="glass-card p-8 text-center max-w-md w-full mx-4 animate-bounce-in relative z-10">
        <div className="text-6xl mb-2">🏆</div>
        <p className="font-display text-4xl text-white mb-1">Game Over!</p>
        {winner && (
          <p className="text-orange-400 font-bold text-xl mb-6">
            🎉 {winner.name} wins with {winner.score} points!
          </p>
        )}

        {/* Top 3 podium */}
        <div className="flex items-end justify-center gap-4 mb-6">
          {[scores[1], scores[0], scores[2]].map((s, i) => {
            if (!s) return <div key={i} className="w-20" />;
            const heights = ["h-20", "h-28", "h-16"];
            const actualIdx = [1, 0, 2][i];
            return (
              <div key={s.id} className="flex flex-col items-center gap-2">
                <PlayerAvatar player={s} />
                <p className="text-white font-bold text-xs truncate w-16 text-center">{s.name}</p>
                <div
                  className={`w-16 ${heights[i]} rounded-t-xl flex items-center justify-center font-display text-2xl`}
                  style={{ background: ["rgba(192,192,192,0.3)", "rgba(255,215,0,0.3)", "rgba(205,127,50,0.3)"][i] }}
                >
                  {medals[actualIdx]}
                </div>
              </div>
            );
          })}
        </div>

        {/* Full scores */}
        <div className="space-y-2 text-left mb-6">
          {scores.map((s, i) => (
            <div key={s.id} className={`flex items-center gap-3 p-2 rounded-xl ${i === 0 ? "bg-yellow-500/20" : "bg-white/5"}`}>
              <span className="w-6 text-center">{medals[i] || `${i + 1}.`}</span>
              <PlayerAvatar player={s} />
              <span className="flex-1 font-bold text-white text-sm truncate">{s.name}</span>
              <span className="font-display text-orange-400 text-lg">{s.score}</span>
            </div>
          ))}
        </div>

        <p className="text-white/40 text-sm animate-pulse">Returning to lobby in 15s...</p>
      </div>
    </div>
  );
}
