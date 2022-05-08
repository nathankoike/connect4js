const { Game, standardWidth, standardHeight } = require("./components/game");

function main() {
  let game = new Game();

  game.move(0);
  game.move(1);
  game.move(0);
  game.move(1);
  game.move(0);
  game.move(1);
  game.move(0);
  game.printBoard();
}

main();
