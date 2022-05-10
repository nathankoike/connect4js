const { Game } = require("./game");
const { predict } = require("./nn");

class RandomPlayer {
  constructor() {}

  // Return a random move
  getMove(state) {
    const moves = state.availableMoves();
    return moves[Math.floor(Math.random() * moves.length)];
  }
}

class MCTSPlayer {
  constructor(piece, timer, constant = 50) {
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

      if (copiedGame.gameOver && copiedGame.winner === this.piece)
        return choice;

      // The result of the simulated game
      let result = this._simGame(copiedGame);

      // Save a record of this move
      outcomes[moveIndex] = [
        outcomes[moveIndex][0] + result ? (result === this.piece ? 1 : -1) : 0,
        outcomes[moveIndex][1] + 1,
      ];
    }

    // Find the highest win:loss ratio and return that move
    let ucbs = outcomes.map((e) => e[0] / e[1]);

    return moves[ucbs.indexOf(Math.max(...ucbs))];
  }
}

class NNPlayer {
  constructor(piece, nn) {
    // The piece we are playing
    this.piece = piece;

    // The neural network this player uses (boardLength * boardWidth inputs)
    this.nn = nn;
  }

  // Run the board through the NN and select one move to make
  getMove(state) {
    // All available moves
    const moves = state.availableMoves();

    // Copy the state, apply all the moves to the copies, and predict the endings
    // of each game
    const predictions = moves
      .map((choice) => {
        // Copy the state and apply the move
        let game = state.copy();
        game.move(choice);

        // Return the game with the move applied
        return game;
      })
      .map((outcome) => {
        // Remove nesting from the board to get an acceptable input for the NN
        let input = [];
        outcome.board.forEach((row) => row.forEach((e) => input.push(e)));

        // Return the predicted outcome of the game
        return predict(this.nn, input);
      });

    // What is the likelihood of a loss?
    const losses = predictions.map((p) => p[this.piece > 0 ? 0 : 1]);

    // Return the position with the smallest likelihood of a loss
    return moves[losses.indexOf(Math.min(...losses))];
  }
}

class MinLossNNPlayer {
  constructor(piece, nn) {
    // The piece we are playing
    this.piece = piece;

    // The neural network this player uses (boardLength * boardWidth inputs)
    this.nn = nn;
  }

  // Run the board through the NN and select one move to make
  getMove(state) {
    // All available moves
    const moves = state.availableMoves();

    // Copy the state, apply all the moves to the copies, and predict the endings
    // of each game
    const predictions = moves
      .map((choice) => {
        // Copy the state and apply the move
        let game = state.copy();
        game.move(choice);

        // Return the game with the move applied
        return game;
      })
      .map((outcome) => {
        // Remove nesting from the board to get an acceptable input for the NN
        let input = [];
        outcome.board.forEach((row) => row.forEach((e) => input.push(e)));

        // Return the predicted outcome of the game
        return predict(this.nn, input);
      });

    // What is the likelihood of a loss?
    const losses = predictions.map((p) => p[this.piece > 0 ? 1 : 0]);

    // Return the position with the smallest likelihood of a loss
    return moves[losses.indexOf(Math.min(...losses))];
  }
}

class MaxWinNNPlayer {
  constructor(piece, nn) {
    // The piece we are playing
    this.piece = piece;

    // The neural network this player uses (boardLength * boardWidth inputs)
    this.nn = nn;
  }

  // Run the board through the NN and select one move to make
  getMove(state) {
    // All available moves
    const moves = state.availableMoves();

    // Copy the state, apply all the moves to the copies, and predict the endings
    // of each game
    const predictions = moves
      .map((choice) => {
        // Copy the state and apply the move
        let game = state.copy();
        game.move(choice);

        // Return the game with the move applied
        return game;
      })
      .map((outcome) => {
        // Remove nesting from the board to get an acceptable input for the NN
        let input = [];
        outcome.board.forEach((row) => row.forEach((e) => input.push(e)));

        // Return the predicted outcome of the game
        return predict(this.nn, input);
      });

    // What is the likelihood of a win?
    const wins = predictions.map((p) => p[this.piece > 0 ? 0 : 1]);

    // Return the position with the smallest likelihood of a loss
    return moves[wins.indexOf(Math.max(...wins))];
  }
}

module.exports = {
  RandomPlayer,
  MCTSPlayer,
  NNPlayer,
  MaxWinNNPlayer,
  MinLossNNPlayer,
};
