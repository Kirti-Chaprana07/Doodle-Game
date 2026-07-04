import { useEffect, useRef } from "react";
import { useCanvas } from "../../hooks/useCanvas";
import { useGame } from "../../context/GameContext";

const COLORS = [
  "#000000", "#FFFFFF", "#FF0000", "#FF6600", "#FFAA00", "#FFD700",
  "#00CC00", "#00AA88", "#0066FF", "#6600CC", "#FF00AA", "#884400",
  "#888888", "#CCCCCC", "#FF8888", "#88FF88", "#8888FF", "#FFFF88",
];

const BRUSH_SIZES = [2, 4, 8, 16, 24];

export default function DrawingCanvas({ isDrawer }) {
  const { state } = useGame();
  const { canvasRef, tool, setTool, color, setColor, brushSize, setBrushSize, clearCanvas } = useCanvas(
    isDrawer,
    state.room?.code
  );
  const containerRef = useRef(null);

  // Resize canvas to fill container
  useEffect(() => {
    const resize = () => {
      const canvas = canvasRef.current;
      const container = containerRef.current;
      if (!canvas || !container) return;

      // Save current drawing
      const tempCanvas = document.createElement("canvas");
      tempCanvas.width = canvas.width;
      tempCanvas.height = canvas.height;
      tempCanvas.getContext("2d").drawImage(canvas, 0, 0);

      canvas.width = container.clientWidth;
      canvas.height = container.clientHeight;

      // Restore
      canvas.getContext("2d").drawImage(tempCanvas, 0, 0, canvas.width, canvas.height);
    };

    resize();
    const ro = new ResizeObserver(resize);
    if (containerRef.current) ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, [canvasRef]);

  return (
    <div className="flex flex-col h-full">
      {/* Canvas */}
      <div
        ref={containerRef}
        className="flex-1 rounded-2xl overflow-hidden bg-white shadow-xl"
        style={{ minHeight: 300, cursor: isDrawer ? (tool === "eraser" ? "cell" : "crosshair") : "default" }}
      >
        <canvas
          ref={canvasRef}
          className="w-full h-full"
          style={{ display: "block" }}
        />
      </div>

      {/* Toolbar — only for drawer */}
      {isDrawer && (
        <div className="mt-3 glass-card p-3">
          <div className="flex flex-wrap items-center gap-3">
            {/* Tool selector */}
            <div className="flex gap-2">
              <button
                onClick={() => setTool("pen")}
                title="Pen"
                className={`w-9 h-9 rounded-xl flex items-center justify-center text-lg transition-all ${tool === "pen" ? "bg-orange-500 shadow-lg shadow-orange-500/30" : "bg-white/10 hover:bg-white/20"}`}
              >
                ✏️
              </button>
              <button
                onClick={() => setTool("eraser")}
                title="Eraser"
                className={`w-9 h-9 rounded-xl flex items-center justify-center text-lg transition-all ${tool === "eraser" ? "bg-orange-500 shadow-lg shadow-orange-500/30" : "bg-white/10 hover:bg-white/20"}`}
              >
                🧹
              </button>
              <button
                onClick={clearCanvas}
                title="Clear Canvas"
                className="w-9 h-9 rounded-xl flex items-center justify-center text-lg bg-red-500/20 hover:bg-red-500/40 text-red-400 transition-all"
              >
                🗑️
              </button>
            </div>

            {/* Divider */}
            <div className="w-px h-8 bg-white/20" />

            {/* Brush sizes */}
            <div className="flex items-center gap-2">
              {BRUSH_SIZES.map((size) => (
                <button
                  key={size}
                  onClick={() => setBrushSize(size)}
                  className={`flex items-center justify-center rounded-full transition-all ${brushSize === size ? "ring-2 ring-orange-400 bg-white/20" : "hover:bg-white/10"}`}
                  style={{ width: Math.max(20, size + 8), height: Math.max(20, size + 8) }}
                >
                  <div
                    className="rounded-full bg-white"
                    style={{ width: size, height: size }}
                  />
                </button>
              ))}
            </div>

            {/* Divider */}
            <div className="w-px h-8 bg-white/20" />

            {/* Color picker */}
            <div className="flex flex-wrap gap-1.5 flex-1">
              {COLORS.map((c) => (
                <button
                  key={c}
                  onClick={() => { setColor(c); setTool("pen"); }}
                  className={`w-7 h-7 rounded-lg transition-transform hover:scale-110 ${color === c && tool !== "eraser" ? "ring-2 ring-white scale-110" : ""}`}
                  style={{ backgroundColor: c, border: c === "#FFFFFF" ? "2px solid rgba(255,255,255,0.3)" : "none" }}
                />
              ))}
              {/* Custom color */}
              <label className="w-7 h-7 rounded-lg cursor-pointer overflow-hidden ring-1 ring-white/20 hover:ring-orange-400 transition-all" title="Custom color">
                <input
                  type="color"
                  value={color}
                  onChange={(e) => { setColor(e.target.value); setTool("pen"); }}
                  className="opacity-0 w-0 h-0"
                />
                <div className="w-full h-full flex items-center justify-center text-xs bg-gradient-to-br from-red-400 via-green-400 to-blue-400">
                  🎨
                </div>
              </label>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
