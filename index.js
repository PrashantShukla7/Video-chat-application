const app = require("express")();
const server = require("http").createServer(app);
const cors = require("cors");

const io = require("socket.io")(server, {
    cors: {
        origin: "http://localhost:3000", // Allow only your frontend origin
        methods: ["GET", "POST"],
    },
});

app.use(cors());

const PORT = process.env.PORT || 9000;

app.get("/", (req, res) => {
    res.send("Running");
});

io.on("connection", (socket) => {
    socket.emit("me", socket.id);

    socket.on("disconnect", () => {
        socket.broadcast.emit("callEnded");
    });

    socket.on("callUser", ({ userToCall, signalData, from, name }) => {
        io.to(userToCall).emit("callUser", { signal: signalData, from, name });
    });

    socket.on("answerCall", (data) => {
        io.to(data.to).emit("callAccepted", data.signal);
    });
    
    socket.on("draw", (data) => {
        socket.broadcast.emit("draw", data); // Send drawing data to all other clients
    });

    console.log("All listeners registered for user:", socket.id);
});

server.listen(PORT, () => console.log(`Server is running on port ${PORT}`));
