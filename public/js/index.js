const socket = io();

// DOM Elements
const openCreateRoomBox = document.getElementById("open-create-room-box");
const openJoinRoomBox = document.getElementById("open-join-room-box");
const createRoomBox = document.getElementById("create-room-box");
const roomIdInput = document.getElementById("room-id");
const cancelCreateActionBtn = document.getElementById("cancel-create-action");
const gameplayChoices = document.getElementById("gameplay-choices");
const createRoomBtn = document.getElementById("create-room-btn");
const gameplayScreen = document.querySelector(".gameplay-screen");
const gameplay = document.getElementById("gameplay");
const startScreen = document.querySelector(".start-screen");
const cancelJoinActionBtn = document.getElementById("cancel-join-action");
const joinBoxRoom = document.getElementById("join-room-box");
const joinRoomBtn = document.getElementById("join-room-btn");
const joinRoomInput = document.getElementById("join-room-input");
const joinRandomBtn = document.getElementById("join-random");
const gameRoundsBox = document.getElementById("game-rounds-box");
const gameRoundsInput = document.getElementById("rounds-input");
const gameRoundsBtn = document.getElementById("rounds-btn");
const errorMessage = document.getElementById("error-message");
const playerOne = document.getElementById("player-1");
const playerTwo = document.getElementById("player-2");
const waitMessage = document.getElementById("wait-message");
const rock = document.getElementById("rock");
const paper = document.getElementById("paper");
const scissor = document.getElementById("scissor");
const myScore = document.getElementById('my-score');
const enemyScore = document.getElementById('enemy-score');
const playerOneTag = document.getElementById("player-1-tag");
const playerTwoTag = document.getElementById("player-2-tag");
const winMessage = document.getElementById("win-message");
const gameChoices = document.querySelector(".choices");
const gameOverMessageBox = document.getElementById("game-over-message");
const restartGameBtn = document.getElementById("reset-play-btn");
const pausePlayBtn = document.getElementById("pause-play-btn");

//  Game variables
let canChoose = false;
let playerOneConnected = false;
let playerTwoIsConnected = false;
let playerId = 0;
let myChoice = "";
let enemyChoice = "";
let roomId = "";
let myScorePoints = 0;
let enemyScorePoints = 0;
let gameOver = false;

openCreateRoomBox.addEventListener("click", function(){
    gameplayChoices.style.display = "none";
    createRoomBox.style.display = "block";
})

cancelCreateActionBtn.addEventListener("click", function(){
    gameplayChoices.style.display = "block";
    createRoomBox.style.display = "none";
})

createRoomBtn.addEventListener("click", function(){
    let id = roomIdInput.value;

    gameRoundsBox.style.display = "none";
    gameplay.style.pointerEvents = "none";
    gameplay.style.opacity = "0.5";
    errorMessage.innerHTML = "";
    errorMessage.style.display = "none";

    socket.emit("create-room", id);
})

openJoinRoomBox.addEventListener("click", function(){
    gameplayChoices.style.display = "none";
    joinBoxRoom.style.display = "block";
})

cancelJoinActionBtn.addEventListener("click", function(){
    gameplayChoices.style.display = "block";
    joinBoxRoom.style.display = "none";
})

gameRoundsBtn.addEventListener("click", function() {
    let rounds = gameRoundsInput.value;
    gameRoundsBox.style.display = "none";

    socket.emit("set-game-rounds", {roomId, rounds});
})

joinRoomBtn.addEventListener("click", function(){
    let id = joinRoomInput.value;

    errorMessage.innerHTML = "";
    errorMessage.style.display = "none";

    socket.emit("join-room", id);
})

joinRandomBtn.addEventListener("click", function(){
    errorMessage.innerHTML = "";
    errorMessage.style.display = "none";
    socket.emit("join-random");
})

