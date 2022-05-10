const fs = require("fs");

const { Game, standardWidth, standardHeight } = require("./components/game");
const {
  RandomPlayer,
  MCTSPlayer,
  NNPlayer,
  MaxWinNNPlayer,
  MinLossNNPlayer,
} = require("./components/aiPlayers");
const { train, unfunn, toJSON } = require("./components/nn");

// Train the NN players
function trainNN(games, period = 25, file = null) {
  let game = new Game();

  // Get the neural network for the players
  let [players, nn] = [undefined, undefined];

  if (file) {
    nn = JSON.parse(fs.readFileSync(file)).nn;
  } else nn = unfunn(42, [25, 3]);

  // Train the nn for some number of games
  for (let i = 0; i <= games; i++) {
    console.log(`Game: ${i}`);

    // Let the NN play from both sides
    if (i) {
      let opponents = [
        new RandomPlayer(),
        // new NNPlayer(-1, nn),
        // new NNPlayer(-1, unfunn(42, [25, 4, 3])),
        new MCTSPlayer(-1, 500, 50),
        new MCTSPlayer(-1, 1000, 100),
        new MCTSPlayer(-1, 500, 5),
        new MCTSPlayer(-1, 500, 500),
      ];

      players = [
        new MaxWinNNPlayer(1, nn),
        opponents[Math.floor(Math.random() * opponents.length)],
      ];
    } else {
      let opponents = [
        new RandomPlayer(),
        // new NNPlayer(1, nn),
        // new NNPlayer(1, unfunn(42, [25, 4, 3])),
        new MCTSPlayer(1, 500, 50),
        new MCTSPlayer(1, 1000, 100),
        new MCTSPlayer(1, 500, 5),
        new MCTSPlayer(1, 500, 500),
      ];

      players = [
        opponents[Math.floor(Math.random() * opponents.length)],
        new MaxWinNNPlayer(-1, nn),
      ];
    }

    // The game states
    let states = [];

    // Play a game and save all the intermediary states
    while (!game.gameOver) {
      game.move(players[game.turn % 2].getMove(game));

      // Remove nesting from the board to get an acceptable input for the NN
      let input = [];
      game.board.forEach((row) => row.forEach((e) => input.push(e)));

      // Save the state data to the array
      states.push(input);
    }

    // Match the input state with the outcome of the game
    let training = states.map((state) => {
      if (game.winner > 0) return [state, [1, 0, 0]];
      else if (game.winner < 0) return [state, [0, 1, 0]];
      else return [state, [0, 0, 1]];
    });

    // Periodically save the NN
    if (!(i % period)) {
      try {
        fs.writeFileSync(`./nn${i}_.json`, JSON.stringify(toJSON(nn)));
      } catch (err) {
        console.log(err);
      }
    }

    // Train the NN on the input data generated from this game
    nn = train(nn, training, 50);

    // Reset the game
    game.reset();
  }
}

// Find the best neural network
function bestNN(nnCount) {
  let game = new Game();

  let ratios = Array(nnCount).fill(0);
  let players = undefined;

  for (let i = 0; i < nnCount; i++) {
    console.log(`NN: ${i * 100}`);

    // Play 15 games as each piece
    for (let r = 0; r < 30; r++) {
      // Let the players switch sides
      if (r % 2)
        players = [
          new MCTSPlayer(1, 500, 50),
          new MinLossNNPlayer(
            -1,
            JSON.parse(fs.readFileSync(`./nn_${i * 100}.json`)).nn
          ),
        ];
      else
        players = [
          new MinLossNNPlayer(
            1,
            JSON.parse(fs.readFileSync(`./nn_${i * 100}.json`)).nn
          ),
          new MCTSPlayer(-1, 500, 50),
        ];

      // Play a game
      while (!game.gameOver) game.move(players[game.turn % 2].getMove(game));

      // Update the ratios
      ratios[i] =
        ratios[i] + game.winner === players[(r + 1) % 2].piece
          ? 1
          : game.winner
          ? 0
          : 0.1;

      // Reset the game
      game.reset();
    }
  }

  return ratios.indexOf(Math.max(...ratios));
}

function main() {
  let game = new Game();

  // let nn = trainNN(10000, 100);

  let players = [
    new MCTSPlayer(1, 500, 50),
    // new MinLossNNPlayer(1, JSON.parse(fs.readFileSync("./nn6500_.json")).nn),
    // new NNPlayer(1, JSON.parse(fs.readFileSync("./_nn6500.json")).nn),
    // new MCTSPlayer(-1, 500, 50),
    new MinLossNNPlayer(-1, JSON.parse(fs.readFileSync("./nn6500_.json")).nn),
    // new MaxWinNNPlayer(-1, JSON.parse(fs.readFileSync("./nn10000_.json")).nn),
  ];

  while (!game.gameOver) {
    game.move(players[game.turn % 2].getMove(game));
    game.printBoard();
    console.log();
  }

  // console.log(bestNN(100));
}

main();
