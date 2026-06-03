const startScreen = document.getElementById("startScreen");
const gameScreen = document.getElementById("gameScreen");
const endScreen = document.getElementById("endScreen");

const tilt = document.getElementById("tilt");
const world = document.getElementById("world");

const startBtn = document.getElementById("startBtn");
const menuBtn = document.getElementById("menuBtn");
const settingsBtn = document.getElementById("settingsBtn");

const counter = document.getElementById("counter");
const hintTitle = document.getElementById("hintTitle");
const hintText = document.getElementById("hintText");

const puzzleModal = document.getElementById("puzzleModal");
const closeBtn = document.getElementById("closeBtn");
const puzzleType = document.getElementById("puzzleType");
const puzzleTitle = document.getElementById("puzzleTitle");
const puzzleText = document.getElementById("puzzleText");
const preview = document.getElementById("preview");
const solveBtn = document.getElementById("solveBtn");

const memoryModal = document.getElementById("memoryModal");
const memoryTitle = document.getElementById("memoryTitle");
const memoryText = document.getElementById("memoryText");
const continueBtn = document.getElementById("continueBtn");

const pathArrow = document.getElementById("pathArrow");
const mainPath = document.getElementById("mainPath");
const root = document.documentElement;

let currentStage = 0;
let activePuzzle = null;

const solved = {
  one: false,
  two: false,
  three: false
};

// Hoe lang de camera over het pad loopt na een puzzel.
// 9000 = 9 seconden. Verhoog voor langzamer, verlaag voor sneller.
const WALK_DURATION = 9000;

const pathStages = [
  {
    progress: 0.05,
    rot: "0deg",
    title: "Jungle path",
    text: "Je staat op het pad. Klik op Puzzle 1 om het eerste memory fragment vrij te spelen."
  },
  {
    progress: 0.35,
    rot: "0deg",
    title: "Verder op het pad",
    text: "Je bent verder het pad op gelopen. Klik op Puzzle 2."
  },
  {
    progress: 0.65,
    rot: "0deg",
    title: "Dieper in de jungle",
    text: "Je bent dieper in de jungle. Klik op Puzzle 3."
  },
  {
    progress: 0.92,
    rot: "0deg",
    title: "Einde van het pad",
    text: "Alle memories zijn gevonden. Klik op de pijl om af te sluiten."
  }
];

const puzzleData = {
  one: {
    stage: 0,
    type: "Jigsaw puzzle",
    title: "Solve the puzzle",
    text: "Herstel het eerste fragment. Daarna wordt de pijl op het pad vrijgespeeld.",
    previewClass: "jigsaw",
    previewHtml: Array.from({ length: 9 }).map(() => "<span></span>").join(""),
    memoryTitle: "Memory 1 unlocked",
    memoryText: "Het eerste fragment is gevonden. De route vooruit wordt zichtbaar."
  },
  two: {
    stage: 1,
    type: "Maze puzzle",
    title: "Find the path",
    text: "Los het doolhof op. Deze puzzel past bij het idee dat de gebruiker de route door de jungle ontdekt.",
    previewClass: "maze",
    previewHtml: "",
    memoryTitle: "Memory 2 unlocked",
    memoryText: "Het tweede fragment opent een langer stuk van hetzelfde junglepad."
  },
  three: {
    stage: 2,
    type: "Spot the difference",
    title: "Find the difference",
    text: "Zoek de verschillen om het laatste memory fragment vrij te spelen.",
    previewClass: "diff",
    previewHtml: "<span></span><span></span>",
    memoryTitle: "Memory 3 unlocked",
    memoryText: "Alle memories zijn gevonden. Het laatste stuk van het pad is nu open."
  }
};

function show(screen) {
  [startScreen, gameScreen, endScreen].forEach(s => s.classList.remove("active"));
  screen.classList.add("active");
}

function getPathPoint(progress) {
  const length = mainPath.getTotalLength();
  return mainPath.getPointAtLength(length * progress);
}

function setCamera(stage, walking = false) {
  const point = getPathPoint(stage.progress);
  const arrowProgress = Math.min(stage.progress + 0.12, 0.98);
  const arrowPoint = getPathPoint(arrowProgress);

  if (walking) {
    world.classList.add("walking");
    tilt.classList.add("walking");
  }

  root.style.setProperty("--cam-x", `${Math.round(point.x)}px`);
  root.style.setProperty("--cam-y", `${Math.round(point.y)}px`);
  root.style.setProperty("--cam-rot", stage.rot);

  root.style.setProperty("--arrow-x", `${Math.round(arrowPoint.x)}px`);
  root.style.setProperty("--arrow-y", `${Math.round(arrowPoint.y)}px`);

  hintTitle.textContent = stage.title;
  hintText.textContent = stage.text;

  if (walking) {
    setTimeout(() => {
      world.classList.remove("walking");
      tilt.classList.remove("walking");
    }, WALK_DURATION);
  }
}

