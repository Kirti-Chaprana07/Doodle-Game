import { useState, useEffect, useRef } from "react";
import { useSocket } from "../../context/SocketContext";
import { useGame } from "../../context/GameContext";

function ChatMessage({ msg }) {
  const typeStyles = {
    system: "text-white/50 italic text-center text-sm py-1",
    correct: "text-green-400 font-bold text-center text-sm bg-green-500/10 rounded-lg px-2 py-1",
    close: "text-yellow-400 text-sm",
    chat: "text-white text-sm",
  };

  if (msg.type === "system" || msg.type === "correct") {
    return (
      <div className={typeStyles[msg.type]}>
        {msg.type === "correct" && "✅ "}{msg.message}
      </div>
    );
  }

  return (
    <div className="flex gap-2 items-start">
      {msg.avatar && (
        <div
          className="w-6 h-6 rounded-lg flex-shrink-0 flex items-center justify-center text-xs font-bold text-white mt-0.5"
          style={{ backgroundColor: msg.avatar.color }}
        >
          {msg.avatar.initial}
        </div>
      )}
      <div className="flex-1 min-w-0">
        <span className="font-bold text-orange-300 text-xs">{msg.playerName}: </span>
        <span className={typeStyles[msg.type] || "text-white text-sm"}>
          {msg.type === "close" && "🔥 "}
          {msg.message}
        </span>
      </div>
    </div>
  );
}

export default function ChatPanel({ disabled }) {
  const { socket } = useSocket();
  const { state } = useGame();
  const { chat, gameState, playerId } = state;

  const [input, setInput] = useState("");
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chat]);

  const sendMessage = () => {
    const msg = input.trim();
    if (!msg || !socket) return;
    socket.emit("send_message", { message: msg });
    setInput("");
  };

  const isGuessing =
    gameState.state === "drawing" &&
    !gameState.isDrawer &&
    !state.room?.players.find((p) => p.id === playerId)?.hasGuessed;

  return (
    <div className="flex flex-col h-full glass-card overflow-hidden">
      <div className="px-4 py-3 border-b border-white/10 flex-shrink-0">
        <h3 className="font-display text-lg text-white">
          {isGuessing ? "💬 Guess!" : "💬 Chat"}
        </h3>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-3 py-2 space-y-2 chat-scroll">
        {chat.length === 0 && (
          <p className="text-white/30 text-center text-sm mt-4">No messages yet...</p>
        )}
        {chat.map((msg) => (
          <ChatMessage key={msg.id} msg={msg} />
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="p-3 border-t border-white/10 flex-shrink-0">
        <div className="flex gap-2">
          <input
            className="input-field flex-1 text-sm py-2"
            placeholder={isGuessing ? "Type your guess..." : "Say something..."}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && sendMessage()}
            maxLength={50}
            disabled={disabled}
          />
          <button
            className="btn-primary py-2 px-3 text-sm"
            onClick={sendMessage}
            disabled={disabled}
          >
            ↵
          </button>
        </div>
      </div>
    </div>
  );
}
