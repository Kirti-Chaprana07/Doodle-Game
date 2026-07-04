import { useState } from "react";
import { useSocket } from "../../context/SocketContext";
import { useGame } from "../../context/GameContext";

export default function HomeScreen() {
  const { socket, connected } = useSocket();
  const { dispatch, showNotification } = useGame();

  const [playerName, setPlayerName] = useState("");
  const [roomCode, setRoomCode] = useState("");
  const [mode, setMode] = useState(null); // null | "create" | "join"
  const [loading, setLoading] = useState(false);
  const [settings, setSettings] = useState({
    rounds: 3,
    drawTime: 80,
    maxPlayers: 8,
  });

  const handleCreate = () => {
    if (!playerName.trim()) return showNotification("Enter your name!", "error");
    if (!connected) return showNotification("Connecting to server...", "error");

    setLoading(true);
    socket.emit("create_room", { playerName: playerName.trim(), settings }, (res) => {
      setLoading(false);
      if (res.success) {
        dispatch({ type: "SET_PLAYER_INFO", playerId: res.playerId, playerName: playerName.trim() });
        dispatch({ type: "JOIN_ROOM", room: res.room });
      } else {
        showNotification(res.error || "Failed to create room", "error");
      }
    });
  };

  const handleJoin = () => {
    if (!playerName.trim()) return showNotification("Enter your name!", "error");
    if (!roomCode.trim()) return showNotification("Enter a room code!", "error");
    if (!connected) return showNotification("Connecting to server...", "error");

    setLoading(true);
    socket.emit("join_room", { roomCode: roomCode.toUpperCase().trim(), playerName: playerName.trim() }, (res) => {
      setLoading(false);
      if (res.success) {
        dispatch({ type: "SET_PLAYER_INFO", playerId: res.playerId, playerName: playerName.trim() });
        dispatch({ type: "JOIN_ROOM", room: res.room });
      } else {
        showNotification(res.error || "Failed to join room", "error");
      }
    });
  };

  // Check URL for room code (invite link)
  useState(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get("room");
    if (code) {
      setRoomCode(code.toUpperCase());
      setMode("join");
    }
  });

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 relative z-10">
      {/* Header */}
      <div className="text-center mb-12 animate-bounce-in">
        <h1 className="font-display text-7xl md:text-8xl text-white drop-shadow-2xl mb-2">
          🎨 Drawly
        </h1>
        <p className="text-white/60 font-body text-xl font-semibold">
          Draw, Guess & Win with Friends!
        </p>
        <div className={`mt-3 inline-flex items-center gap-2 text-sm px-3 py-1 rounded-full ${connected ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"}`}>
          <span className={`w-2 h-2 rounded-full ${connected ? "bg-green-400 animate-pulse" : "bg-red-400"}`} />
          {connected ? "Connected" : "Connecting..."}
        </div>
      </div>

      {/* Main Card */}
      <div className="glass-card p-8 w-full max-w-md animate-slide-up">
        {/* Name Input */}
        <div className="mb-6">
          <label className="block text-white/70 font-semibold text-sm mb-2 uppercase tracking-wider">
            Your Name
          </label>
          <input
            className="input-field w-full text-lg"
            placeholder="Enter your nickname..."
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value.slice(0, 16))}
            onKeyDown={(e) => { if (e.key === "Enter" && mode === "join") handleJoin(); if (e.key === "Enter" && mode === "create") handleCreate(); }}
            maxLength={16}
          />
        </div>

        {!mode && (
          <div className="flex flex-col gap-3">
            <button
              className="btn-primary text-xl py-4 w-full"
              onClick={() => setMode("create")}
            >
              🏠 Create Room
            </button>
            <button
              className="btn-secondary text-xl py-4 w-full"
              onClick={() => setMode("join")}
            >
              🚪 Join Room
            </button>
          </div>
        )}

        {mode === "create" && (
          <div className="animate-slide-up">
            <div className="grid grid-cols-3 gap-3 mb-6">
              <div>
                <label className="block text-white/60 text-xs mb-1 font-semibold uppercase">Rounds</label>
                <select
                  className="input-field w-full text-sm"
                  value={settings.rounds}
                  onChange={(e) => setSettings({ ...settings, rounds: +e.target.value })}
                >
                  {[2, 3, 4, 5, 6].map(n => <option key={n} value={n} className="bg-gray-900">{n}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-white/60 text-xs mb-1 font-semibold uppercase">Time (s)</label>
                <select
                  className="input-field w-full text-sm"
                  value={settings.drawTime}
                  onChange={(e) => setSettings({ ...settings, drawTime: +e.target.value })}
                >
                  {[40, 60, 80, 100, 120].map(n => <option key={n} value={n} className="bg-gray-900">{n}s</option>)}
                </select>
              </div>
              <div>
                <label className="block text-white/60 text-xs mb-1 font-semibold uppercase">Players</label>
                <select
                  className="input-field w-full text-sm"
                  value={settings.maxPlayers}
                  onChange={(e) => setSettings({ ...settings, maxPlayers: +e.target.value })}
                >
                  {[2, 4, 6, 8, 10].map(n => <option key={n} value={n} className="bg-gray-900">{n}</option>)}
                </select>
              </div>
            </div>
            <button className="btn-primary w-full text-lg py-4 mb-3" onClick={handleCreate} disabled={loading}>
              {loading ? "Creating..." : "✨ Create Room"}
            </button>
            <button className="btn-secondary w-full" onClick={() => setMode(null)}>← Back</button>
          </div>
        )}

        {mode === "join" && (
          <div className="animate-slide-up">
            <label className="block text-white/70 font-semibold text-sm mb-2 uppercase tracking-wider">
              Room Code
            </label>
            <input
              className="input-field w-full text-2xl tracking-widest mb-6 font-display text-center uppercase"
              placeholder="ABC123"
              value={roomCode}
              onChange={(e) => setRoomCode(e.target.value.toUpperCase().slice(0, 6))}
              onKeyDown={(e) => e.key === "Enter" && handleJoin()}
              maxLength={6}
            />
            <button className="btn-primary w-full text-lg py-4 mb-3" onClick={handleJoin} disabled={loading}>
              {loading ? "Joining..." : "🚪 Join Room"}
            </button>
            <button className="btn-secondary w-full" onClick={() => setMode(null)}>← Back</button>
          </div>
        )}
      </div>

      {/* Footer */}
      <p className="mt-8 text-white/30 text-sm font-body">
        🎮 Up to 10 players per room · Real-time multiplayer
      </p>
    </div>
  );
}
