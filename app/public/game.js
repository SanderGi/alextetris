class Tetris {
    constructor(width, height) {
        this.width = width;
        this.height = height;
        this.world = Matrix.createMatrix(this.width, this.height);
      
        this.hold = null;
        this.holdUsed = false;
        this.queue = [];
      
        this.player = { x: 0, y: 0, matrix: null };
        this.playerReset();

        this.score = 0;
        this.lvl = 0;
        this.lines = 0;

        this.dropCounter = 0;
        this.dropInterval = 800;
        this.softSpeed = 8;
      
        this.paused = false;
        this.gameOver = false;
        this.isSoftDropping = false;
      
        this.ignoreNextRotate = false;
    }
  
    createQueue() {
      let tetrominos = ['T','J','L','O','S','Z','I'];
      Matrix.shuffle(tetrominos);
      let quuh = [];
      for (let i = 0; i < tetrominos.length; i++)
        quuh.push(Matrix.createPiece(tetrominos[i]));
      return quuh;
    }

    holdCurrent() {
        if (this.holdUsed || this.gameOver || this.paused) { return; }
        if (this.hold == null) {
            this.hold = this.player.matrix.copy();
            this.playerReset(); // might a gameOver go undetected?
        } else {
            var temp = this.hold.copy();
            this.hold = this.player.matrix.copy();
            this.player.matrix = temp;
            this.player.y = 0;
            this.player.x = this.width / 2 - Math.round(this.player.matrix.data[0].length / 2);
        }
        this.holdUsed = true;
    }

    update(deltaTime) {
      if (this.gameOver || this.paused) { return; }
        this.lvl = Math.round(this.lines / 10);
        this.dropInterval = Math.max(720 - 43 * this.lvl, 20); // Math.max(800 - 40 * this.lvl, 50);
        if (this.softSpeed <= 0) this.softSpeed = 1;
        if (this.isSoftDropping) { this.dropInterval /= this.softSpeed; this.score += 2 * deltaTime / this.dropInterval}
        this.dropCounter += deltaTime;
        if (this.dropCounter >= this.dropInterval) {
            this.drop();
        }
    }
  
    previewHardDrop() {
      if (this.gameOver || this.paused) { return; }
      var dropHeight = this.player.y;
      var temp = this.player.y;
        while (!this.collide()) {
          this.player.y++;
            dropHeight++;
        }
      this.player.y = temp;
      return dropHeight -1;
    }

    drop() {
      if (this.gameOver || this.paused) { return; }
        this.dropCounter = 0;
        this.player.y++;
        if (this.collide()) {
            this.player.y--;
            this.mergePlayer();
            this.arenaSweep();
            this.playerReset();
        }
    }
    
    hardDrop() {
      if (this.gameOver || this.paused) { return; }
        var dropHeight = 0;
        while (!this.collide()) {
            dropHeight++;
            this.player.y++;
        }
        this.score += 3 * dropHeight * (this.lvl + 2);// 3 * dropHeight;
        this.player.y--;
        this.mergePlayer();
        this.arenaSweep();
        this.dropCounter = 0;
        this.playerReset();
    }
    
    playerMove(dx, dy) {
      if (this.gameOver || this.paused) { return; }
        this.player.x += dx;
        if (dx !== 0 && this.collide()) {
            this.player.x -= dx;
        }
        this.player.y += dy;
        if (dy !== 0 && this.collide()) {
            this.player.y -= dy;
        }
    }
    
    playerRotate(dir, ignorAble) {
      if (this.gameOver || this.paused || (this.ignoreNextRotate && ignorAble)) { this.ignoreNextRotate = false; return; }
        const pos = this.player.x;
        let offset = 1;
        this.player.matrix.rotate(dir);
        while (this.collide()) {
            this.player.x += offset;
            offset = -(offset + (offset > 0 ? 1 : -1));
            if (offset > this.player.matrix.data[0].length) {
                this.player.matrix.rotate(-dir);
                this.player.x = pos;
                return;
            }
        }
    }
    
    arenaSweep() {
      if (this.gameOver || this.paused) { return; }
        let rowCount = 0;
        outer: for (let y = this.height - 1; y > 0; --y) {
            for (let x = 0; x < this.width; ++x) {
                if (this.world.data[y][x] === 0) {
                    continue outer;
                }
            }
            const row = this.world.data.splice(y, 1)[0].fill(0); //9
            this.world.data.unshift(row);
            ++y;
            rowCount++;
            this.lines++;
        }
        this.score += (rowCount === 1) ?  100 * (this.lvl+3) : 
                    (rowCount === 2) ?  300 * (this.lvl+3) :
                    (rowCount === 3) ?  500 * (this.lvl+3) :
                    (rowCount === 4) ?  800 * (this.lvl+3.1) : 0;
    }
    
    mergePlayer() {
      if (this.gameOver || this.paused) { return; }
        for (var y = 0; y < this.player.matrix.data.length; y++) {
            for (var x = 0; x < this.player.matrix.data[0].length; x++) {
                if (this.player.matrix.data[y][x] !== 0) {
                    this.world.data[y + this.player.y][x + this.player.x] = this.player.matrix.data[y][x];
                }
            }
        }
    }
    
    playerReset() {
      if (this.gameOver || this.paused) { return; }
        this.holdUsed = false;
        // const pieces = 'TJLOSZI';
        // this.player.matrix = Matrix.createPiece(pieces[pieces.length * Math.random() | 0]);
        if (this.queue.length <= 3) { this.queue = this.queue.concat(this.createQueue()); }
        this.player.matrix = this.queue.shift();
        this.player.y = 0;
        this.player.x = this.width / 2 - Math.round(this.player.matrix.data[0].length / 2);
        if (this.collide()) {
            //this.world = Matrix.createMatrix(this.width, this.height);
            this.gameOver = true;
        }
    }
    
    collide() {
      if (this.gameOver || this.paused) { return; }
        for (let y = 0; y < this.player.matrix.data.length; ++y) {
            for (let x = 0; x < this.player.matrix.data[y].length; ++x) {
                if (this.player.matrix.data[y][x] !== 0 &&
                   (this.world.data[y + this.player.y] &&
                    this.world.data[y + this.player.y][x + this.player.x]) !== 0) {
                    return true;
                }
            }
        }
        return false;
    }
}