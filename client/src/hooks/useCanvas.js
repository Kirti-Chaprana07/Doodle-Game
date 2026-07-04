import { useRef, useEffect, useCallback, useState } from "react";
import { useSocket } from "../context/SocketContext";

export function useCanvas(isDrawer, roomCode) {
  const canvasRef = useRef(null);
  const { socket } = useSocket();
  const isDrawing = useRef(false);
  const lastPos = useRef(null);
  const ctxRef = useRef(null);

  const [tool, setTool] = useState("pen");
  const [color, setColor] = useState("#000000");
  const [brushSize, setBrushSize] = useState(4);

  const getCtx = useCallback(() => {
    if (!canvasRef.current) return null;
    if (!ctxRef.current) {
      const ctx = canvasRef.current.getContext("2d");
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctxRef.current = ctx;
    }
    return ctxRef.current;
  }, []);

  const getPos = useCallback((e, canvas) => {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    if (e.touches) {
      return {
        x: (e.touches[0].clientX - rect.left) * scaleX,
        y: (e.touches[0].clientY - rect.top) * scaleY,
      };
    }
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  }, []);

  const drawLine = useCallback((ctx, from, to, strokeColor, size, eraser = false) => {
    ctx.globalCompositeOperation = eraser ? "destination-out" : "source-over";
    ctx.strokeStyle = eraser ? "rgba(0,0,0,1)" : strokeColor;
    ctx.lineWidth = eraser ? size * 3 : size;
    ctx.beginPath();
    ctx.moveTo(from.x, from.y);
    ctx.lineTo(to.x, to.y);
    ctx.stroke();
  }, []);

  // Draw events from others
  useEffect(() => {
    if (!socket) return;

    socket.on("draw", (data) => {
      const ctx = getCtx();
      if (!ctx) return;
      drawLine(ctx, data.from, data.to, data.color, data.size, data.eraser);
    });

    socket.on("clear_canvas", () => {
      const ctx = getCtx();
      if (!ctx || !canvasRef.current) return;
      ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    });

    socket.on("draw_history", ({ history }) => {
      const ctx = getCtx();
      if (!ctx) return;
      history.forEach((data) => {
        drawLine(ctx, data.from, data.to, data.color, data.size, data.eraser);
      });
    });

    return () => {
      socket.off("draw");
      socket.off("clear_canvas");
      socket.off("draw_history");
    };
  }, [socket, getCtx, drawLine]);

  // Request history on mount
  useEffect(() => {
    if (socket && !isDrawer) {
      socket.emit("request_draw_history");
    }
  }, [socket, isDrawer]);

  const startDraw = useCallback(
    (e) => {
      if (!isDrawer) return;
      e.preventDefault();
      isDrawing.current = true;
      const canvas = canvasRef.current;
      lastPos.current = getPos(e, canvas);
    },
    [isDrawer, getPos]
  );

  const draw = useCallback(
    (e) => {
      if (!isDrawing.current || !isDrawer) return;
      e.preventDefault();
      const canvas = canvasRef.current;
      const ctx = getCtx();
      if (!ctx) return;

      const pos = getPos(e, canvas);
      const from = lastPos.current;
      const to = pos;
      const eraser = tool === "eraser";

      drawLine(ctx, from, to, color, brushSize, eraser);

      // Emit to server
      if (socket) {
        socket.emit("draw", { from, to, color, size: brushSize, eraser });
      }

      lastPos.current = pos;
    },
    [isDrawer, tool, color, brushSize, getCtx, getPos, drawLine, socket]
  );

  const stopDraw = useCallback(() => {
    isDrawing.current = false;
    lastPos.current = null;
  }, []);

  const clearCanvas = useCallback(() => {
    if (!isDrawer) return;
    const ctx = getCtx();
    if (!ctx || !canvasRef.current) return;
    ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    if (socket) socket.emit("clear_canvas");
  }, [isDrawer, getCtx, socket]);

  // Attach events
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !isDrawer) return;

    canvas.addEventListener("mousedown", startDraw);
    canvas.addEventListener("mousemove", draw);
    canvas.addEventListener("mouseup", stopDraw);
    canvas.addEventListener("mouseleave", stopDraw);
    canvas.addEventListener("touchstart", startDraw, { passive: false });
    canvas.addEventListener("touchmove", draw, { passive: false });
    canvas.addEventListener("touchend", stopDraw);

    return () => {
      canvas.removeEventListener("mousedown", startDraw);
      canvas.removeEventListener("mousemove", draw);
      canvas.removeEventListener("mouseup", stopDraw);
      canvas.removeEventListener("mouseleave", stopDraw);
      canvas.removeEventListener("touchstart", startDraw);
      canvas.removeEventListener("touchmove", draw);
      canvas.removeEventListener("touchend", stopDraw);
    };
  }, [isDrawer, startDraw, draw, stopDraw]);

  return {
    canvasRef,
    tool, setTool,
    color, setColor,
    brushSize, setBrushSize,
    clearCanvas,
  };
}
