const { Game } = require("./game");

class AiPlayer {
  constructor(piece, timer, constant = 10) {
    // The piece we are playing
    this.piece = piece;

    // The number of milliseconds available for each move
    this.timer = timer;

    // How much the AI wants to explore its options
    this.constant = constant;
  }

  // Randomly simulate the remainder of the game
  _simGame(state) {
    // Randomly make moves until the game ends
    while (!state.gameOver) {
      let moves = state.availableMoves();

      state.move(moves[Math.floor(Math.random() * moves.length)]);
    }

    // Return the winner
    return state.winner;
  }

  // Simulate the game a bunch of times and choose the best-seeming move
  getMove(state) {
    if (state.gameOver) return null;

    // All available moves
    const moves = state.availableMoves();

    // The number of wins and plays of each move
    let outcomes = [];
    for (let i = 0; i < moves.length; i++) outcomes.push([0, 0]);

    // Get the start time
    const start = new Date();

    // While we still have time, simulate some games
    while (new Date() - start < this.timer) {
      // Calculate all the upper confidence bounds (UCBs) of the possible moves
      let ucbs = outcomes.map((e) => {
        // If a move has never been played before, it has the highest priority
        if (!e[1]) return Infinity;

        // The win:loss ratio of the move plus a term to increase exploration
        return e[0] / e[1] + this.constant / e[1];
      });

      // Choose the the move with max UCB
      let moveIndex = ucbs.indexOf(Math.max(...ucbs));

      let choice = moves[moveIndex];

      // Copy the state and apply the move to it
      let copiedGame = state.copy();
      copiedGame.move(choice);

      // Save a record of this move
      outcomes[moveIndex] = [
        outcomes[moveIndex][0] + this._simGame(copiedGame),
        outcomes[moveIndex][1] + 1,
      ];
    }

    console.log(outcomes);

    // Find the highest win:loss ratio and return that move
    let ucbs = outcomes.map((e) => e[0] / e[1]);
    console.log(ucbs);
    return moves[ucbs.indexOf(Math.max(...ucbs))];
  }
}

module.exports = { AiPlayer };
