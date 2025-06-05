const board = document.getElementById("board");
let grid = [];
let score = 0;
let bestScore = 0;
let previousGrid = [];
let previousScore = 0;
let undoCount = 0;
const maxUndo = 2;
let moveMadeSinceUndo = false;
let mergedTiles = [];
let previousPositions = new Map();
let newTilePositions = [];
let tileIdCounter = 0;

function savePreviousState() {
  previousGrid = grid.map(row => row.map(tile => tile ? { ...tile } : 0));
  previousScore = score;
  previousPositions.clear();
  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 4; c++) {
      const tile = grid[r][c];
      if (tile && tile.value !== 0) {
        previousPositions.set(tile.id, { r, c });
      }
    }
  }
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
  const tileSize = board.offsetWidth / 4;

  grid.flat().forEach((tileData, index) => {
    const tile = document.createElement("div");
    const r = Math.floor(index / 4);
    const c = index % 4;

    if (!tileData || tileData.value === 0) {
      tile.className = "tile empty";
      board.appendChild(tile);
      return;
    }

    const { value, id } = tileData;
    tile.className = "tile";
    tile.textContent = value;
    tile.dataset.value = value;

    if (newTilePositions.some(pos => pos.r === r && pos.c === c)) {
      tile.classList.add("pop");
    } else {
      const prev = previousPositions.get(id);
      if (prev) {
        const dx = (prev.c - c) * (tileSize + 10);
        const dy = (prev.r - r) * (tileSize + 10);
        if (dx !== 0 || dy !== 0) {
          tile.style.transform = `translate(${dx}px, ${dy}px)`;
          tile.classList.add("moving");
          requestAnimationFrame(() => {
            tile.getBoundingClientRect(); // force reflow
            tile.style.transform = "translate(0, 0)";
          });
        }
      }
    }

    if (mergedTiles.some(pos => pos.r === r && pos.c === c)) {
      tile.classList.add("bounce");
    }

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
    const newValue = Math.random() < 0.9 ? 2 : 4;
    grid[r][c] = { value: newValue, id: tileIdCounter++ };
    newTilePositions = [{ r, c }];
  } else {
    newTilePositions = [];
  }
}

function slide(row, rowIndex) {
  let arr = row.filter(tile => tile);
  let newRow = [];
  let i = 0;
  while (i < arr.length) {
    if (i + 1 < arr.length && arr[i].value === arr[i + 1].value) {
      let mergedValue = arr[i].value * 2;
      score += mergedValue;
      newRow.push({ value: mergedValue, id: tileIdCounter++ });
      mergedTiles.push({ r: rowIndex, c: newRow.length - 1 });
      i += 2;
    } else {
      newRow.push(arr[i]);
      i += 1;
    }
  }
  while (newRow.length < 4) newRow.push(0);
  return newRow;
}

function rotateClockwise(matrix) {
  return matrix[0].map((_, i) => matrix.map(row => row[i]).reverse());
}

function rotateCounterClockwise(matrix) {
  return matrix[0].map((_, i) => matrix.map(row => row[3 - i]));
}

function moveLeftGrid() {
  let moved = false;
  mergedTiles = [];
  for (let r = 0; r < 4; r++) {
    let newRow = slide(grid[r], r);
    if (!arraysEqual(grid[r], newRow)) {
      grid[r] = newRow;
      moved = true;
    }
  }
  return moved;
}

function moveRightGrid() {
  mergedTiles = [];
  grid = grid.map(row => row.reverse());
  const moved = moveLeftGrid();
  grid = grid.map(row => row.reverse());
  mergedTiles = mergedTiles.map(({ r, c }) => ({ r, c: 3 - c }));
  return moved;
}

function moveUpGrid() {
  mergedTiles = [];
  grid = rotateCounterClockwise(grid);
  const moved = moveLeftGrid();
  grid = rotateClockwise(grid);
  mergedTiles = mergedTiles.map(({ r, c }) => ({ r: c, c: r }));
  return moved;
}

function moveDownGrid() {
  mergedTiles = [];
  grid = rotateClockwise(grid);
  const moved = moveLeftGrid();
  grid = rotateCounterClockwise(grid);
  mergedTiles = mergedTiles.map(({ r, c }) => ({ r: 3 - c, c: r }));
  return moved;
}

function arraysEqual(a, b) {
  return JSON.stringify(a) === JSON.stringify(b);
}

function isGameOver() {
  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 4; c++) {
      if (!grid[r][c] || grid[r][c].value === 0) return false;
      if (c < 3 && grid[r][c].value === grid[r][c + 1]?.value) return false;
      if (r < 3 && grid[r][c].value === grid[r + 1][c]?.value) return false;
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

let touchStartX = 0;
let touchStartY = 0;
let touchEndX = 0;
let touchEndY = 0;

board.addEventListener("touchstart", e => {
  if (e.touches.length === 1) {
    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
    e.preventDefault();
  }
}, { passive: false });

board.addEventListener("touchend", e => {
  touchEndX = e.changedTouches[0].clientX;
  touchEndY = e.changedTouches[0].clientY;
  handleSwipe();
  e.preventDefault();
}, { passive: false });

function handleSwipe() {
  const dx = touchEndX - touchStartX;
  const dy = touchEndY - touchStartY;

  if (Math.abs(dx) > Math.abs(dy)) {
    if (Math.abs(dx) > 30) {
      if (dx > 0) simulateKey("ArrowRight");
      else simulateKey("ArrowLeft");
    }
  } else {
    if (Math.abs(dy) > 30) {
      if (dy > 0) simulateKey("ArrowDown");
      else simulateKey("ArrowUp");
    }
  }
}

function simulateKey(key) {
  const event = new KeyboardEvent("keydown", { key });
  window.dispatchEvent(event);
}

window.addEventListener("load", initBoard);

document.getElementById("new-game-btn").addEventListener("click", () => {
  score = 0;
  document.getElementById("score-value").textContent = score;
  document.getElementById("undo-btn").disabled = false;
  initBoard();
});

document.getElementById("undo-btn").addEventListener("click", () => {
  if (undoCount < maxUndo) {
    grid = previousGrid.map(row => row.map(tile => tile ? { ...tile } : 0));
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