restartGameBtn.addEventListener("click", function(){
    if(playerId === 1) {
        gameRoundsBox.style.display = "block";
        gameOverMessageBox.innerHTML = "";
        myScorePoints = 0;
        enemyScorePoints = 0;

        myScore.innerHTML = 0;
        enemyScore.innerHTML = 0;
    } else {
        gameOverMessageBox.innerHTML = "";
        gameChoices.style.pointerEvents = "auto";
        gameChoices.style.opacity = "1.0";
        myScorePoints = 0;
        enemyScorePoints = 0;

        myScore.innerHTML = 0;
        enemyScore.innerHTML = 0;
    }
})

rock.addEventListener("click", function(){
    if(canChoose && myChoice === "" && playerOneConnected && playerTwoIsConnected){
        myChoice = "rock";
        choose(myChoice);
        socket.emit("make-move", {playerId, myChoice, roomId});
    }
})

paper.addEventListener("click", function(){
    if(canChoose && myChoice === "" && playerOneConnected && playerTwoIsConnected){
        myChoice = "paper";
        choose(myChoice);
        socket.emit("make-move", {playerId, myChoice, roomId});
    }
})

scissor.addEventListener("click", function(){
    if(canChoose && myChoice === "" && playerOneConnected && playerTwoIsConnected){
        myChoice = "scissor";
        choose(myChoice);
        socket.emit("make-move", {playerId, myChoice, roomId});
    }
})

// Socket
socket.on("display-error", error => {
    errorMessage.style.display = "block";
    let p = document.createElement("p");
    p.innerHTML = error;
    errorMessage.appendChild(p);
})

socket.on("room-created", id => {
    playerId = 1;
    roomId = id;

    setPlayerTag(1);

    startScreen.style.display = "none";
    gameplayScreen.style.display = "block";
})

socket.on("game-rounds-set", rounds => {
    gameplay.style.pointerEvents = "auto";
    gameplay.style.opacity = "1.0";
    gameChoices.style.pointerEvents = "auto";
    gameChoices.style.opacity = "1.0";
})

socket.on("room-joined", id => {
    playerId = 2;
    roomId = id;

    playerOneConnected = true;
    playerJoinTheGame(1)
    setPlayerTag(2);
    setWaitMessage(false);

    // display rounds config input box
    // gameRoundsBox.style.display = "block";

    startScreen.style.display = "none";
    gameplayScreen.style.display = "block";

    // disable and blur player 2 until game rounds configured by player 1
    // gameplay.style.pointerEvents = "none";
    // gameplay.style.opacity = "0.5";
})

socket.on("player-1-connected", () => {
    playerJoinTheGame(1);
    playerOneConnected = true;
})

socket.on("player-2-connected", () => {
    playerJoinTheGame(2)
    playerTwoIsConnected = true
    canChoose = true;
    setWaitMessage(false);

    if(playerId === 1) {
        // display rounds config input box
        gameRoundsBox.style.display = "block";
    }
});

socket.on("player-1-disconnected", () => {
    reset()
})

socket.on("player-2-disconnected", () => {
    canChoose = false;
    playerTwoLeftTheGame()
    setWaitMessage(true);
    enemyScorePoints = 0
    myScorePoints = 0
    displayScore()
})

socket.on("draw", message => {
    setWinningMessage(message);
})

socket.on("player-1-wins", ({myChoice, enemyChoice}) => {
    if(playerId === 1){
        let message = "You choose " + myChoice + " and the enemy choose " + enemyChoice + " . So you win!";
        setWinningMessage(message);
        myScorePoints++;
    }else{
        let message = "You choose " + myChoice + " and the enemy choose " + enemyChoice + " . So you lose!";
        setWinningMessage(message);
        enemyScorePoints++;
    }

    displayScore()
})