function placePuzzleButtons() {
  const puzzlePositions = [
    { selector: ".p1", progress: 0.05, offsetX: -260, offsetY: -80 },
    { selector: ".p2", progress: 0.35, offsetX: -260, offsetY: -80 },
    { selector: ".p3", progress: 0.65, offsetX: -260, offsetY: -80 }
  ];

  puzzlePositions.forEach(item => {
    const point = getPathPoint(item.progress);
    const button = document.querySelector(item.selector);

    button.style.left = `${Math.round(point.x + item.offsetX)}px`;
    button.style.top = `${Math.round(point.y + item.offsetY)}px`;
  });
}

function reset() {
  currentStage = 0;
  activePuzzle = null;

  solved.one = false;
  solved.two = false;
  solved.three = false;

  placePuzzleButtons();

  document.querySelectorAll(".puzzle").forEach(button => {
    button.classList.add("locked");
  });

  document.querySelector('[data-puzzle="one"]').classList.remove("locked");

  pathArrow.disabled = true;
  pathArrow.querySelector("small").textContent = "Locked";

  counter.textContent = "0 / 3";

  setCamera(pathStages[0], false);
}

function updateCounter() {
  const count = Object.values(solved).filter(Boolean).length;
  counter.textContent = `${count} / 3`;
}

function openPuzzle(key) {
  const data = puzzleData[key];

  if (!data) return;
  if (data.stage !== currentStage) return;
  if (solved[key]) return;

  activePuzzle = key;

  puzzleType.textContent = data.type;
  puzzleTitle.textContent = data.title;
  puzzleText.textContent = data.text;

  if (key === "one") {
    solveBtn.style.display = "none";
    createJigsawPuzzle("images/puzzle1.jpg", 4);

  } else if (key === "two") {
    solveBtn.style.display = "none";
    createMazePuzzle();

  } else {
    solveBtn.style.display = "inline-block";
    preview.className = `puzzle-preview ${data.previewClass}`;
    preview.innerHTML = data.previewHtml;
  }

  puzzleModal.classList.remove("hidden");
}

function closePuzzle() {
  puzzleModal.classList.add("hidden");
}

function solvePuzzle() {
  if (!activePuzzle) return;

  const data = puzzleData[activePuzzle];

  solved[activePuzzle] = true;
  updateCounter();

  closePuzzle();

  memoryTitle.textContent = data.memoryTitle;
  memoryText.textContent = data.memoryText;
  memoryModal.classList.remove("hidden");

  pathArrow.disabled = false;
  pathArrow.querySelector("small").textContent = activePuzzle === "three" ? "Finish" : "Open";

  if (activePuzzle === "one") {
    hintText.textContent = "Puzzle 1 is opgelost. Klik op de pijl om over het pad naar Puzzle 2 te lopen.";
  }

  if (activePuzzle === "two") {
    hintText.textContent = "Puzzle 2 is opgelost. Klik op de pijl om verder het pad op te lopen.";
  }

  if (activePuzzle === "three") {
    hintText.textContent = "Puzzle 3 is opgelost. Klik op de pijl om het laatste stuk van het pad te volgen.";
  }
}

function closeMemory() {
  memoryModal.classList.add("hidden");
}

function followPath() {
  if (currentStage === 0 && !solved.one) return;
  if (currentStage === 1 && !solved.two) return;
  if (currentStage === 2 && !solved.three) return;

  pathArrow.disabled = true;
  pathArrow.querySelector("small").textContent = "Locked";

  if (currentStage === 3) {
    show(endScreen);
    return;
  }

  currentStage += 1;

  if (currentStage === 1) {
    document.querySelector('[data-puzzle="two"]').classList.remove("locked");
  }

  if (currentStage === 2) {
    document.querySelector('[data-puzzle="three"]').classList.remove("locked");
  }

  setCamera(pathStages[currentStage], true);

  if (currentStage === 3) {
    setTimeout(() => {
      pathArrow.disabled = false;
      pathArrow.querySelector("small").textContent = "End";
    }, WALK_DURATION);
  }
}

