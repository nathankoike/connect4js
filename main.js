const { Game, standardWidth, standardHeight } = require("./components/game");
const { AiPlayer } = require("./components/aiPlayer");

function main() {
  let game = new Game();
  let p = new AiPlayer(1, 1000, 1000);

  console.log(p.getMove(game));

  // game.move(0);
  // game.move(1);
  // game.move(0);
  // game.move(1);
  // game.move(0);
  // game.move(1);
  // game.move(0);
  // game.printBoard();
}

main();
