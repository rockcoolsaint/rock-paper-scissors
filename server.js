const express = require("express");
const http = require("http");
const path = require("path");
const socketio = require("socket.io");

const app = express();

const server = http.createServer(app);

app.use(express.static(path.join(__dirname, "public")));

const io = socketio(server);

const {userConnected, connectedUsers, initializeChoices, moves, makeMove, choices, setGameRounds} = require("./util/users");
const {createRoom, joinRoom, exitRoom, rooms} = require("./util/rooms");
const e = require("express");
const { exitCode } = require("process");

io.on("connection", socket => {
    socket.on("create-room", (roomId) => {
        if(rooms[roomId]){
            const error = "This room already exists";
            socket.emit("display-error", error);
        }else{
            userConnected(socket.client.id);
            createRoom(roomId, socket.client.id);
            socket.emit("room-created", roomId);
            socket.emit("player-1-connected");
            socket.join(roomId);
            // initializeChoices(roomId); // initialize choices before an opponent joins you

            console.log(`choices upon room-created: ${choices[roomId]}`)
        }
    })

    socket.on("set-game-rounds", ({roomId, rounds}) => {
        let playRounds = parseInt(rounds);

        setGameRounds(roomId, playRounds);
        console.log(`choices: ${choices[roomId]}`);

        socket.emit("game-rounds-set", rounds);
    })

    socket.on("join-room", roomId => {
        if(!rooms[roomId]){
            const error = "This room doen't exist";
            socket.emit("display-error", error);
        }else{
            userConnected(socket.client.id);
            joinRoom(roomId, socket.client.id);
            socket.join(roomId);

            socket.emit("room-joined", roomId);
            socket.emit("player-2-connected");
            socket.broadcast.to(roomId).emit("player-2-connected");
            initializeChoices(roomId);
        }
    })

    socket.on("join-random", () => {
        let roomId = "";

        for(let id in rooms){
            if(rooms[id][1] === ""){
                roomId = id;
                break;
            }
        }

        if(roomId === ""){
            const error = "All rooms are full or none exists";
            socket.emit("display-error", error);
        }else{
            userConnected(socket.client.id);
            joinRoom(roomId, socket.client.id);
            socket.join(roomId);

            socket.emit("room-joined", roomId);
            socket.emit("player-2-connected");
            socket.broadcast.to(roomId).emit("player-2-connected");
            initializeChoices(roomId);
        }
    });

    socket.on("make-move", ({playerId, myChoice, roomId}) => {
        console.log(`choices on make-move: ${choices[roomId]}`)
        makeMove(roomId, playerId, myChoice);
        // let rounds = choices[roomId][2];
        // let count = choices[roomId][3];

        // console.log(`choices on make-move: ${choices[roomId]}`)

        if(choices[roomId][0] !== "" && choices[roomId][1] !== ""){
            let playerOneChoice = choices[roomId][0];
            let playerTwoChoice = choices[roomId][1];

            if(playerOneChoice === playerTwoChoice){
                let message = "Both of you chose " + playerOneChoice + " . So it's draw";
                io.to(roomId).emit("draw", message);
                
            }else if(moves[playerOneChoice] === playerTwoChoice){
                let enemyChoice = "";

                if(playerId === 1){
                    enemyChoice = playerTwoChoice;
                }else{
                    enemyChoice = playerOneChoice;
                }

                io.to(roomId).emit("player-1-wins", {myChoice, enemyChoice});
            }else{
                let enemyChoice = "";

                if(playerId === 1){
                    enemyChoice = playerTwoChoice;
                }else{
                    enemyChoice = playerOneChoice;
                }

                io.to(roomId).emit("player-2-wins", {myChoice, enemyChoice});
            }

            // choices[roomId] = ["", ""];
            choices[roomId][0] = "";
            choices[roomId][1] = "";

            // if count == rounds, then game over
            if (choices[roomId][3] == choices[roomId][2]) {
                // GameOver and overall results
                console.log("Game Over")
                choices[roomId][3] = 0;
                let gameOverMessage = "Game Over!"
                io.to(roomId).emit("game-over", gameOverMessage, roomId);
            } else {
                choices[roomId][3]++;
            }
        }
    });

    socket.on("disconnect", () => {
        if(connectedUsers[socket.client.id]){
            let player;
            let roomId;

            for(let id in rooms){
                if(rooms[id][0] === socket.client.id || 
                    rooms[id][1] === socket.client.id){
                    if(rooms[id][0] === socket.client.id){
                        player = 1;
                    }else{
                        player = 2;
                    }

                    roomId = id;
                    break;
                }
            }

            exitRoom(roomId, player);

            if(player === 1){
                io.to(roomId).emit("player-1-disconnected");
            }else{
                io.to(roomId).emit("player-2-disconnected");
            }
        }
    })
})

server.listen(5000, () => console.log("Server started on port 5000..."));