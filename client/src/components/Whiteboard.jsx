import React, { useEffect, useRef } from 'react';
import { io } from 'socket.io-client';

const Whiteboard = () => {
  const canvasRef = useRef(null);
  const socketRef = useRef();
  const ctxRef = useRef();
  const drawing = useRef(false);

  // Define drawLine before usage
  const drawLine = (x, y, prevX, prevY) => {
    if (!ctxRef.current) return;
    ctxRef.current.beginPath();
    ctxRef.current.moveTo(prevX, prevY);
    ctxRef.current.lineTo(x, y);
    ctxRef.current.stroke();
  };

  useEffect(() => {
    // Initialize WebSocket connection
    socketRef.current = io('http://localhost:9000');

    // Setup canvas
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    // Set canvas dimensions and background color
    canvas.width = 800;
    canvas.height = 600;
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Configure drawing settings
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.strokeStyle = 'black';
    ctxRef.current = ctx;

    // Handle incoming drawing events
    socketRef.current.on('draw', ({ x, y, prevX, prevY }) => {
      drawLine(x, y, prevX, prevY); // No error now
    });

    return () => socketRef.current.disconnect();
  }, []);

  const handleMouseDown = (e) => {
    const { offsetX, offsetY } = e.nativeEvent;
    drawing.current = { x: offsetX, y: offsetY };
  };

  const handleMouseMove = (e) => {
    if (!drawing.current) return;
    const { offsetX, offsetY } = e.nativeEvent;
    const prevPos = drawing.current;
    drawLine(offsetX, offsetY, prevPos.x, prevPos.y);

    // Emit draw event
    socketRef.current.emit('draw', {
      x: offsetX,
      y: offsetY,
      prevX: prevPos.x,
      prevY: prevPos.y,
    });

    drawing.current = { x: offsetX, y: offsetY };
  };

  const handleMouseUp = () => {
    drawing.current = false;
  };

  return (
    <canvas
      ref={canvasRef}
      style={{ border: '1px solid black', backgroundColor: 'white' }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
    />
  );
};

export default Whiteboard;
