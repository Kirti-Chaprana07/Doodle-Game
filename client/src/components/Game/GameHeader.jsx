import { useGame } from "../../context/GameContext";
import { useSocket } from "../../context/SocketContext";

function HintDisplay({ hint, word, wordLength }) {
  const chars = word
    ? word.split("")
    : hint
    ? hint.split("")
    : Array(wordLength || 5).fill("_");

  return (
    <div className="flex items-center gap-1 flex-wrap justify-center">
      {chars.map((ch, i) => (
        <span
          key={i}
          className={`hint-char font-display text-2xl ${ch === " " ? "mx-1" : ch === "_" ? "text-white/40 border-b-2 border-white/40" : "text-white"}`}
        >
          {ch === "_" ? "\u00A0" : ch === " " ? "\u00A0" : ch}
        </span>
      ))}
    </div>
  );
}

function TimerRing({ timeLeft, drawTime }) {
  const pct = drawTime > 0 ? timeLeft / drawTime : 0;
  const r = 22;
  const circ = 2 * Math.PI * r;
  const isLow = timeLeft <= 10;

  return (
    <div className="relative w-16 h-16 flex-shrink-0">
      <svg className="w-full h-full -rotate-90" viewBox="0 0 56 56">
        <circle cx="28" cy="28" r={r} fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="4" />
        <circle
          cx="28"
          cy="28"
          r={r}
          fill="none"
          stroke={isLow ? "#ef4444" : "#f97316"}
          strokeWidth="4"
          strokeDasharray={circ}
          strokeDashoffset={circ * (1 - pct)}
          strokeLinecap="round"
          style={{ transition: "stroke-dashoffset 1s linear, stroke 0.3s" }}
        />
      </svg>
      <div className={`absolute inset-0 flex items-center justify-center font-display text-xl ${isLow ? "timer-low" : "text-white"}`}>
        {timeLeft}
      </div>
    </div>
  );
}

export default function GameHeader() {
  const { state } = useGame();
  const { socket } = useSocket();
  const { gameState, room, playerId } = state;

  const { currentRound, totalRounds, drawer, hint, currentWord, wordLength, timeLeft, drawTime, state: gs } = gameState;

  const isHost = room?.hostId === playerId;

  return (
    <div className="glass-card px-4 py-3 flex items-center gap-4">
      {/* Round info */}
      <div className="flex-shrink-0 text-center">
        <p className="text-white/50 text-xs uppercase tracking-widest">Round</p>
        <p className="font-display text-2xl text-white">{currentRound}/{totalRounds}</p>
      </div>

      <div className="w-px h-10 bg-white/20 flex-shrink-0" />

      {/* Drawer info */}
      {drawer && (
        <div className="flex-shrink-0 text-center hidden sm:block">
          <p className="text-white/50 text-xs uppercase tracking-widest">Drawing</p>
          <p className="font-bold text-orange-300 text-sm">{drawer.name}</p>
        </div>
      )}

      {/* Hint / word */}
      <div className="flex-1 flex justify-center">
        {gs === "drawing" && (
          <HintDisplay
            hint={hint}
            word={currentWord}
            wordLength={wordLength}
          />
        )}
        {gs === "word-select" && (
          <p className="text-white/70 font-semibold animate-pulse">
            {gameState.isDrawer ? "Choose a word..." : `${drawer?.name} is choosing a word...`}
          </p>
        )}
        {gs === "round-end" && (
          <p className="text-white font-bold text-lg">
            The word was: <span className="text-orange-400">"{gameState.lastWord}"</span>
          </p>
        )}
        {gs === "starting" && (
          <p className="text-white/70 font-semibold animate-pulse">Game starting...</p>
        )}
      </div>

      {/* Timer */}
      {gs === "drawing" && (
        <TimerRing timeLeft={timeLeft} drawTime={drawTime} />
      )}
    </div>
  );
}
