class Matrix {
  constructor(array2d) {
    this.data = array2d;
  }

  static createMatrix(width, height) {
    const matrix = [];
    while (height--) {
      matrix.push(new Array(width).fill(0));
    }
    return new Matrix(matrix);
  }

  copy() {
    const result = Matrix.createMatrix(this.data[0].length, this.data.length);
    for (let i = 0; i < this.data.length; i++) {
      for (let j = 0; j < this.data[0].length; j++) {
        result.data[i][j] = this.data[i][j];
      }
    }
    return result;
  }

  static shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
      let j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
  }

  rotate(dir) {
    for (let y = 0; y < this.data.length; ++y) {
      for (let x = 0; x < y; ++x) {
        [this.data[x][y], this.data[y][x]] = [this.data[y][x], this.data[x][y]];
      }
    }
    if (dir > 0) {
      this.data.forEach((row) => row.reverse());
    } else {
      this.data.reverse();
    }
  }

  static createPiece(type) {
    if (type === "I") {
      return new Matrix([
        [0, 1, 0, 0],
        [0, 1, 0, 0],
        [0, 1, 0, 0],
        [0, 1, 0, 0],
      ]);
    } else if (type === "L") {
      return new Matrix([
        [0, 2, 0],
        [0, 2, 0],
        [0, 2, 2],
      ]);
    } else if (type === "J") {
      return new Matrix([
        [0, 3, 0],
        [0, 3, 0],
        [3, 3, 0],
      ]);
    } else if (type === "O") {
      return new Matrix([
        [4, 4],
        [4, 4],
      ]);
    } else if (type === "Z") {
      return new Matrix([
        [5, 5, 0],
        [0, 5, 5],
        [0, 0, 0],
      ]);
    } else if (type === "S") {
      return new Matrix([
        [0, 6, 6],
        [6, 6, 0],
        [0, 0, 0],
      ]);
    } else {
      //if (type === 'T') {
      return new Matrix([
        [0, 7, 0],
        [7, 7, 7],
        [0, 0, 0],
      ]);
    }
  }
}
