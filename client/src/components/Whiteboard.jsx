import React, { useEffect, useRef, useContext } from 'react';
import { SocketContext } from '../Context';

const Whiteboard = () => {
  const canvasRef = useRef(null);
  const ctxRef = useRef();
  const drawing = useRef(false);

  // Get socket context values
  const { emitDrawing, roomId } = useContext(SocketContext);
  const { socket } = useContext(SocketContext);

  // Define drawLine function
  const drawLine = (x, y, prevX, prevY) => {
    if (!ctxRef.current) return false;
    ctxRef.current.beginPath();
    ctxRef.current.moveTo(prevX, prevY);
    ctxRef.current.lineTo(x, y);
    ctxRef.current.stroke();
    return true;
  };

  useEffect(() => {
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
    const handleDrawEvent = (data) => drawLine(data.x, data.y, data.prevX, data.prevY);

    if (socket) {
      // Listen for draw events
      socket.on('draw', handleDrawEvent);

      // Cleanup listener when component unmounts
      return () => {
        socket.off('draw', handleDrawEvent);
        return true;
      };
    }
    return undefined;
  }, [socket]);

  const handleMouseDown = (e) => {
    const { offsetX, offsetY } = e.nativeEvent;
    drawing.current = { x: offsetX, y: offsetY };
  };

  const handleMouseMove = (e) => {
    if (!drawing.current || !roomId) return;

    const { offsetX, offsetY } = e.nativeEvent;
    const prevPos = drawing.current;

    // Draw locally
    drawLine(offsetX, offsetY, prevPos.x, prevPos.y);

    // Emit drawing data to room
    emitDrawing({
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

  const handleMouseLeave = () => {
    drawing.current = false;
  };

  return (
    <div className="whiteboard-container">
      <canvas
        ref={canvasRef}
        style={{
          border: '1px solid black',
          backgroundColor: 'white',
          cursor: roomId ? 'crosshair' : 'not-allowed',
        }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
      />
      {!roomId && (
        <div
          style={{
            textAlign: 'center',
            marginTop: '10px',
            color: 'red',
          }}
        >
          Join a call to enable whiteboard collaboration
        </div>
      )}
    </div>
  );
};

export default Whiteboard;
