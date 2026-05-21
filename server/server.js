const express = require("express");
const { createServer } = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const { disconnect } = require("cluster");

const app = express();
app.use(cors());

const httpServer = createServer(app);
const io = new Server(httpServer, {
    cors: {
        origin: "http://localhost:8080",
        methods: ["GET", "POST"],
    },
});

const players = new Map();

io.on("connection", (socket) => {
    console.log("Player connected:", socket.id);

    socket.on("playerJoin", (data) => {
        players.set(socket.id, { ...data, id: socket.id });
        socket.broadcast.emit("playerJoin", {
            ...data,
            id: socket.id,
        });
    });
    socket.on("disconnect", () => {
        console.log("Player disconnected:", socket.id);
    });
});

const PORT = 3000;
httpServer.listen(PORT, () => {
    console.log(`Server running on ${PORT}`);
});
