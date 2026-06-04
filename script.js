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

const solved = { one: false, two: false, three: false };

// Houd gelijk aan --walk-duration in style.css.
const WALK_DURATION = 9000;

const pathStages = [
  { progress: 0.05, rot: "0deg", title: "Jungle path", text: "Je staat op het pad. Klik op Puzzle 1 om het eerste memory fragment vrij te spelen." },
  { progress: 0.35, rot: "0deg", title: "Verder op het pad", text: "Je bent verder het pad op gelopen. Klik op Puzzle 2." },
  { progress: 0.65, rot: "0deg", title: "Dieper in de jungle", text: "Je bent dieper in de jungle. Klik op Puzzle 3." },
  { progress: 0.92, rot: "0deg", title: "Einde van het pad", text: "Alle memories zijn gevonden. Klik op de pijl om af te sluiten." }
];

const puzzleData = {
  one: { stage: 0, type: "Jigsaw puzzle", title: "Solve the puzzle", text: "Herstel het eerste fragment. Daarna wordt de pijl op het pad vrijgespeeld.", previewClass: "jigsaw", previewHtml: "", memoryTitle: "Memory 1 unlocked", memoryText: "Het eerste fragment is gevonden. De route vooruit wordt zichtbaar." },
  two: { stage: 1, type: "Maze puzzle", title: "Find the path", text: "Los het doolhof op. Deze puzzel past bij het idee dat de gebruiker de route door de jungle ontdekt.", previewClass: "maze", previewHtml: "", memoryTitle: "Memory 2 unlocked", memoryText: "Het tweede fragment opent een langer stuk van hetzelfde junglepad." },
  three: { stage: 2, type: "Spot the difference", title: "Find the difference", text: "Zoek de verschillen om het laatste memory fragment vrij te spelen.", previewClass: "diff", previewHtml: "<span></span><span></span>", memoryTitle: "Memory 3 unlocked", memoryText: "Alle memories zijn gevonden. Het laatste stuk van het pad is nu open." }
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
  solved.one = false; solved.two = false; solved.three = false;
  placePuzzleButtons();
  document.querySelectorAll(".puzzle").forEach(button => button.classList.add("locked"));
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

/* PUZZLE 1: 4x4 JIGSAW */
let jigsawState = { size: 4, tiles: [], firstSelected: null, imageSrc: "images/puzzle1.jpg", solved: false };

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
    if (jigsawState.firstSelected === index) tileEl.classList.add("selected");
    if (tile.correctIndex === index) tileEl.classList.add("correct");
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
  [jigsawState.tiles[first], jigsawState.tiles[index]] = [jigsawState.tiles[index], jigsawState.tiles[first]];
  jigsawState.firstSelected = null;
  renderJigsaw();
  if (isJigsawSolved()) {
    jigsawState.solved = true;
    setTimeout(() => solvePuzzle(), 400);
  }
}

function createJigsawPuzzle(imageSrc, size = 4) {
  jigsawState.size = size;
  jigsawState.imageSrc = imageSrc;
  jigsawState.firstSelected = null;
  jigsawState.solved = false;
  const tiles = [];
  for (let row = 0; row < size; row++) {
    for (let col = 0; col < size; col++) tiles.push({ row, col, correctIndex: row * size + col });
  }
  jigsawState.tiles = shuffleArray(tiles);
  while (isJigsawSolved()) jigsawState.tiles = shuffleArray(tiles);
  renderJigsaw();
}

/* -------------------- PUZZLE 2: MAZE MET MUIS -------------------- */

let mazeState = {
  canvas: null,
  ctx: null,
  image: null,

  // Start en goal. Deze kun je aanpassen met de click-coords.
  start: { x: 145, y: 128 },
  player: { x: 145, y: 128 },
  goal: { x: 760, y: 548 },

  playerRadius: 11,
  active: false,
  followingMouse: false,
  solved: false
};

