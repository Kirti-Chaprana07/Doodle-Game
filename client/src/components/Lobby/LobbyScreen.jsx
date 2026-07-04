import { useState } from "react";
import { useSocket } from "../../context/SocketContext";
import { useGame } from "../../context/GameContext";

function PlayerAvatar({ player, size = "md" }) {
  const sz = size === "lg" ? "w-14 h-14 text-2xl" : "w-10 h-10 text-base";
  return (
    <div
      className={`${sz} rounded-2xl flex items-center justify-center font-display font-bold text-white shadow-lg flex-shrink-0`}
      style={{ backgroundColor: player.avatar?.color || "#888" }}
    >
      {player.avatar?.initial || player.name?.[0]?.toUpperCase() || "?"}
    </div>
  );
}

export default function LobbyScreen() {
  const { socket } = useSocket();
  const { state, dispatch, showNotification } = useGame();
  const { room, playerId } = state;

  const [copied, setCopied] = useState(false);

  if (!room) return null;

  const isHost = room.hostId === playerId;
  const myPlayer = room.players.find((p) => p.id === playerId);
  const allReady = room.players.every((p) => p.isReady || p.isHost);
  const canStart = isHost && room.players.length >= 2;

  const inviteLink = `${window.location.origin}?room=${room.code}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(inviteLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleReady = () => {
    const newReady = !myPlayer?.isReady;
    socket.emit("set_ready", { isReady: newReady });
  };

  const handleStart = () => {
    if (!canStart) return showNotification("Need at least 2 players!", "error");
    socket.emit("start_game");
  };

  const handleLeave = () => {
    socket.disconnect();
    socket.connect();
    dispatch({ type: "LEAVE_ROOM" });
  };

  const updateSettings = (key, value) => {
    socket.emit("update_settings", { settings: { [key]: value } });
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 relative z-10">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="text-center mb-6 animate-fade-in">
          <h1 className="font-display text-4xl text-white">🎨 Drawly</h1>
          <p className="text-white/50 text-sm mt-1">Waiting for players...</p>
        </div>

        {/* Room code + invite */}
        <div className="glass-card p-5 mb-4 animate-slide-up">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <p className="text-white/50 text-xs uppercase tracking-widest mb-1">Room Code</p>
              <p className="font-display text-4xl text-orange-400 tracking-widest">{room.code}</p>
            </div>
            <button
              onClick={handleCopy}
              className={`btn-secondary text-sm py-2 px-4 ${copied ? "bg-green-500/20 border-green-500/40 text-green-400" : ""}`}
            >
              {copied ? "✅ Copied!" : "🔗 Copy Invite Link"}
            </button>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          {/* Players */}
          <div className="glass-card p-5 animate-slide-up">
            <h2 className="font-display text-xl text-white mb-4">
              Players ({room.players.length}/{room.settings.maxPlayers})
            </h2>
            <div className="space-y-3">
              {room.players.map((player) => (
                <div key={player.id} className="flex items-center gap-3">
                  <PlayerAvatar player={player} />
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-white truncate">
                      {player.name}
                      {player.id === playerId && <span className="text-orange-400 text-xs ml-1">(you)</span>}
                    </p>
                    {player.isHost && (
                      <p className="text-yellow-400 text-xs font-semibold">👑 Host</p>
                    )}
                  </div>
                  <div className={`w-3 h-3 rounded-full ${player.isReady || player.isHost ? "bg-green-400" : "bg-white/20"}`} />
                </div>
              ))}
            </div>
          </div>

          {/* Settings */}
          <div className="glass-card p-5 animate-slide-up">
            <h2 className="font-display text-xl text-white mb-4">⚙️ Settings</h2>
            <div className="space-y-4">
              {[
                { label: "Rounds", key: "rounds", options: [2, 3, 4, 5, 6] },
                { label: "Draw Time", key: "drawTime", options: [40, 60, 80, 100, 120], suffix: "s" },
                { label: "Max Players", key: "maxPlayers", options: [2, 4, 6, 8, 10] },
              ].map(({ label, key, options, suffix }) => (
                <div key={key} className="flex items-center justify-between">
                  <span className="text-white/70 font-semibold text-sm">{label}</span>
                  <select
                    className="input-field py-1 px-3 text-sm"
                    value={room.settings[key]}
                    onChange={(e) => updateSettings(key, +e.target.value)}
                    disabled={!isHost}
                  >
                    {options.map((o) => (
                      <option key={o} value={o} className="bg-gray-900">
                        {o}{suffix || ""}
                      </option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-4 flex gap-3 animate-slide-up">
          <button className="btn-secondary" onClick={handleLeave}>← Leave</button>

          {!isHost && (
            <button
              className={`flex-1 font-bold py-3 px-6 rounded-2xl transition-all duration-150 ${myPlayer?.isReady ? "bg-green-500 hover:bg-green-400 text-white" : "btn-primary"}`}
              onClick={handleReady}
            >
              {myPlayer?.isReady ? "✅ Ready!" : "Ready Up"}
            </button>
          )}

          {isHost && (
            <button
              className={`flex-1 text-lg py-3 rounded-2xl font-bold transition-all duration-150 ${canStart ? "btn-primary animate-pulse-glow" : "bg-white/10 text-white/30 cursor-not-allowed"}`}
              onClick={handleStart}
              disabled={!canStart}
            >
              {room.players.length < 2 ? "Need 2+ players" : "🚀 Start Game!"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
