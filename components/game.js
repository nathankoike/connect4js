const [standardWidth, standardHeight] = [7, 6];

class Game {
  constructor(width = standardWidth, height = standardHeight) {
    // Create an empty board
    this.board = [];
    for (let c = 0; c < width; c++) this.board.push(Array(height).fill(0));

    // The players and the turn number
    this.players = [1, -1];
    this.turn = 0;

    // Is the game over?
    this.gameOver = false;
    this.winner = null;
  }

  // Reset the game
  reset() {
    // Reset the board
    for (let c = 0; c < this.board.length; c++)
      this.board[c] = Array(this.board[0].length).fill(" ");

    // Reset the turn counter
    this.turn = 0;
  }

  // Create a deep copy of this game
  copy() {
    let gameCopy = new Game();

    // Copy the game data
    gameCopy.board = this.board.map((e) => e.map((p) => p));
    gameCopy.turn = this.turn;
    gameCopy.gameOver = this.gameOver;

    return gameCopy;
  }

  // Determine if a move is valid
  _isMoveValid(column) {
    // Does the column still have an empty space?
    return this.board[column].indexOf(0) >= 0;
  }

  // Determine if the game is over
  _isGameOver(column) {
    // Check if there are no available moves
    if (!this.availableMoves().length) {
      this.winner = 0.5;
      return true;
    }

    // Every direction in which a player could have a match
    const dirs = [
      [1, 0],
      [0, 1],
      [1, 1],
      [-1, 1],
    ];

    // Search every direction
    for (let i = 0; i < dirs.length; i++) {
      // Find the coordinates of the placed piece
      let coords = [column, this.board[column].indexOf(0) - 1];

      // Make sure the starting coordinates are within the board
      if (coords[1] < 0) coords[1] = this.board[0].length - 1;

      // Move to one extreme of the board from the piece coordinates in the
      // current direction
      for (
        ;
        coords[0] - dirs[i][0] >= 0 &&
        coords[1] - dirs[i][1] >= 0 &&
        coords[0] < this.board.length &&
        coords[1] < this.board[0].length;
        coords = [coords[0] - dirs[i][0], coords[1] - dirs[i][1]]
      );

      // Build the string
      let line = "";

      for (
        ;
        coords[0] >= 0 &&
        coords[1] >= 0 &&
        coords[0] < this.board.length &&
        coords[1] < this.board[0].length;
        coords = [coords[0] + dirs[i][0], coords[1] + dirs[i][1]]
      )
        line += this.board[coords[0]][coords[1]].toString();

      // If the line has four in a row, we can end here
      if (line.includes(this.players[this.turn % 2].toString().repeat(4)))
        return true;
    }

    return false;
  }

  // Print the board to the screen
  printBoard() {
    for (let r = this.board[0].length - 1; r >= 0; r--) {
      let row = "";

      for (let c = 0; c < this.board.length; c++) {
        let place = this.board[c][r];

        if (place) row += (this.board[c][r] > 0 ? "x" : "o") + " ";
        else row += "  ";
      }

      console.log(row);
    }
  }

  // All available moves
  availableMoves() {
    let moves = [];

    for (let i = 0; i < this.board.length; i++)
      if (this._isMoveValid(i)) moves.push(i);

    return moves;
  }

  // Place a player's piece and increment the turn count
  move(column) {
    // If the user had tried to enter an invalid move
    if (!this._isMoveValid(column)) {
      this.printBoard();
      return;
    }

    // Place the user's piece in the correct column
    this.board = this.board.map((e, i) => {
      if (i === column) e[e.indexOf(0)] = this.players[this.turn % 2];

      return e;
    });

    if (this._isGameOver(column)) {
      console.log(`Player ${(this.turn % 2) + 1} has won!`);
      this.printBoard();
      this.gameOver = true;
      this.winner = this.turn % 2;
      return this.turn % 2;
    }

    this.turn++;
    return " ";
  }
}

module.exports = {
  Game,
  standardWidth,
  standardHeight,
};
