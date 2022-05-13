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

// Train a NN for the players, and save this trained NN to a file
function trainNN(games, epochs, piece, name, savePeriod = 25, file = null) {
  let game = new Game();

  // Get the neural network for the players
  let nn = file ? JSON.parse(fs.readFileSync(file)).nn : unfunn(42, [25, 3]);

  // Let the NN play some number of games
  for (let i = 0; i <= games; i++) {
    console.log(`Game: ${i}`);

    // The opponents that may be chosen for the game
    let opponents = [
      new RandomPlayer(),
      new RandomPlayer(),
      new MCTSPlayer(piece > 0 ? -1 : 1, 500, 50),
      new MCTSPlayer(piece > 0 ? -1 : 1, 500, 5),
      new MCTSPlayer(piece > 0 ? -1 : 1, 500, 500),
    ];

    // Get the players
    let players =
      piece > 0
        ? [
            new MinLossNNPlayer(piece, nn),
            opponents[Math.floor(Math.random() * opponents.length)],
          ]
        : [
            opponents[Math.floor(Math.random() * opponents.length)],
            new MinLossNNPlayer(piece, nn),
          ];

    // The board states in the game
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

    // If the game was not a win, train the NN
    // if (game.winner !== piece) {
    // Match the input state with the outcome of the game
    let training = states.map((state) => {
      if (game.winner > 0) return [state, [1, 0, 0]];
      else if (game.winner < 0) return [state, [0, 1, 0]];
      else return [state, [0, 0, 1]];
    });

    // Train the NN on the data from this game
    nn = train(nn, training, epochs);
    // }

    // Reset the game
    game.reset();

    // Periodically save the NN
    if (!(i % savePeriod)) {
      try {
        fs.writeFileSync(`./${name}${i}.json`, JSON.stringify(toJSON(nn)));
      } catch (err) {
        console.log(err);
      }
    }
  }

  return nn;
}

// Take an existing NN and train it a bit more
async function developNN(games, epochs, piece, nn) {
  let game = new Game();

  // Let the NN play some number of games
  for (let i = 0; i <= games; i++) {
    // The opponents that may be chosen for the game
    let opponents = [
      new RandomPlayer(),
      new MCTSPlayer(piece > 0 ? -1 : 1, 500, 50),
      new MCTSPlayer(piece > 0 ? -1 : 1, 500, 5),
      new MCTSPlayer(piece > 0 ? -1 : 1, 500, 500),
    ];

    // Get the players
    let players =
      piece > 0
        ? [
            new MaxWinNNPlayer(piece, nn),
            opponents[Math.floor(Math.random() * opponents.length)],
          ]
        : [
            opponents[Math.floor(Math.random() * opponents.length)],
            new MaxWinNNPlayer(piece, nn),
          ];

    // The board states in the game
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

    // Train the NN on the data from this game
    nn = train(nn, training, epochs);

    // Reset the game
    game.reset();
  }

  return nn;
}

