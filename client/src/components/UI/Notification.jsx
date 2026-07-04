import { useGame } from "../../context/GameContext";

const STYLES = {
  info: "bg-blue-500/80 border-blue-400/40",
  success: "bg-green-500/80 border-green-400/40",
  warning: "bg-yellow-500/80 border-yellow-400/40",
  error: "bg-red-500/80 border-red-400/40",
};

const ICONS = {
  info: "ℹ️",
  success: "✅",
  warning: "⚠️",
  error: "❌",
};

export default function Notification() {
  const { state } = useGame();
  const { notification } = state;

  if (!notification) return null;

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] animate-slide-up">
      <div className={`flex items-center gap-3 px-5 py-3 rounded-2xl border backdrop-blur-md shadow-xl ${STYLES[notification.type] || STYLES.info}`}>
        <span>{ICONS[notification.type] || "ℹ️"}</span>
        <p className="font-bold text-white text-sm">{notification.message}</p>
      </div>
    </div>
  );
}
