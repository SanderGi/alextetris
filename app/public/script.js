const canvas = document.getElementById("canvas");
var ratio = window.innerWidth / 140;
if(200 * ratio > window.innerHeight) {
    ratio = window.innerHeight / 200;
}
console.log("ratio: " + ratio);
canvas.width = 140 * ratio;
canvas.height = 200 *ratio;
canvas.style = "position: absolute; left: 0px; right: 0px; top: 0px; bottom: 0px; margin: auto;";
const ctx = canvas.getContext("2d");
const sprite = new Image();
sprite.src = "https://cdn.glitch.com/20c3f4c4-6061-400b-8304-49952024a213%2Fsprite.png?v=1584643186369";

let settings = {showPreview: true, showGrid: false, touchSensitivity: 70, upswipeHold: true, downSwipeHarddrop: true, smoothSprites: false, softSpeed: 8 };
if (getCookie("settings") !== "") settings = JSON.parse(getCookie("settings"));
ctx.imageSmoothingEnabled = settings.smoothSprites;

const playHeight = 20; // in 8px tiles
const playWidth = 10;
const playX = ratio * 30.5; // start coordinate of play area
const playY = ratio * 25;
let game;
const off = offset(canvas);
document.getElementById("pause").style = "background-color: grey;position: absolute; top: 10px; left: " + (off.left + canvas.width - 20.5 * ratio) + "px;" + 
  "padding: " + (4 * ratio) + "px" + (2 * ratio) + "px; font-size: " + (8 * ratio) + "px; display: block;";
document.getElementById("playAgain").style = "position: absolute; top: " + (off.top + canvas.height - 16 * ratio) + 
  "px; left: " + (off.left + canvas.width/2 - 34 * ratio) + "px; z-index: 100;" + 
  "padding: " + (4 * ratio) + "px" + (2 * ratio) + "px; font-size: " + (5 * ratio) + "px; display: none;";
// document.getElementById("rotate").style = "background-color: grey; position: absolute; top: " + (off.top + canvas.height - 14.5 * ratio) + 
//   "px; left: " + (off.left + canvas.width/2 - 28 * ratio) + "px;" + 
//   "padding: " + (4 * ratio) + "px" + (2 * ratio) + "px; font-size: " + (5 * ratio) + "px; display: none;";

function pause() {
  if (game.gameOver) { return; }
  game.paused = !game.paused;
  if (game.paused && getCookie("settings") !== "") settings = JSON.parse(getCookie("settings"));
  else setCookie("settings", JSON.stringify(settings), 7);
  if (game.paused) { document.getElementById("pause").innerHTML = "&#9658;"; DisplayPauseMenu(); }
  else { document.getElementById("pause"). innerHTML = "||"; HidePauseMenu(); }
}
document.getElementById("pause").addEventListener("click", function() {
  pause();
});
document.getElementById("pause").addEventListener("touchstart", function() {
  game.ignoreNextRotate = true;
  pause();
});
document.getElementById("playAgain").addEventListener("click", function() {
  newGame();
});
document.getElementById("playAgain").addEventListener("touchstart", function() {
  newGame();
  game.ignoreNextRotate = true;
});
// document.getElementById("rotate").addEventListener("click", function() {
//   game.playerRotate(1, false);
// });
// document.getElementById("rotate").addEventListener("touchstart", function() {
//   game.playerRotate(1, false);
//   game.ignoreNextRotate = true;
// });

sprite.onload = function() {
    // newGame();
    game = { gameOver: true, score: -1, lines: 0, lvl: 0 };
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    HidePauseMenu(); 
    document.getElementById("playAgain").style.display = "none";
    document.getElementById("item").style.display = "none";
    DrawBackground();
    DisplayScore();
    DisplayStats();
    GameOver();
}

function newGame() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    HidePauseMenu(); 
    document.getElementById("pause"). innerHTML = "||";
    document.getElementById("playAgain").style.display = "none";
    document.getElementById("item").style.display = "block";
    game = new Tetris(playWidth, playHeight);
    game.softSpeed = settings.softSpeed;
    DrawBackground();
    DisplayScore();
    DisplayStats();
    window.requestAnimationFrame(loop);
}

