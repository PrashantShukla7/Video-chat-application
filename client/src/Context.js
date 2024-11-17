import React, { createContext, useState, useRef, useEffect } from 'react';
import { io } from 'socket.io-client';
import Peer from 'simple-peer';

const SocketContext = createContext();

const socket = io('http://localhost:9000');

const ContextProvider = ({ children }) => {
  const [callAccepted, setCallAccepted] = useState(false);
  const [callEnded, setCallEnded] = useState(false);
  const [stream, setStream] = useState();
  const [name, setName] = useState('');
  const [call, setCall] = useState({});
  const [me, setMe] = useState('');
  const [roomId, setRoomId] = useState(null);

  const myVideo = useRef();
  const userVideo = useRef();
  const connectionRef = useRef();

  useEffect(() => {
    navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      .then((currentStream) => {
        setStream(currentStream);
        myVideo.current.srcObject = currentStream;
      });

    socket.on('me', (id) => setMe(id));

    socket.on('callUser', ({ from, name: callerName, signal, roomId: callRoomId }) => {
      setCall({ isReceivingCall: true, from, name: callerName, signal, roomId: callRoomId });
    });

    socket.on('userDisconnected', (userId) => {
      console.log('User disconnected:', userId);
    });

    return () => {
      socket.off('me');
      socket.off('callUser');
      socket.off('userDisconnected');
    };
  }, []);

  const callUser = (id) => {
    const peer = new Peer({ initiator: true, trickle: false, stream });
    // Generate room ID using both user IDs to ensure it's the same for both participants
    const newRoomId = [me, id].sort().join('-');
    setRoomId(newRoomId);

    peer.on('signal', (data) => {
      socket.emit('callUser', {
        userToCall: id,
        signalData: data,
        from: me,
        name,
        roomId: newRoomId,
      });
    });

    peer.on('stream', (currentStream) => {
      userVideo.current.srcObject = currentStream;
    });

    socket.on('callAccepted', (signal) => {
      setCallAccepted(true);
      peer.signal(signal);
    });

    connectionRef.current = peer;
  };

  const answerCall = () => {
    setCallAccepted(true);
    setRoomId(call.roomId);

    const peer = new Peer({ initiator: false, trickle: false, stream });

    peer.on('signal', (data) => {
      socket.emit('answerCall', {
        signal: data,
        to: call.from,
        roomId: call.roomId,
      });
    });

    peer.on('stream', (currentStream) => {
      userVideo.current.srcObject = currentStream;
    });

    peer.signal(call.signal);
    connectionRef.current = peer;
  };

  const leaveCall = () => {
    setCallEnded(true);
    setRoomId(null);
    connectionRef.current.destroy();
    window.location.reload();
  };

  const emitDrawing = (drawingData) => {
    if (roomId) {
      socket.emit('draw', {
        ...drawingData,
        roomId,
      });
    }
  };

  return (
    <SocketContext.Provider value={{
      call,
      callAccepted,
      myVideo,
      userVideo,
      stream,
      name,
      setName,
      callEnded,
      me,
      callUser,
      leaveCall,
      answerCall,
      emitDrawing,
      roomId,
      socket,
    }}
    >
      {children}
    </SocketContext.Provider>
  );
};

export { ContextProvider, SocketContext };