function createMazePuzzle() {
  preview.className = "puzzle-preview";

  preview.innerHTML = `
    <div class="maze-wrapper">
      <canvas class="maze-canvas" id="mazeCanvas" width="900" height="675"></canvas>
      <p class="maze-info">
        Beweeg met je muis over het balletje bij START en volg het pad naar de EXIT.
      </p>
    </div>
  `;

  mazeState.canvas = document.getElementById("mazeCanvas");
  mazeState.ctx = mazeState.canvas.getContext("2d", { willReadFrequently: true });

  // Zet deze later goed met de console-coördinaten
  mazeState.start = { x: 145, y: 192 };
  mazeState.player = { ...mazeState.start };
  mazeState.goal = { x: 450, y: 555 };

  mazeState.active = true;
  mazeState.followingMouse = false;
  mazeState.solved = false;

  mazeState.image = new Image();

  mazeState.image.onload = () => {
    console.log("Maze image loaded:", mazeState.image.src);
    drawMaze();
  };

  mazeState.image.onerror = () => {
    console.error("Maze image kon niet laden. Check het pad:", mazeState.image.src);

    const ctx = mazeState.ctx;
    ctx.fillStyle = "#111";
    ctx.fillRect(0, 0, mazeState.canvas.width, mazeState.canvas.height);

    ctx.fillStyle = "white";
    ctx.font = "24px Georgia";
    ctx.fillText("Maze image kon niet laden", 40, 80);
    ctx.fillText("Check: images/puzzle2.png", 40, 120);
  };

  // Zorg dat je bestand echt zo heet
  mazeState.image.src = "images/puzzle2.png";

  // Muisbesturing
  mazeState.canvas.addEventListener("mousemove", handleMazeMouseMove);
  mazeState.canvas.addEventListener("mouseleave", resetMazePlayer);

  // Debug: klik op canvas om coords te krijgen
  mazeState.canvas.addEventListener("click", getMazeClickCoords);
}

function drawMaze() {
  const ctx = mazeState.ctx;
  const canvas = mazeState.canvas;

  if (!mazeState.image || !mazeState.image.complete || mazeState.image.naturalWidth === 0) {
    console.warn("drawMaze gestopt: image is nog niet geladen of kapot.");
    return;
  }

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(mazeState.image, 0, 0, canvas.width, canvas.height);

  // Goal marker
  ctx.beginPath();
  ctx.arc(mazeState.goal.x, mazeState.goal.y, 15, 0, Math.PI * 2);
  ctx.fillStyle = "rgba(255, 215, 74, 0.75)";
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

function getCanvasMousePosition(event) {
  const canvas = mazeState.canvas;
  const rect = canvas.getBoundingClientRect();

  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;

  return {
    x: Math.round((event.clientX - rect.left) * scaleX),
    y: Math.round((event.clientY - rect.top) * scaleY)
  };
}

function handleMazeMouseMove(event) {
  if (!mazeState.active || mazeState.solved) return;

  const mouse = getCanvasMousePosition(event);

  const dxToPlayer = mouse.x - mazeState.player.x;
  const dyToPlayer = mouse.y - mazeState.player.y;
  const distanceToPlayer = Math.sqrt(dxToPlayer * dxToPlayer + dyToPlayer * dyToPlayer);

  // Eerst moet de muis het balletje aanraken voordat het gaat volgen
  if (!mazeState.followingMouse) {
    if (distanceToPlayer <= mazeState.playerRadius + 12) {
      mazeState.followingMouse = true;
    } else {
      return;
    }
  }

// Als de muis buiten het pad gaat, blijft het balletje op de laatste goede plek staan.
// Het volgt pas weer als je met je muis terug over het balletje gaat.
if (!canMoveTo(mouse.x, mouse.y)) {
  mazeState.followingMouse = false;
  drawMaze();
  return;
}

  mazeState.player.x = mouse.x;
  mazeState.player.y = mouse.y;

  drawMaze();
  checkMazeGoal();
}

function resetMazePlayer() {
  if (!mazeState.active || mazeState.solved) return;

  mazeState.followingMouse = false;
  mazeState.player = { ...mazeState.start };
  drawMaze();
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
    Pad = beige / geel / bruin.
    Muur = meestal felgroen.
    Deze check is bewust soepel, want AI-images hebben veel schaduw.
  */

  const looksLikeSand =
    r > 85 &&
    g > 55 &&
    b < 155 &&
    r >= g - 55;

  const looksLikeStone =
    r > 50 &&
    g > 40 &&
    b > 30 &&
    Math.abs(r - g) < 75 &&
    Math.abs(g - b) < 85;

  const isVeryGreen =
    g > r + 35 &&
    g > b + 35;

  return (looksLikeSand || looksLikeStone) && !isVeryGreen;
}

function canMoveTo(x, y) {
  const radius = mazeState.playerRadius;
  const checkRadius = radius * 0.65;

  const pointsToCheck = [
    { x, y },
    { x: x + checkRadius, y },
    { x: x - checkRadius, y },
    { x, y: y + checkRadius },
    { x, y: y - checkRadius }
  ];

  return pointsToCheck.every(point => {
    return isWalkablePixel(Math.round(point.x), Math.round(point.y));
  });
}

function checkMazeGoal() {
  const dx = mazeState.player.x - mazeState.goal.x;
  const dy = mazeState.player.y - mazeState.goal.y;
  const distance = Math.sqrt(dx * dx + dy * dy);

  if (distance < 34) {
    mazeState.solved = true;
    mazeState.active = false;

    setTimeout(() => {
      solvePuzzle();
    }, 500);
  }
}

/*
  DEBUG FUNCTIE:
  Klik op de maze image/canvas.
  Daarna krijg je de coords in Console.
  Gebruik deze voor start en goal.
*/
function getMazeClickCoords(event) {
  const mouse = getCanvasMousePosition(event);
  const x = mouse.x;
  const y = mouse.y;

  console.log("Maze click coords:", { x, y });

  drawMaze();

  const ctx = mazeState.ctx;

  // Rode marker op klikplek
  ctx.beginPath();
  ctx.arc(x, y, 8, 0, Math.PI * 2);
  ctx.fillStyle = "red";
  ctx.fill();
  ctx.lineWidth = 3;
  ctx.strokeStyle = "white";
  ctx.stroke();

  // Coords ook op canvas tonen
  ctx.fillStyle = "white";
  ctx.font = "18px Georgia";
  ctx.fillText(`x: ${x}, y: ${y}`, x + 12, y - 12);
}

/* -------------------- PUZZLE OPEN / SOLVE -------------------- */

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

  } else if (key === "three") {
    solveBtn.style.display = "none";
    createDifferencePuzzle();

  } else {
    solveBtn.style.display = "inline-block";
    preview.className = `puzzle-preview ${data.previewClass}`;
    preview.innerHTML = data.previewHtml;
  }

  puzzleModal.classList.remove("hidden");
}