function GameOver() {
    clearPlayArea();
    DisplayScore();
    document.getElementById("playAgain").style.display = "block";
    document.getElementById("item").style.display = "none";
    ctx.fillStyle = "white";
    ctx.font = "bold " + (10 * ratio) + "px verdana, sans-serif";
    ctx.fillText("GAME OVER!", playX + playWidth * 4 * ratio, playY + 10 * ratio, playWidth * 8 * ratio);
    ctx.fillText("Loading Leaderboard...", playX + playWidth * 4 * ratio, playY + 20 * ratio, playWidth * 8 * ratio);
  
    DisplayLeaderboard(game.score).then((madeIt) => { // display leaderboard and enter player score if they make top 10
      if (game.score < 0) return;
      if (madeIt) {
        var recordName = prompt("New Highscore! Please enter your name", "Harry Potter");
        if (recordName != null) EnterScore(recordName, game.score);
      }
    });
    // ctx.fillText("CLICK ANYWHERE TO RESTART", playX + playWidth * 4 * ratio, playY + 157 * ratio, playWidth * 8 * ratio);
}

var timeOld = 0;
function loop(timeNew) {
    if (!game.gameOver) {
        var deltaTime = timeNew - timeOld;
    
        game.update(deltaTime);
      if (!game.paused) {
        draw();
      }
    
        timeOld = timeNew;
        window.requestAnimationFrame(loop);
    } else { GameOver(); }
}

document.addEventListener('keydown', event => {
  if (!game.gameOver && !game.paused) {
    if (event.keyCode === 37) { //left
        game.playerMove(-1, 0);
    } else if (event.keyCode === 39) { //right
        game.playerMove(1, 0);
    } else if (event.keyCode === 32) { //space
        game.hardDrop();
    } else if (event.keyCode === 81) { // q
        game.holdCurrent();
    } else if (event.keyCode === 87  || event.keyCode === 38) { // w or up
        game.playerRotate(1, false);
    } else if (event.keyCode === 40) { //down
        game.isSoftDropping = true;
    } 
  }
});

document.addEventListener('keyup', event => {
    if (event.keyCode === 40) {
        game.isSoftDropping = false;
    }
});

var dista = 0;
ontouch(document.getElementById("touchSurface"), function(evt, dir, phase, swipetype, distance, elapsedtime){
 // evt: contains original Event object
 // dir: contains "none", "left", "right", "top", or "down"
 // phase: contains "start", "move", or "end"
 // swipetype: contains "none", "left", "right", "top", or "down"
 // distance: distance traveled either horizontally or vertically, depending on dir value
 let thres = (settings.touchSensitivity > 80 ? 6 : settings.touchSensitivity < 40 ? 3 : settings.touchSensitivity < 60 ? 4 : 5) * ratio;
 if (settings.touchSensitivity > 0 && !game.paused && !game.gameOver) {
 if (phase == 'move' && dir == 'right' && distance - dista >= 8 * ratio) {
    dista = distance;
    game.playerMove(1, 0);
 } else if (phase == 'move' && dir == 'left' && -distance + dista >= 8 * ratio) {
    dista = distance;
    game.playerMove(-1, 0);
 } else if (phase == 'end' && (Math.abs(distance) < thres || ((Math.abs(dista) < thres) && (dir !== 'up' && dir !== 'down')))) {
   game.playerRotate(1, true);
   dista = 0;
 } else if (phase == 'end' && (dir == 'left' || dir == 'right')) {
   dista = 0;
 } else if (phase == 'end' && dir == 'down' && elapsedtime < 800 && (distance >= (450 - 5 * settings.touchSensitivity) || settings.touchSensitivity == 100)) {
   if (settings.downSwipeHarddrop) game.hardDrop();
 } else if (phase == 'end' && dir == 'up' && (distance <= -(450 - 5 * settings.touchSensitivity) || settings.touchSensitivity == 100)) {
   if (settings.upswipeHold) game.holdCurrent();
 }
 game.isSoftDropping = (phase == 'move' && dir == 'down' && elapsedtime > 450);
 }
 // console.log(dir + " " + phase + " " + game.ignoreNextRotate + " " + distance / ratio);
});

function draw() {
    clearPlayArea();
    if (settings.showGrid) drawGrid();
    drawMatrix(game.world.data, 0, 0);
    if (settings.showPreview) drawPreview(game.player.matrix.data, game.player.x, game.previewHardDrop());
    drawMatrix(game.player.matrix.data, game.player.x, game.player.y);
    DisplayHold();
    DisplayNext();
    DisplayScore();
    DisplayStats();
}

function drawGrid() {
    ctx.globalAlpha = 0.5;
    const tile = 8 * ratio;
    for (let i = 1; i < playHeight; i++) {
        ctx.moveTo(playX, i * tile + playY);
        ctx.lineTo(playX + playWidth * tile, i * tile + playY);
    }
    for (let i = 1; i < playWidth; i++) {
        ctx.moveTo(i * tile + playX, playY);
        ctx.lineTo(i * tile + playX, playY + playHeight * tile);
    }
    ctx.lineWidth = 1;
    ctx.strokeStyle = 'white';
    ctx.stroke();
    ctx.beginPath();
    ctx.globalAlpha = 1;
}

