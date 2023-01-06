const connectedUsers = {};
const choices = {};
const moves = {
    "rock": "scissor",
    "paper": "rock",
    "scissor": "paper"
};

const initializeChoices = (roomId) => {
    choices[roomId] = ["", ""]
}

const userConnected = (userId) => {
    connectedUsers[userId] = true;
}

const makeMove = (roomId, player, choice) => {
    // console.log(`choices on function: ${choices[roomId]}`)
    if(choices[roomId]){
        choices[roomId][player - 1] = choice;
    }

    console.log(`choices on function: ${choices[roomId]}`)
}

const setGameRounds = (roomId, rounds) => {
    console.log(`roomId: ${roomId}, rounds: ${rounds}`)
    if(choices[roomId]){
        // choices[roomId] +[rounds,0];
        choices[roomId][2] = rounds;
        choices[roomId][3] = 1;
        // console.log(choices[roomId])
    }
    console.log(choices[roomId])
}

module.exports = {connectedUsers, initializeChoices, userConnected, makeMove, moves, choices, setGameRounds};