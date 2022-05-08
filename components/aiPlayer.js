const { Game } = require("./game");

class AiPlayer {
  constructor(piece) {
    // Are we trying to maximize the value of the board or minimize it?
    this.max = piece > 0;
  }

  // Simulate the remainder of the game
  simGame(state) {}
}