function clearPlayArea() {
  ctx.fillStyle = "black";
  ctx.fillRect(playX, playY, 8 * ratio * playWidth, 8 * ratio * playHeight);
}

//let settings = {showPreview: true, showGrid: false, touchSensitivity: 70, upswipeHold: true, downSwipeHarddrop: true, smoothSprites: false }; // for reference (not actual code)
function DisplayPauseMenu() {
  clearPlayArea();
  const menu = document.getElementById("pauseMenu");
  menu.style = "display: block;";
  const x = off.left + playX;
  const y = off.top + playY;
  const tile = 8 * ratio;
  
  var element = document.createElement("p");
  element.innerHTML = "PAUSE MENU";
  element.style = "position: absolute; top: " + y + "px; left: "+ (x + 7 * ratio) + "px; color: white; font: bold " + (10 * ratio) + "px sans-serif;";
  menu.appendChild(element);
  
  menu.appendChild(createCheckable(settings.showPreview, "Preview Placement:", x, (y + 1.5 * tile), 9 * tile, function(a) { settings.showPreview = a; }, 8 * ratio, ""));
  menu.appendChild(createCheckable(settings.showGrid, "Show Grid:", x, y + 3 * tile, 9 * tile, function(a) { settings.showGrid = a; }, 8 * ratio, ""));
  menu.appendChild(createCheckable(ctx.imageSmoothingEnabled, "Smooth Sprites:", x, y + 4.5 * tile, 9 * tile, function(a) { ctx.imageSmoothingEnabled = a; settings.smoothSprites = a; }, 8 * ratio, ""));

  menu.appendChild(createSlider(settings.touchSensitivity, "Touch Sensitivity: ", x, y + 6 * tile, 0, 100, 8 * ratio, function(a) { settings.touchSensitivity = a; }, ""));
  menu.appendChild(createCheckable(settings.upswipeHold, "Up-swipe to Hold:", x, y + 8.5 * tile, 9 * tile, function(a) { settings.upswipeHold = a; }, 8 * ratio, ""));
  menu.appendChild(createCheckable(settings.downSwipeHarddrop, "Down-swipe Drop:", x, y + 10 * tile, 9 * tile, function(a) { settings.downSwipeHarddrop = a; }, 8 * ratio, ""));

  // menu.appendChild(createCheckable(true, "Epic Awesome Fun:", x, y + 11.5 * tile, 9 * tile, function(a) {}, 8 * ratio, ""));
  menu.appendChild(createSlider(game.softSpeed, "Softdrop Speed: ", x, y + 11.5 * tile, 1, 50, 8 * ratio, function(a) { settings.softSpeed = a; game.softSpeed = a; }, ""));

  menu.appendChild(createButton("Advance Level", x + 10 * ratio, y + 14 * tile, "blue", function() { game.lvl++; game.lines += 10; DisplayStats(); }));
  menu.appendChild(createButton("Restart Game!", x + 10 * ratio, y + 17 * tile, "green", function() { newGame(); }));
}

function HidePauseMenu() {
  var menu = document.getElementById("pauseMenu");
  menu.style = "display: none;";
  menu.innerHTML = "";
  
  var lead = document.getElementById("leaderBoard");
  lead.style = "display: none;";
  lead.innerHTML = "";
}

function DisplayHold() {
  ctx.fillStyle = 'black';
  ctx.fillRect(2 * ratio, ratio * 39, ratio * 18.5, ratio * 18);
  if (game.hold !== null) {
    let w = ratio * 18 / game.hold.data[0].length;
    let h = ratio * 18 / game.hold.data.length;
    drawScaledMatrix(game.hold.data, 2 * ratio, ratio * 39, w, h);
  }
}

function DisplayNext() {
  ctx.fillStyle = 'black';
  ctx.fillRect(ratio * 119.5, ratio * 40, ratio * 18.5, ratio * 57);
  let w = ratio * 18;
  let h = ratio * 18;
  for (let i = 0; i < Math.min(game.queue.length, 3); i++) {
      drawScaledMatrix(game.queue[i].data, ratio * 119.5, ratio * 41 + (h + ratio) * i, w, h);
  }
}

