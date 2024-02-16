const http = require("http")
const express = require("express");
const app = express();
const socketIo = require("socket.io");
const fs = require("fs");
const path  = require('path');
const cors = require("cors")
app.use(cors());
const port = process.env.PORT || 5555;

const server = http.Server(app).listen(port, () => {
    console.log('Server on Port ' + port);
});

const io = socketIo(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});
const clients = {};


//Routes
app.get("/", (req, res) => {
    const stream = fs.createReadStream(__dirname + "/src/Static/home.html");
    console.log("get prueba")
    stream.pipe(res);
});

app.get("/src/Static/index.html",(req,res)=>{
    const stream = fs.createReadStream(__dirname + "/src/Static/index.html");
    stream.pipe(res);
})

// Serve static resources
app.use(express.static(path.join(__dirname ,"/src/Static")))
// app.use(express.static(path.join(__dirname , "/node_modules")));

var players = {};
var unmatched;

var gameRoomCounter = 1; // Contador para crear salas únicas
const gameRooms = {};

// When a client connects
io.on("connection", function(socket) {
    console.log("Conectado ")
    let id = socket.id;

    console.log("New client connected. ID: ", socket.id);
    clients[socket.id] = socket;

    socket.on("disconnect", function () {
        if (opponentOf(socket)) {
            opponentOf(socket).emit("opponent.left");
    
               socket.disconnect(true);
            const roomName = players[socket.id]?.room;
    
            if (roomName && gameRooms[roomName]) {
                gameRooms[roomName].forEach(playerId => {
                    // Asegurarse de que el jugador aún esté en la sala antes de intentar dejarla
                    if (io.sockets.adapter.rooms.get(playerId) && io.sockets.adapter.rooms.get(playerId).has(roomName)) {
                        io.sockets.adapter.socketsLeave(playerId, roomName);
                    }
    
                    delete players[playerId].room;
                });
    
                delete gameRooms[roomName];
            }
        }
    });
    

    join(socket);
    
    if (opponentOf(socket)) { 
        socket.emit("game.begin", { 
            symbol: players[socket.id].symbol
        });

        opponentOf(socket).emit("game.begin", { 
            symbol: players[opponentOf(socket).id].symbol 
        });
    }


    // Event for when any player makes a move
    socket.on("make.move", function(data) {
        if (!opponentOf(socket)) {
            return;
        }

        socket.emit("move.made", data);
        opponentOf(socket).emit("move.made", data);
    });

    socket.on("disconnect", function () {
        try {
            if (opponentOf(socket)) {
                // Informar al oponente que el jugador abandono el juego
                opponentOf(socket).emit("opponent.left");
    
                // Cerrar la conexión del jugador que abandono el juego
                const disconnectSocket = io.sockets.connected[socket.id];
                if (disconnectSocket) {
                    disconnectSocket.disconnect(true);
                }
    
                // Salir de la sala cuando un jugador se desconecta
                const roomName = players[socket.id]?.room;
    
                if (roomName && gameRooms[roomName]) {
                    gameRooms[roomName].forEach(playerId => {
                        // Asegurarse de que el jugador aún esté en la sala antes de intentar dejarla
                        if (io.sockets.adapter.rooms.get(playerId) && io.sockets.adapter.rooms.get(playerId).has(roomName)) {
                            io.sockets.adapter.socketsLeave(playerId, roomName);
                        }
    
                        delete players[playerId].room;
                    });
    
                    delete gameRooms[roomName];
                }
            }
        } catch (error) {
            console.error("Error handling disconnect:", error);
        }
    });
    
    
});

function join(socket) {
    players[socket.id] = {
        opponent: unmatched,
        symbol: "X",
        socket: socket
    };

    if (unmatched) {
        players[socket.id].symbol = "O";
        players[unmatched].opponent = socket.id;
        
        // Crear una sala única para los dos jugadores emparejados
        const roomName = `gameRoom_${gameRoomCounter++}`;
        socket.join(roomName);
        players[socket.id].room = roomName;
        players[unmatched].room = roomName;
        gameRooms[roomName] = [socket.id, unmatched];
        
        unmatched = null;
    } else {
        unmatched = socket.id;
    }
}

function opponentOf(socket) {
    if (!players[socket.id].opponent) {
        return;
    }
    return players[players[socket.id].opponent].socket;
}