startBtn.addEventListener("click", () => {
  reset();
  show(gameScreen);
});

menuBtn.addEventListener("click", () => {
  reset();
  show(startScreen);
});

settingsBtn.addEventListener("click", () => {
  document.body.classList.toggle("accessible");
});

document.querySelectorAll(".puzzle").forEach(button => {
  button.addEventListener("click", () => {
    openPuzzle(button.dataset.puzzle);
  });
});

pathArrow.addEventListener("click", followPath);
closeBtn.addEventListener("click", closePuzzle);
solveBtn.addEventListener("click", solvePuzzle);
continueBtn.addEventListener("click", closeMemory);

document.addEventListener("keydown", event => {
  if (event.key === "Escape") {
    closePuzzle();
    closeMemory();
  }
});

let jigsawState = {
  size: 4,
  tiles: [],
  firstSelected: null,
  imageSrc: "images/puzzle1.jpg",
  solved: false
};

function shuffleArray(array) {
  const copy = [...array];

  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }

  return copy;
}

function isJigsawSolved() {
  return jigsawState.tiles.every((tile, index) => tile.correctIndex === index);
}

function renderJigsaw() {
  preview.className = "puzzle-preview";
  preview.innerHTML = `<div class="jigsaw-board" id="jigsawBoard"></div>`;

  const board = document.getElementById("jigsawBoard");

  jigsawState.tiles.forEach((tile, index) => {
    const tileEl = document.createElement("button");
    tileEl.className = "jigsaw-tile";
    tileEl.type = "button";

    const xPercent = (tile.col / (jigsawState.size - 1)) * 100;
    const yPercent = (tile.row / (jigsawState.size - 1)) * 100;

    tileEl.style.backgroundImage = `url(${jigsawState.imageSrc})`;
    tileEl.style.backgroundPosition = `${xPercent}% ${yPercent}%`;

    if (jigsawState.firstSelected === index) {
      tileEl.classList.add("selected");
    }

    if (tile.correctIndex === index) {
      tileEl.classList.add("correct");
    }

    tileEl.addEventListener("click", () => onJigsawTileClick(index));

    board.appendChild(tileEl);
  });
}

function onJigsawTileClick(index) {
  if (jigsawState.solved) return;

  if (jigsawState.firstSelected === null) {
    jigsawState.firstSelected = index;
    renderJigsaw();
    return;
  }

  if (jigsawState.firstSelected === index) {
    jigsawState.firstSelected = null;
    renderJigsaw();
    return;
  }

  const first = jigsawState.firstSelected;

  [jigsawState.tiles[first], jigsawState.tiles[index]] =
    [jigsawState.tiles[index], jigsawState.tiles[first]];

  jigsawState.firstSelected = null;
  renderJigsaw();

  if (isJigsawSolved()) {
    jigsawState.solved = true;

    setTimeout(() => {
      solvePuzzle();
    }, 400);
  }
}

function createJigsawPuzzle(imageSrc, size = 4) {
  jigsawState.size = size;
  jigsawState.imageSrc = imageSrc;
  jigsawState.firstSelected = null;
  jigsawState.solved = false;

  const tiles = [];

  for (let row = 0; row < size; row++) {
    for (let col = 0; col < size; col++) {
      const correctIndex = row * size + col;

      tiles.push({
        row,
        col,
        correctIndex
      });
    }
  }

  jigsawState.tiles = shuffleArray(tiles);

  while (isJigsawSolved()) {
    jigsawState.tiles = shuffleArray(tiles);
  }

  renderJigsaw();
}


let mazeState = {
  canvas: null,
  ctx: null,
  image: null,
  player: { x: 95, y: 90 },
  goal: { x: 790, y: 615 },
  playerRadius: 10,
  speed: 14,
  active: false,
  solved: false
};