function drawScaledMatrix(matrix, x, y, w, h) {
  let tilew = ratio * 18 / matrix[0].length;
  let tileh = ratio * 18 / matrix.length;
  for (var i = 0; i < matrix.length; i++) {
      for (var j = 0; j < matrix[0].length; j++) {
          if (matrix[i][j] > 0) {
              ctx.drawImage(sprite, 8 * (matrix[i][j] - 1), 192, 8, 8,
                              x + tilew * j, y + tileh * i, tilew, tileh);
          }
      }
  }
}

function drawPreview(matrix, x, y) {
  ctx.globalAlpha = 0.6
  //drawMatrix(matrix, x, y);
    for (var i = 0; i < matrix.length; i++) {
        for (var j = 0; j < matrix[0].length; j++) {
            if (matrix[i][j] > 0) {
                ctx.fillStyle = colors[matrix[i][j]];
                ctx.fillRect((x + j) * 8 * ratio + playX, (y + i) * 8 * ratio + playY, 8 * ratio, 8 * ratio);
            }
        }
    }
  ctx.globalAlpha = 1;
}

const colors = [
    null,
    'lightblue',
    'orange',
    'blue',
    'yellow',
    'red',
    'green',
    'purple',
];

function drawMatrix(matrix, x, y)
{
    for (var i = 0; i < matrix.length; i++) {
        for (var j = 0; j < matrix[0].length; j++) {
            if (matrix[i][j] > 0) {
                ctx.drawImage(sprite, 8 * (matrix[i][j] - 1), 192, 8, 8,
                                (x + j) * 8 * ratio + playX, (y + i) * 8 * ratio + playY, 8 * ratio, 8 * ratio);
            }
        }
    }
}

function DisplayScore() {
    //ctx.clearRect(ratio * 30.5, ratio * 5, ratio * 80, ratio * 10);
    ctx.fillStyle = "black";
    ctx.fillRect(ratio * 30.5, ratio * 5 - 1, ratio * 80, ratio * 10 + 1);
    ctx.fillStyle = "white";
    ctx.font = "bold " + (6 * ratio) + "px verdana, sans-serif";
    ctx.fillText(Math.round(game.score).toString().replace(/\B(?=(\d{3})+(?!\d))/g, " "), ratio * 70, ratio * 10, ratio * 79);
}

function DisplayStats() {
    // ctx.clearRect(ratio * 2, ratio * 97, ratio * 18, ratio * 10);
    // ctx.clearRect(ratio * 2, ratio * 115, ratio * 18, ratio * 10);
    ctx.fillStyle = "black";
    ctx.fillRect(ratio * 2, ratio * 97 - 1, ratio * 18 + 1, ratio * 10 + 2);
    ctx.fillRect(ratio * 2, ratio * 115 - 1, ratio * 18 + 1, ratio * 10 + 2);
    ctx.fillStyle = "white";
    ctx.font = (5 * ratio) + "px verdana, sans-serif";
    ctx.fillText(game.lvl, ratio * 11.25, ratio * 104, ratio * 22.5);
    ctx.fillText(game.lines, ratio * 11.25, ratio * 122, ratio * 22.5);
}

function DrawBackground() {
    ctx.font = "bold " + (6 * ratio) + "px verdana, sans-serif";
    ctx.textAlign = "center";
    ctx.fillStyle = "white";

    ctx.drawImage(sprite, 0, 0, 95, 183, ratio * 22.5, ratio * 17, ratio * 95, ratio * 183); // main play area
    ctx.drawImage(sprite, 0, 0, 95, 183, 0, ratio * 37, ratio * 22.5, ratio * 22); // hold
    ctx.fillText("HOLD", ratio * 11.25, ratio * 36, ratio * 22.5);
    ctx.drawImage(sprite, 0, 0, 95, 183, 0, ratio * 87, ratio * 22.5, ratio * 44); // level, lines
    ctx.fillText("LVL", ratio * 11.25, ratio * 95, ratio * 22.5);
    ctx.fillText("LINES", ratio * 11.25, ratio * 114, ratio * 22.5);
    ctx.drawImage(sprite, 0, 0, 95, 183, ratio * 117.5, ratio * 37, ratio * 22.5, ratio * 66); // next
    ctx.fillText("NEXT", ratio * 128.75, ratio * 36, ratio * 22.5);
    ctx.drawImage(sprite, 0, 0, 95, 183, ratio * 22.5, 0, ratio * 95, ratio * 17); // score
}

