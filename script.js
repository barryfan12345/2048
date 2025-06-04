const board = document.getElementById("board");
let grid = [];
let score = 0;
let bestScore = 0;
let previousGrid = [];
let previousScore = 0;
let undoCount = 0;
const maxUndo = 2;
let moveMadeSinceUndo = false;



function savePreviousState() {
  previousGrid = grid.map(row => [...row]);
  previousScore = score;
}




function initBoard() {
  grid = Array(4).fill().map(() => Array(4).fill(0));
  addTile(); addTile();
  updateBoard();
  undoCount = 0;
  moveMadeSinceUndo = false;
  document.getElementById("undo-btn").disabled = true;
}

function updateBoard() {
  board.innerHTML = "";
  grid.flat().forEach(value => {
    const tile = document.createElement("div");
    tile.className = "tile";
    tile.textContent = value === 0 ? "" : value;
    tile.dataset.value = value;
    board.appendChild(tile);
  });
  document.getElementById("score-value").textContent = score;
  if (score > bestScore) {
  bestScore = score;
  document.getElementById("best-value").textContent = bestScore;
  }

}

function addTile() {
  let empty = [];
  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 4; c++) {
      if (grid[r][c] === 0) empty.push([r, c]);
    }
  }
  if (empty.length > 0) {
    let [r, c] = empty[Math.floor(Math.random() * empty.length)];
    grid[r][c] = Math.random() < 0.9 ? 2 : 4;
  }
}

function slide(row) {
  let arr = row.filter(val => val);
  for (let i = 0; i < arr.length - 1; i++) {
    if (arr[i] === arr[i + 1]) {
      arr[i] *= 2;
      score += arr[i];
      if (score > bestScore) {
        bestScore = score;
        document.getElementById("best-value").textContent = bestScore;
        localStorage.setItem("bestScore", bestScore);
      }
      arr[i + 1] = 0;
    }
  }
  return [...arr.filter(val => val), ...Array(4 - arr.filter(val => val).length).fill(0)];
}

function rotateClockwise(matrix) {
  return matrix[0].map((_, i) => matrix.map(row => row[i]).reverse());
}

function rotateCounterClockwise(matrix) {
  return matrix[0].map((_, i) => matrix.map(row => row[3 - i]));
}

function moveLeftGrid() {
  let moved = false;
  for (let r = 0; r < 4; r++) {
    let newRow = slide(grid[r]);
    if (!arraysEqual(grid[r], newRow)) {
      grid[r] = newRow;
      moved = true;
    }
  }
  return moved;
}

function moveRightGrid() {
  grid = grid.map(row => row.reverse());
  const moved = moveLeftGrid();
  grid = grid.map(row => row.reverse());
  return moved;
}

function moveUpGrid() {
  grid = rotateCounterClockwise(grid);
  const moved = moveLeftGrid();
  grid = rotateClockwise(grid);
  return moved;
}

function moveDownGrid() {
  grid = rotateClockwise(grid);
  const moved = moveLeftGrid();
  grid = rotateCounterClockwise(grid);
  return moved;
}

function arraysEqual(a, b) {
  return JSON.stringify(a) === JSON.stringify(b);
}

function isGameOver() {
  // Check for empty cell
  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 4; c++) {
      if (grid[r][c] === 0) return false;
      if (c < 3 && grid[r][c] === grid[r][c + 1]) return false;
      if (r < 3 && grid[r][c] === grid[r + 1][c]) return false;
    }
  }
  return true;
}


window.addEventListener("keydown", (e) => {
  let moved = false;
  if (["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(e.key)) {
    savePreviousState();
    if (undoCount < maxUndo) {
      document.getElementById("undo-btn").disabled = false;
    }

    moveMadeSinceUndo = true;
  }

  switch (e.key) {
    case "ArrowLeft": moved = moveLeftGrid(); break;
    case "ArrowRight": moved = moveRightGrid(); break;
    case "ArrowUp": moved = moveUpGrid(); break;
    case "ArrowDown": moved = moveDownGrid(); break;
  }

  if (moved) {
    addTile();
    updateBoard();
    if (isGameOver()) {
      setTimeout(() => alert("Game Over!"), 100);
    }
  }
});


window.addEventListener("load", initBoard);



document.getElementById("new-game-btn").addEventListener("click", () => {
  score = 0;
  document.getElementById("score-value").textContent = score;
  document.getElementById("undo-btn").disabled = false;
  initBoard();
});

document.getElementById("undo-btn").addEventListener("click", () => {
  if (undoCount < maxUndo) {
    grid = previousGrid.map(row => [...row]);
    score = previousScore;
    document.getElementById("score-value").textContent = score;
    updateBoard();
    undoCount++;
    moveMadeSinceUndo = false;
    document.getElementById("undo-btn").disabled = true;

    if (undoCount >= maxUndo) {
      document.getElementById("undo-btn").disabled = true;
    }
  }
});