function closePuzzle() {
  puzzleModal.classList.add("hidden");

  if (mazeState) {
    mazeState.active = false;
    mazeState.followingMouse = false;
  }

  if (diffState) {
    diffState.active = false;
  }
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

/* -------------------- EVENTS -------------------- */

startBtn.addEventListener("click", () => {
  reset();
  createJungleWalls();
  createForest();
  show(gameScreen);
});

window.addEventListener("resize", () => {
  if (gameScreen.classList.contains("active")) {
    createJungleWalls();
    createForest();
  }
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

/* -------------------- PUZZLE 3: SPOT THE DIFFERENCE -------------------- */

let diffState = {
  leftCanvas: null,
  rightCanvas: null,
  leftCtx: null,
  rightCtx: null,
  originalImage: null,
  editedImage: null,
  active: false,
  solved: false,

  /*
    Vul hier straks jouw 3 echte coords in.
    Coords krijg je door op de rechter afbeelding te klikken.
    x/y zijn gebaseerd op canvas 800x450.
  */
  differences: [
    { x: 274, y: 309, radius: 28, found: false, label: "Verschil 1" },
    { x: 623, y: 170, radius: 28, found: false, label: "Verschil 2" },
    { x: 488, y: 262, radius: 28, found: false, label: "Verschil 3" }
  ]
};

function createDifferencePuzzle() {
  preview.className = "puzzle-preview";

  preview.innerHTML = `
    <div class="diff-wrapper">
      <div class="diff-images">
        <div class="diff-panel">
          <p>Origineel</p>
          <canvas class="diff-canvas" id="diffOriginalCanvas" width="800" height="450"></canvas>
        </div>

        <div class="diff-panel">
          <p>Aangepast - klik hier</p>
          <canvas class="diff-canvas" id="diffEditedCanvas" width="800" height="450"></canvas>
        </div>
      </div>

      <p class="diff-status" id="diffStatus">Gevonden: 0 / 3</p>
    </div>
  `;

  diffState.leftCanvas = document.getElementById("diffOriginalCanvas");
  diffState.rightCanvas = document.getElementById("diffEditedCanvas");

  diffState.leftCtx = diffState.leftCanvas.getContext("2d");
  diffState.rightCtx = diffState.rightCanvas.getContext("2d");

  diffState.active = true;
  diffState.solved = false;

  diffState.differences.forEach(diff => {
    diff.found = false;
  });

  diffState.originalImage = new Image();
  diffState.editedImage = new Image();

  let loadedCount = 0;

  function onImageLoaded() {
    loadedCount++;

    if (loadedCount === 2) {
      drawDifferencePuzzle();
    }
  }

  diffState.originalImage.onload = onImageLoaded;
  diffState.editedImage.onload = onImageLoaded;

  diffState.originalImage.onerror = () => {
    console.error("Originele afbeelding kon niet laden: images/puzzle3.jpg");
  };

  diffState.editedImage.onerror = () => {
    console.error("Aangepaste afbeelding kon niet laden: images/puzzle3-1.png");
  };

  diffState.originalImage.src = "images/puzzle3.jpg";
  diffState.editedImage.src = "images/puzzle3-1.png";

  diffState.rightCanvas.addEventListener("click", handleDifferenceClick);
}

function drawDifferencePuzzle() {
  const left = diffState.leftCtx;
  const right = diffState.rightCtx;

  left.clearRect(0, 0, diffState.leftCanvas.width, diffState.leftCanvas.height);
  right.clearRect(0, 0, diffState.rightCanvas.width, diffState.rightCanvas.height);

  left.drawImage(diffState.originalImage, 0, 0, 800, 450);
  right.drawImage(diffState.editedImage, 0, 0, 800, 450);

  diffState.differences.forEach(diff => {
    if (diff.found) {
      drawDifferenceMarker(left, diff.x, diff.y);
      drawDifferenceMarker(right, diff.x, diff.y);
    }
  });

  updateDifferenceStatus();
}

function drawDifferenceMarker(ctx, x, y) {
  ctx.beginPath();
  ctx.arc(x, y, 24, 0, Math.PI * 2);
  ctx.lineWidth = 5;
  ctx.strokeStyle = "#ffd54a";
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(x, y, 6, 0, Math.PI * 2);
  ctx.fillStyle = "#ffd54a";
  ctx.fill();
  ctx.lineWidth = 2;
  ctx.strokeStyle = "#111";
  ctx.stroke();
}

function getDiffCanvasClickPosition(event) {
  const canvas = diffState.rightCanvas;
  const rect = canvas.getBoundingClientRect();

  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;

  return {
    x: Math.round((event.clientX - rect.left) * scaleX),
    y: Math.round((event.clientY - rect.top) * scaleY)
  };
}

function handleDifferenceClick(event) {
  if (!diffState.active || diffState.solved) return;

  const click = getDiffCanvasClickPosition(event);

  // Coördinaten voor jou om de juiste verschillen te bepalen
  console.log("Difference click coords:", click);

  const foundDiff = diffState.differences.find(diff => {
    if (diff.found) return false;

    const dx = click.x - diff.x;
    const dy = click.y - diff.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    return distance <= diff.radius;
  });

  if (foundDiff) {
    foundDiff.found = true;
    drawDifferencePuzzle();

    if (diffState.differences.every(diff => diff.found)) {
      diffState.solved = true;
      diffState.active = false;

      setTimeout(() => {
        solvePuzzle();
      }, 600);
    }

    return;
  }

  // Rode marker voor foute/debug click
  drawDifferencePuzzle();

  const ctx = diffState.rightCtx;
  ctx.beginPath();
  ctx.arc(click.x, click.y, 8, 0, Math.PI * 2);
  ctx.fillStyle = "red";
  ctx.fill();
  ctx.lineWidth = 3;
  ctx.strokeStyle = "white";
  ctx.stroke();

  ctx.fillStyle = "white";
  ctx.font = "18px Georgia";
  ctx.fillText(`x: ${click.x}, y: ${click.y}`, click.x + 12, click.y - 12);
}

function updateDifferenceStatus() {
  const status = document.getElementById("diffStatus");
  if (!status) return;

  const found = diffState.differences.filter(diff => diff.found).length;
  status.textContent = `Gevonden: ${found} / ${diffState.differences.length}`;
}

function createForest() {
  const forestLayer = document.getElementById("forestLayer");
  if (!forestLayer) return;

  forestLayer.innerHTML = "";

  const treeFiles = [
    "trees/tree%201.glb",
    "trees/tree%202.glb",
    "trees/tree%203.glb"
  ];

  const isMobile = window.innerWidth < 760;

  // Minder bomen, want de jungle-wall doet nu het meeste visuele werk
  const rows = isMobile ? 4 : 7;
  const treesPerRow = isMobile ? 1 : 2;

  const pathCenterX = 1600;
  const minDistanceFromPath = 760;
  const maxDistanceFromPath = 1250;

  const worldTop = 700;
  const worldBottom = 8600;
  const rowHeight = (worldBottom - worldTop) / rows;

  for (let row = 0; row < rows; row++) {
    const baseY = worldBottom - row * rowHeight;

    for (let i = 0; i < treesPerRow; i++) {
      const tree = document.createElement("model-viewer");

      const file = treeFiles[Math.floor(Math.random() * treeFiles.length)];
      const side = i % 2 === 0 ? -1 : 1;

      const yJitter = (Math.random() - 0.5) * rowHeight * 0.45;
      const xJitter = (Math.random() - 0.5) * 220;

      const distance =
        minDistanceFromPath +
        Math.random() * (maxDistanceFromPath - minDistanceFromPath);

      const x = pathCenterX + side * distance + xJitter;
      const y = baseY + yJitter;

      const depthFactor = y / worldBottom;

      const scale = isMobile
        ? 1.6 + depthFactor * 1.0 + Math.random() * 0.3
        : 2.0 + depthFactor * 1.8 + Math.random() * 0.45;

      const rot = `${Math.floor(Math.random() * 360)}deg`;

      tree.className = "tree";
      tree.setAttribute("src", file);
      tree.setAttribute("interaction-prompt", "none");
      tree.setAttribute("shadow-intensity", "0");
      tree.setAttribute("exposure", "1");

      tree.style.left = `${Math.round(x)}px`;
      tree.style.top = `${Math.round(y)}px`;
      tree.style.setProperty("--tree-scale", scale.toFixed(2));
      tree.style.setProperty("--tree-rot", rot);

      forestLayer.appendChild(tree);
    }
  }
}

function createJungleWalls() {
  const wallLayer = document.getElementById("wallLayer");
  if (!wallLayer) return;

  wallLayer.innerHTML = "";

  const isMobile = window.innerWidth < 760;

  const segmentCount = isMobile ? 4 : 7;

  const worldBottom = 8600;
  const worldTop = 1800;

  const nearLeftX = 180;
  const nearRightX = 3020;

  const farLeftX = 900;
  const farRightX = 2300;

  const rowHeight = (worldBottom - worldTop) / (segmentCount - 1);

  for (let i = 0; i < segmentCount; i++) {
    const t = i / (segmentCount - 1);
    const y = worldBottom - i * rowHeight;

    const leftX = nearLeftX + (farLeftX - nearLeftX) * t;
    const rightX = nearRightX + (farRightX - nearRightX) * t;

    const scale = isMobile
      ? 0.85 - t * 0.35
      : 1.05 - t * 0.45;

    const angle = 16 - t * 8;

    const leftWall = document.createElement("div");
    leftWall.className = "wall-segment left";
    leftWall.style.left = `${leftX}px`;
    leftWall.style.top = `${y}px`;
    leftWall.style.setProperty("--wall-scale", scale.toFixed(2));
    leftWall.style.setProperty("--wall-angle", `${angle}deg`);

    const rightWall = document.createElement("div");
    rightWall.className = "wall-segment right";
    rightWall.style.left = `${rightX}px`;
    rightWall.style.top = `${y}px`;
    rightWall.style.setProperty("--wall-scale", scale.toFixed(2));
    rightWall.style.setProperty("--wall-angle", `${-angle}deg`);

    wallLayer.appendChild(leftWall);
    wallLayer.appendChild(rightWall);
  }
}