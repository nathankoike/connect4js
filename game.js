const [standardWidth, standardHeight] = [7, 6];

class Game {
  constructor(width, height) {
    // Create an empty board
    this.board = [];
    for (let c = 0; c < width; c++) this.board.push(Array(height).fill(" "));

    // The players and the turn number
    this.players = ["x", "o"];
    this.turn = 0;
  }

  // Print the board to the screen
  printBoard() {
    for (let r = this.board[0].length - 1; r >= 0; r--) {
      let row = "";

      for (let c = 0; c < this.board.length; c++) row += this.board[c][r] + " ";

      console.log(row);
    }
  }

  // Determine if a move is valid
  _isMoveValid(column) {
    // Does the column still have an empty space?
    return this.board[column].indexOf(" ") >= 0;
  }

  // Determine if the game is over
  isGameOver() {
    return false;
  }

  // Place a player's piece and increment the turn count
  move(column) {
    // If the user had tried to enter an invalid move
    if (!this.isMoveValid(column)) {
      console.log("Enter a valid move\n");
      return;
    }

    // Place the user's piece in the correct column
    this.board = this.board.map((e, i) => {
      if (i === column) e[e.indexOf(" ")] = this.players[this.turn % 2];

      return e;
    });

    this.turn++;
  }
}

let x = new Game(standardWidth, standardHeight);

// x.printBoard();

x.printBoard();
