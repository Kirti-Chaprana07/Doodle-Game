import { useSocket } from "../../context/SocketContext";
import { useGame } from "../../context/GameContext";
import { useState, useEffect } from "react";

export default function WordSelectOverlay() {
  const { socket } = useSocket();
  const { state } = useGame();
  const { gameState } = state;
  const [timeLeft, setTimeLeft] = useState(15);

  useEffect(() => {
    setTimeLeft(15);
    const t = setInterval(() => {
      setTimeLeft((p) => {
        if (p <= 1) { clearInterval(t); return 0; }
        return p - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [gameState.wordOptions]);

  if (gameState.state !== "word-select" || !gameState.isDrawer || !gameState.wordOptions?.length) return null;

  const selectWord = (word) => {
    socket.emit("select_word", { word });
  };

  return (
    <div className="absolute inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 rounded-2xl">
      <div className="glass-card p-8 text-center max-w-sm w-full mx-4 animate-bounce-in">
        <p className="text-white/60 text-sm uppercase tracking-widest mb-2">Choose a word to draw</p>
        <div className="text-orange-400 font-display text-3xl mb-6">{timeLeft}s</div>

        <div className="flex flex-col gap-3">
          {gameState.wordOptions.map((word) => (
            <button
              key={word}
              onClick={() => selectWord(word)}
              className="btn-primary text-xl py-4 capitalize hover:scale-105 transition-transform"
            >
              {word}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
