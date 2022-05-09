const fs = require("fs");

const { Game, standardWidth, standardHeight } = require("./components/game");
const {
  RandomPlayer,
  MCTSPlayer,
  NNPlayer,
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
        new NNPlayer(1, nn),
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
        new NNPlayer(-1, nn),
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
        fs.writeFileSync(`./_nn${i}.json`, JSON.stringify(toJSON(nn)));
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

function main() {
  let game = new Game();

  let nn = trainNN(10000, 100);

  // let players = [new MCTSPlayer(1, 3000, 300), new MCTSPlayer(-1, 3000, 3)];

  let players = [
    new MCTSPlayer(1, 1500, 100),
    // new NNPlayer(1, JSON.parse(fs.readFileSync("./_nn100.json")).nn),
    new NNPlayer(-1, JSON.parse(fs.readFileSync("./_nn100.json")).nn),
  ];

  while (!game.gameOver) {
    game.move(players[game.turn % 2].getMove(game));
    game.printBoard();
    console.log();
  }
}

main();
