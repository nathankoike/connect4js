const { Game, standardWidth, standardHeight } = require("./components/game");
const { MctsPlayer } = require("./components/aiPlayer");

function main() {
  let game = new Game();
  let players = [new AiPlayer(1, 5000, 100), new MctsPlayer(-1, 5000, 100)];

  while (!game.gameOver) {
    game.move(players[game.turn % 2].getMove(game));
    game.printBoard();
    console.log();
  }
}

main();
