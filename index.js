const app = require("express")();
const server = require("http").createServer(app);
const cors = require("cors");

const io = require("socket.io")(server, {
    cors: {
        origin: "http://localhost:3000",
        methods: ["GET", "POST"],
    },
});

app.use(cors());

const PORT = process.env.PORT || 9000;

// Keep track of active calls/rooms and their participants
const activeRooms = new Map();

app.get("/", (req, res) => {
    res.send("Running");
});

io.on("connection", (socket) => {
    socket.emit("me", socket.id);

    socket.on("callUser", ({ userToCall, signalData, from, name, roomId }) => {
        // Add both users to the room
        if (!activeRooms.has(roomId)) {
            activeRooms.set(roomId, new Set([from, userToCall]));
        }
        socket.join(roomId);
        
        io.to(userToCall).emit("callUser", { 
            signal: signalData, 
            from, 
            name,
            roomId
        });
    });

    socket.on("answerCall", (data) => {
        const { to, roomId } = data;
        socket.join(roomId);
        
        // Ensure both users are in the room set
        if (activeRooms.has(roomId)) {
            activeRooms.get(roomId).add(socket.id);
        }

        io.to(to).emit("callAccepted", data.signal);
    });

    socket.on("draw", (data) => {
        const { roomId, ...drawingData } = data;
        if (roomId && activeRooms.has(roomId)) {
            // Broadcast to all users in the room except sender
            socket.to(roomId).emit("draw", drawingData);
        }
    });

    socket.on("disconnect", () => {
        // Remove user from all rooms they were part of
        activeRooms.forEach((participants, roomId) => {
            if (participants.has(socket.id)) {
                participants.delete(socket.id);
                if (participants.size === 0) {
                    activeRooms.delete(roomId);
                }
            }
        });
        socket.broadcast.emit("callEnded");
    });
});

server.listen(PORT, () => console.log(`Server is running on port ${PORT}`));