// Generate a NN with a generated substructure
async function geneticNN(
  gens,
  popSize,
  survivors,
  inputs,
  maxLayers,
  maxN,
  epochs
) {
  // Generate a new layer
  const genLayer = () => Math.floor(Math.random() * (maxN - 1) + 1);

  // Generate a new substructure
  const genLayers = () => {
    let layers = [];

    // Generate the hidden layers
    for (
      let layerCount = Math.floor(Math.random() * maxLayers);
      layerCount;
      layerCount--
    )
      // Generate a random integer on the interval [0, 100]
      layers.push(genLayer());

    return layers;
  };

  // Mutate a population
  const mutate = (substructures) => {
    // Generate new populations from the existing ones and add some randomness
    let newLayers = [];

    // While the new layers and old layers contain fewer substructures than the
    // population size
    while (substructures.length + newLayers.length < popSize) {
      // Get a random number
      const rng = Math.random();

      let layers = [];

      // 10% of the time, generate a new substructure
      if (rng > 0.9) newLayers.push(genLayers());
      // 15% of the time, add a new layer somewhere into an existing layer
      else if (rng > 0.75) {
        // Pick a random substructure from the survivors
        let layer = substructures[Math.floor(Math.random() * survivors)];

        // Pick a random index within that substructure
        let index = Math.floor(Math.random() * layer.length);

        // Insert a new layer into the substructure...
        let newLayers = [
          ...layer.slice(0, index),
          genLayer(),
          ...layer.slice(index),
        ];

        // ... and remove the last layer if necessary before pushing
        newLayers.push(newLayers.slice(0, maxLayers));
      }
      // 15% of the time, remove a random layer from an existing NN
      else if (rng > 0.6) {
        // Pick a random substructure
        let layer = substructures[Math.floor(Math.random() * survivors)];

        // Pick a random index within that substructure
        let index = Math.floor(Math.random() * layer.length);

        // Replace the layer at the chosen index
        newLayers.push([...layer.slice(0, index), ...layer.slice(index + 1)]);
      }
      // 25% of the time, replace a random layer in an existing substructure
      else if (rng > 0.35) {
        // Pick a random substructure
        let layer = substructures[Math.floor(Math.random() * survivors)];

        // Pick a random index within that substructure
        let index = Math.floor(Math.random() * layer.length);

        // Replace the layer at the chosen index
        newLayers.push([
          ...layer.slice(0, index),
          genLayer(),
          ...layer.slice(index + 1),
        ]);
      }
      // 35% of the time, randomly fuse two existing substructures
      else {
        // Pick two random substructures
        let subs1 = substructures[Math.floor(Math.random() * survivors)];
        let subs2 = substructures[Math.floor(Math.random() * survivors)];

        // Pick a random index within each substructure
        let index1 = Math.floor(Math.random() * subs1.length);
        let index2 = Math.floor(Math.random() * subs2.length);

        // Attach the beginning of one to the end of the other
        let newSubs = [...subs1.slice(0, index1)].concat(subs2.slice(index2));

        // Randomly remove layers until the new NN is of the proper size
        while (newSubs.length > maxLayers) {
          let toDel = Math.floor(Math.random() * newSubs.length);
          newSubs = [...newSubs.slice(0, toDel), ...newSubs.slice(toDel + 1)];
        }

        // Add the new substructure to the array
        newLayers.push(newSubs);
      }
    }

    // Add the new substructures to the existing substructures and return that
    return substructures.concat(newLayers);
  };

  // Sort the substructures by performance
  const sortNNs = (layers, wins) => {
    if (layers.length < 2) return [layers, wins];

    // Sort each half independendly
    let [sorted1, wins1] = sortNNs(
      layers.slice(0, Math.floor(layers.length / 2)),
      wins.slice(0, Math.floor(wins.length / 2))
    );
    let [sorted2, wins2] = sortNNs(
      layers.slice(Math.floor(layers.length / 2)),
      wins.slice(Math.floor(wins.length / 2))
    );

    // Merge the two sorted arrays
    let [sortedNNs, sortedWins] = [[], []];

    while (sorted1.length && sorted2.length) {
      // If the number of wins in the first array is greater than the second
      if (wins1[0] > wins2[0]) {
        sortedNNs.push(sorted1.shift());
        sortedWins.push(wins1.shift());
      }
      // Otherwise remove from the second array
      else {
        sortedNNs.push(sorted2.shift());
        sortedWins.push(wins2.shift());
      }
    }

    // Add any remaining elements
    return [
      sortedNNs.concat(sorted1).concat(sorted2),
      sortedWins.concat(wins1).concat(wins2),
    ];
  };

  let game = new Game();

  // The the populations for each NN
  let [xLayers, oLayers] = [[], []];

  // Generate all members of each population
  for (let _ = 0; _ < popSize; _++) xLayers.push(genLayers());
  for (let _ = 0; _ < popSize; _++) oLayers.push(genLayers());

  // Evolve the neural network structures
  for (let i = 0; i < gens; i++) {
    console.log(`Generation: ${i}\n\tX: ${xLayers[0]}\n\tO: ${oLayers[0]}`);

    // Generate a briefly trained NN for each substructure in the populations
    let xPop = xLayers.map((layers) =>
      developNN(25, epochs, 1, unfunn(42, [...layers, 3]))
    );
    console.log("\tP1 population generated");

    let oPop = oLayers.map((layers) =>
      developNN(25, epochs, -1, unfunn(42, [...layers, 3]))
    );
    console.log("\tP2 population generated");

    // The number of wins for each population
    let [xWins, oWins] = [Array(popSize).fill(0), Array(popSize).fill(0)];

    // Make each member of each population play against every member of the
    // other population
    for (let x = 0; x < xLayers.length; x++) {
      for (let o = 0; o < oLayers.length; o++) {
        let players = [
          new MaxWinNNPlayer(1, xPop[x]),
          new MaxWinNNPlayer(-1, oPop[o]),
        ];

        while (!game.gameOver) game.move(players[game.turn % 2].getMove(game));

        // Record which one wins
        if (game.winner > 0) xWins[x] += 1;
        if (game.winner < 0) oWins[o] += 1;
        else {
          xWins[x] += 0.5;
          oWins[o] += 0.5;
        }

        // Reset the game
        game.reset();
      }
    }

    // Sort the substructures by performance
    [xLayers, _] = sortNNs(xLayers, xWins);
    [oLayers, _] = sortNNs(oLayers, oWins);

    // Save only the top performers
    xLayers = xLayers.slice(0, survivors);
    oLayers = oLayers.slice(0, survivors);

    console.log("\tMutating populations...");

    // Mutate each population
    xLayers = mutate(xLayers);
    oLayers = mutate(oLayers);
  }

  console.log("Finding best substructure");

  let [xPop, oPop] = [
    xLayers.map((layers) =>
      developNN(25, epochs, 1, unfunn(42, [...layers, 3]))
    ),
    oLayers.map((layers) =>
      developNN(25, epochs, -1, unfunn(42, [...layers, 3]))
    ),
  ];

  xPop = await Promise.all(xPop);
  oPop = await Promise.all(oPop);

  let [xWins, oWins] = [Array(popSize).fill(0), Array(popSize).fill(0)];

  for (let x = 0; x < xLayers.length; x++) {
    for (let o = 0; o < oLayers.length; o++) {
      let players = [
        new MaxWinNNPlayer(1, xPop[x]),
        new MaxWinNNPlayer(-1, oPop[o]),
      ];

      while (!game.gameOver) game.move(players[game.turn % 2].getMove(game));

      if (game.winner > 0) xWins[x] += 1;
      if (game.winner < 0) oWins[o] += 1;
      else {
        xWins[x] += 0.5;
        oWins[o] += 0.5;
      }

      game.reset();
    }
  }

  // Sort the substructures by performance
  [xLayers, _] = sortNNs(xLayers, xWins);
  [oLayers, _] = sortNNs(oLayers, oWins);

  // Return the best performing of each population
  return [xLayers[0], oLayers[0]];
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

/* =============================================================================
=================================== MAIN =======================================
============================================================================= */
async function main() {
  let game = new Game();

  // let nn = trainNN(500, 500, -1, "omin", (savePeriod = 100));

  let [xLayers, oLayers] = await geneticNN(20, 25, 5, 42, 6, 42, 100);

  let [xPlayer, oPlayer] = [
    await developNN(500, 500, 1, unfunn(42, [...xLayers, 3])),
    await developNN(500, 500, -1, unfunn(42, [...oLayers, 3])),
  ];

  let players = [
    // new MCTSPlayer(1, 100, 50),
    // new MinLossNNPlayer(1, JSON.parse(fs.readFileSync("./nn6500_.json")).nn),
    // new NNPlayer(1, JSON.parse(fs.readFileSync("./_nn6500.json")).nn),
    new MaxWinNNPlayer(1, xPlayer),
    // =========================================================================
    new MCTSPlayer(-1, 100, 50),
    // new MinLossNNPlayer(-1, JSON.parse(fs.readFileSync("./omin500.json")).nn),
    // new MaxWinNNPlayer(-1, JSON.parse(fs.readFileSync("./omax500.json")).nn),
    // new MaxWinNNPlayer(-1, JSON.parse(fs.readFileSync("./omax500.json")).nn),
  ];

  while (!game.gameOver) {
    game.move(players[game.turn % 2].getMove(game));
    game.printBoard();
    console.log();
  }

  game.reset();

  players = [
    new MCTSPlayer(1, 100, 50),
    // new MinLossNNPlayer(1, JSON.parse(fs.readFileSync("./nn6500_.json")).nn),
    // new MaxWinNNPlayer(1, JSON.parse(fs.readFileSync("./nn6500_.json")).nn),
    // new NNPlayer(1, JSON.parse(fs.readFileSync("./_nn6500.json")).nn),
    // =========================================================================
    // new MCTSPlayer(-1, 500, 50),
    // new MinLossNNPlayer(-1, JSON.parse(fs.readFileSync("./omin500.json")).nn),
    // new MaxWinNNPlayer(-1, JSON.parse(fs.readFileSync("./omax500.json")).nn),
    new MaxWinNNPlayer(-1, oPlayer),
  ];

  while (!game.gameOver) {
    game.move(players[game.turn % 2].getMove(game));
    game.printBoard();
    console.log();
  }

  // console.log(bestNN(100));
}

main();