socket.on("player-2-wins", ({myChoice, enemyChoice}) => {
    if(playerId === 2){
        let message = "You choose " + myChoice + " and the enemy choose " + enemyChoice + " . So you win!";
        setWinningMessage(message);
        myScorePoints++;
    }else{
        let message = "You choose " + myChoice + " and the enemy choose " + enemyChoice + " . So you lose!";
        setWinningMessage(message);
        enemyScorePoints++;
    }

    displayScore()
})

socket.on("game-over", (gameMessage) => {
    // console.log("Game Over!")
    gameOver = true;

    if(playerId === 1){
        if (myScorePoints == enemyScorePoints) {
            let message = "This match ended in a draw!"
            // setWinningMessage(message);
            gameOverMessage(message)
        } else if (myScorePoints > enemyScorePoints) {
            let message = "Congrats! You Won!";
            // setWinningMessage(message);
            gameOverMessage(message)
        } else {
            let message = "Sorry...You lost this match!.";
            // setWinningMessage(message);
            gameOverMessage(message)
        }
    }else{
        if (myScorePoints == enemyScorePoints) {
            let message = "This match ended in a draw!"
            // setWinningMessage(message);
            gameOverMessage(message)
        } else if (myScorePoints > enemyScorePoints) {
            let message = "Congrats! You Won!";
            // setWinningMessage(message);
            gameOverMessage(message)
        } else {
            let message = "Sorry...Your opponent Won.";
            // setWinningMessage(message);
            gameOverMessage(message)
        }
    }

    // disable choices box
    gameChoices.style.pointerEvents = "none";
    gameChoices.style.opacity = "0.5"
})

// Functions
function setPlayerTag(playerId){
    if(playerId === 1){
        playerOneTag.innerText = "You (Player 1)";
        playerTwoTag.innerText = "Opponent (Player 2)";
    }else{
        playerOneTag.innerText = "Opponent (Player 2)";
        playerTwoTag.innerText = "You (Player 1)";
    }
}

function playerJoinTheGame(playerId){
    if(playerId === 1){
        playerOne.classList.add("connected");
    }else{
        playerTwo.classList.add("connected");
    }
}

function setWaitMessage(display){
    if(display){
        let p = document.createElement("p");
        p.innerText = "Waiting for another player to join...";
        waitMessage.appendChild(p)
    }else{
        waitMessage.innerHTML = "";
    }
}

function reset(){
    canChoose = false;
    playerOneConnected = false;
    playerTwoIsConnected = false;
    startScreen.style.display = "block";
    gameplayChoices.style.display = "block";
    gameplayScreen.style.display = "none";
    joinBoxRoom.style.display = "none";
    createRoomBox.style.display = "none";
    playerTwo.classList.remove("connected");
    playerOne.classList.remove("connected");
    myScorePoints = 0
    enemyScorePoints = 0
    displayScore()
    setWaitMessage(true);
}

function playerTwoLeftTheGame(){
    playerTwoIsConnected = false;
    playerTwo.classList.remove("connected");
}

function displayScore(){
    myScore.innerText = myScorePoints;
    enemyScore.innerText = enemyScorePoints;
}

function choose(choice){
    if(choice === "rock"){
        rock.classList.add("my-choice");
    }else if(choice === "paper"){
        paper.classList.add("my-choice");
    }else{
        scissor.classList.add("my-choice");
    }

    canChoose = false;
}

function removeChoice(choice){
    if(choice === "rock"){
        rock.classList.remove("my-choice");
    }else if(choice === "paper"){
        paper.classList.remove("my-choice");
    }else{
        scissor.classList.remove("my-choice");
    }

    canChoose = true;
    myChoice = "";
}

function setWinningMessage(message){
    let p  = document.createElement("p");
    p.innerText = message;

    winMessage.appendChild(p);
    
    setTimeout(() => {
        removeChoice(myChoice)
        winMessage.innerHTML = "";
    }, 2500)
}

function gameOverMessage(message){
    let p  = document.createElement("p");
    p.innerText = message;

    gameOverMessageBox.appendChild(p);
}