const { Game } = require("./game");

class AiPlayer {
  constructor(piece, timer) {
    // The piece we are playing
    this.piece = piece;

    // The number of milliseconds available for each move
    this.timer = timer;
  }

  // Randomly simulate the remainder of the game
  _simGame(state) {
    // If the game is over, return whether or not we won
    if (state.gameOver) return state.players[state.turn % 2] === this.piece;

    // Make a random move from all the available moves
    let moves = state.availableMoves();
    state.move(moves[Math.floor(Math.random() * moves.length)]);

    return this._simGame(state);
  }

  // Simulate the game a bunch of times and choose the best-seeming move
  makeMove(state) {
    if (state.gameOver) return null;

    // All available moves
    const moves = state.availableMoves();

    // The number of wins and plays of each move
    let outcomes = [];
    for (let i = 0; i < moves.length; i++) outcomes.push([0, 0]);

    // Get the states of all the games after the moves have been applied
    let states = moves.map((choice) => {
      // Create a deep copy of the state and apply the move
      let stateCopy = state.copy();
      state.move(choice);

      return stateCopy;
    });

    // Get the start time
    const start = new Date();

    // While we still have time to simulate games
    while (new Date() - start < this.timer) {
      // Calculate all the upper confidence bounds (UCBs) of the possible moves
      let ucbs = outcomes.map((e) => {
        // If a move has never been played before, it has the highest priority
        if (!e[1]) return Infinity;

        // The win:loss ratio of the move plus a term to increase exploration
        return e[0] / e[1] + this.constant / e[1];
      });

      // Choose the max UCB
      let move = moves[ucbs.indexOf(Math.max(ucbs))];
    }

    return 0;
  }
}

module.exports = { AiPlayer };
