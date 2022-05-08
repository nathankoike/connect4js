const { Game } = require("./game");

class AiPlayer {
  constructor(piece) {
    // The piece we are playing
    this.piece = piece;
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

    let states = state.availableMoves().map((move) => {});
  }
}