async function OldDisplayLeaderboard(youScore) {
  var entries = await GetEntries();
  clearPlayArea();
  ctx.fillStyle = "white";
  ctx.fillText("Leaderboard", playX + playWidth * 4 * ratio, playY + 10 * ratio, playWidth * 8 * ratio);
  ctx.font = "bold " + (8 * ratio) + "px verdana, sans-serif";
  var madeIt = false;
  entries.sort((a,b) => b.score - a.score);
  for (let i = 0; i < Math.min(entries.length, 14) + ((youScore > entries[Math.min(entries.length, 14) - 1].score)? 1 : 0); i++) {
    var uname = (!madeIt && youScore > entries[i].score)? "YOU" : entries[i - (madeIt ? 1 : 0)].username;
    var score = (!madeIt && youScore > entries[i].score)? youScore : entries[i - (madeIt ? 1 : 0)].score;
    if (!madeIt && youScore > entries[i].score) ctx.fillStyle = "yellow";
    else ctx.fillStyle = "white";
    ctx.textAlign = "left";
    ctx.fillText(i + 1 + ". " + uname, playX + 0.1 * ratio, playY + 10 * ratio * (i + 2), playWidth * 4 * ratio);
    ctx.textAlign = "right";
    ctx.fillText(Math.round(score).toString().replace(/\B(?=(\d{3})+(?!\d))/g, " "), 
                 playX + playWidth * 8 * ratio - 0.1 * ratio, playY + 10 * ratio * (i + 2), playWidth * 3.8 * ratio);
    madeIt = madeIt || (youScore > entries[i].score);
  } 
  ctx.textAlign = "center";
  return entries.length < 14 || madeIt;
}

let slide = false;
async function DisplayLeaderboard(youScore) {
  const menu = document.getElementById("leaderBoard");
  menu.style = "display: block;";
  var entries = await GetEntries();
  entries.sort((a,b) => b.score - a.score);
  clearPlayArea();
  const x = off.left + playX;
  const y = off.top + playY;
  const container = document.createElement("div");
  container.style = "position: absolute; left: " + x + "px; top: " + (y + 10 * ratio) + "px; height: " + (playHeight - 1.2) * 8 * ratio + "px; width: " + (playWidth)* 8 * ratio + "px; overflow: auto;";
  var element = document.createElement("p");
  element.innerHTML = "Leaderboard";
  element.style = "position: absolute; top: " + y + "px; left: "+ (x + 9 * ratio) + "px; color: white; font: bold " + (10 * ratio) + "px sans-serif;";
  menu.appendChild(element);
  
  let place = 1;
  let madeIt = false;
  for (let i = 0; i < entries.length; i++) {
    let entry = entries[i];
    if (youScore > entry.score && !madeIt) {
      madeIt = true;
      container.appendChild(CreateRow(place + ". YOU", Format(youScore), "yellow"));
      place++;
    }
    let text = place + ". " + entry.username;
    let score = Format(entry.score);
    container.appendChild(CreateRow(text, score, "white"));
    place++;
  }
  if (!madeIt && youScore >= 0) {
    container.appendChild(CreateRow(place + ". YOU", Format(youScore), "yellow"));
  }
  
  let prevY;
  let lastSpeed = 0;
  menu.addEventListener("touchstart", (e) => {
    prevY = e.touches[0].clientY;
    slide = false;
    e.preventDefault();
  });
  menu.addEventListener("touchmove", (e) => {
    container.scrollTop -= e.touches[0].clientY - prevY;
    lastSpeed = e.touches[0].clientY - prevY;
    prevY = e.touches[0].clientY;
    e.preventDefault();
  });
  menu.addEventListener("touchend", (e) => {
    slide = true;
    continueSlide(lastSpeed, container);
    e.preventDefault();
  });
  menu.appendChild(container);
  return (youScore > 3000);
}

function continueSlide(speed, element) {
  if (Math.abs(speed) < 1 || !slide) return;
  console.log("hi");
  element.scrollTop -= Math.round(speed);
  setTimeout(() => { continueSlide(speed / 1.1, element) } , 50);
}

function Format(score) {
  let inThousands = score >= 1000;
  score = Math.round(score / (inThousands? 100 : 0.1)) / 10;
  return score.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ") + (inThousands? "K" : "");
}

function CreateRow(text, score, color) {
  let row = document.createElement("div");
  row.style = "clear: both; width: 100%;";
  row.appendChild(CreateLabel(text, (7 * ratio) + "px sans-serif; float: left; width: 70%; color: " + color));
  row.appendChild(CreateLabel(score, (7 * ratio) + "px sans-serif; float: left; width: 30%; text-align: right; color: " + color));
  return row;
}

function CreateLabel(text, font) {
  var element = document.createElement("p");
  element.innerHTML = text;
  element.style = "padding-top: 0px; padding-left: 0px;  text-overflow: ellipsis; white-space: nowrap; overflow: hidden; font: " + font;
  return element;
}