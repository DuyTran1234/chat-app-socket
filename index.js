const { Server } = require("socket.io");
const dotenv = require('dotenv');

dotenv.config();
const PORT = process.env.PORT;
const io = new Server({
    cors: {
        origin: [
            process.env.CLIENT_SERVER,
            process.env.CLIENT_LOCALHOST,
        ],
        preflightContinue: false,
        optionsSuccessStatus: 204,
    },
});
const usersLoginSocket = new Map();

io.on("connection", (socket) => {
    socket.on("login", (_id) => {
        if (_id) {
            usersLoginSocket.set(socket.id, _id);
            socket.broadcast.emit("triggerUserStatus", true);
        }
    });
    socket.on("clientGetUserLogin", (listUser) => {
        const checkArr = Array.from(usersLoginSocket.values());
        let listUserOnline = listUser?.filter((user) => checkArr.includes(user._id)).map((user) => user._id);
        socket.emit("listContactStatusOnline", listUserOnline);
    });

    socket.on("startConversationRoom", (roomId) => {
        socket.join(roomId);
        console.log(`${socket.id} join room: ${roomId}`);
    });

    socket.on("sendMessage", (message) => {
        socket.to(message.roomId).emit("receiveMessage", message);
    });

    socket.on("typing", ({ roomId, username, active }) => {
        if (active === true) { socket.to(roomId).emit("userTyping", { username, active: true }); }
        else {
            socket.to(roomId).emit("userTyping", { username, active: false });
        }
    });

    socket.on("logout", () => {
        usersLoginSocket.delete(socket.id);
        socket.broadcast.emit("triggerUserStatus", true);
    })

    socket.on("disconnect", () => {
        usersLoginSocket.delete(socket.id);
        socket.broadcast.emit("triggerUserStatus", true);
        socket.disconnect();
    })

});

io.listen(PORT, () => {
    console.log(`socket server running on port: ${PORT}`);
});