function createMazePuzzle() {
  preview.className = "puzzle-preview";
  preview.innerHTML = `
    <div class="maze-wrapper">
      <canvas class="maze-canvas" id="mazeCanvas" width="900" height="675"></canvas>
      <p class="maze-info">Gebruik WASD of pijltjestoetsen. Bereik de EXIT rechtsonder.</p>

      <div class="maze-controls">
        <span class="empty"></span>
        <button type="button" data-move="up">↑</button>
        <span class="empty"></span>

        <button type="button" data-move="left">←</button>
        <button type="button" data-move="down">↓</button>
        <button type="button" data-move="right">→</button>
      </div>
    </div>
  `;

  mazeState.canvas = document.getElementById("mazeCanvas");
  mazeState.ctx = mazeState.canvas.getContext("2d");
  mazeState.player = { x: 105, y: 135 };
  mazeState.goal = { x: 785, y: 600 };
  mazeState.active = true;
  mazeState.solved = false;

  mazeState.image = new Image();
  mazeState.image.src = "images/puzzle2.png";

  mazeState.image.onload = () => {
    drawMaze();
  };

  document.querySelectorAll("[data-move]").forEach(button => {
    button.addEventListener("click", () => {
      moveMazePlayer(button.dataset.move);
    });
  });
}

function drawMaze() {
  const ctx = mazeState.ctx;
  const canvas = mazeState.canvas;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  ctx.drawImage(mazeState.image, 0, 0, canvas.width, canvas.height);

  // Goal marker
  ctx.beginPath();
  ctx.arc(mazeState.goal.x, mazeState.goal.y, 14, 0, Math.PI * 2);
  ctx.fillStyle = "rgba(255, 215, 74, 0.85)";
  ctx.fill();
  ctx.lineWidth = 3;
  ctx.strokeStyle = "#111";
  ctx.stroke();

  // Player marker
  ctx.beginPath();
  ctx.arc(mazeState.player.x, mazeState.player.y, mazeState.playerRadius, 0, Math.PI * 2);
  ctx.fillStyle = "#ffdf4d";
  ctx.fill();
  ctx.lineWidth = 3;
  ctx.strokeStyle = "#111";
  ctx.stroke();
}

function isWalkablePixel(x, y) {
  const ctx = mazeState.ctx;
  const canvas = mazeState.canvas;

  if (x < 0 || y < 0 || x >= canvas.width || y >= canvas.height) {
    return false;
  }

  const pixel = ctx.getImageData(x, y, 1, 1).data;

  const r = pixel[0];
  const g = pixel[1];
  const b = pixel[2];

  /*
    Zandpad is meestal beige/bruin:
    - rood vrij hoog
    - groen middel/hoog
    - blauw lager
    Jungle-muren zijn vooral groen:
    - groen dominant
  */

  const looksLikeSand =
    r > 105 &&
    g > 75 &&
    b < 105 &&
    r >= g - 25;

  const looksLikeStoneOrExit =
    r > 70 &&
    g > 60 &&
    b > 45 &&
    Math.abs(r - g) < 55 &&
    Math.abs(g - b) < 65;

  return looksLikeSand || looksLikeStoneOrExit;
}

function canMoveTo(x, y) {
  const radius = mazeState.playerRadius;

  const pointsToCheck = [
    { x, y },
    { x: x + radius, y },
    { x: x - radius, y },
    { x, y: y + radius },
    { x, y: y - radius }
  ];

  return pointsToCheck.every(point => isWalkablePixel(Math.round(point.x), Math.round(point.y)));
}

function moveMazePlayer(direction) {
  if (!mazeState.active || mazeState.solved) return;

  let nextX = mazeState.player.x;
  let nextY = mazeState.player.y;

  if (direction === "up") nextY -= mazeState.speed;
  if (direction === "down") nextY += mazeState.speed;
  if (direction === "left") nextX -= mazeState.speed;
  if (direction === "right") nextX += mazeState.speed;

  if (canMoveTo(nextX, nextY)) {
    mazeState.player.x = nextX;
    mazeState.player.y = nextY;
  }

  drawMaze();
  checkMazeGoal();
}

function checkMazeGoal() {
  const dx = mazeState.player.x - mazeState.goal.x;
  const dy = mazeState.player.y - mazeState.goal.y;
  const distance = Math.sqrt(dx * dx + dy * dy);

  if (distance < 32) {
    mazeState.solved = true;
    mazeState.active = false;

    setTimeout(() => {
      solvePuzzle();
    }, 500);
  }
}

document.addEventListener("keydown", event => {
  if (!mazeState.active) return;

  const key = event.key.toLowerCase();

  if (key === "arrowup" || key === "w") {
    event.preventDefault();
    moveMazePlayer("up");
  }

  if (key === "arrowdown" || key === "s") {
    event.preventDefault();
    moveMazePlayer("down");
  }

  if (key === "arrowleft" || key === "a") {
    event.preventDefault();
    moveMazePlayer("left");
  }

  if (key === "arrowright" || key === "d") {
    event.preventDefault();
    moveMazePlayer("right");
  }
});
