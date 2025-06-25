const canvas = document.getElementById('pongCanvas');
const ctx = canvas.getContext('2d');

const menu = document.getElementById('menu');
const startBtn = document.getElementById('startBtn');
const difficultySel = document.getElementById('difficulty');

const winMessage = document.getElementById('win-message');
const winText = document.getElementById('win-text');
const restartBtn = document.getElementById('restartBtn');
const soundToggle = document.getElementById('soundToggle');
const themeSelector = document.getElementById('themeSelector');

// Game objects
const paddleWidth = 12;
let paddleHeight = 90; // variable for powerup
const basePaddleHeight = 90;
const paddleMargin = 18;
const ballRadius = 10;

let playerY, aiY, ballX, ballY, ballSpeedX, ballSpeedY;
let playerScore = 0;
let aiScore = 0;
let level = 1;
let hits = 0;

let baseBallSpeed, baseAiSpeed, difficulty;
let gameRunning = false;
let soundOn = true;

// Level up every N paddle hits
const HITS_PER_LEVEL = 6;
// Score needed to win
const WIN_SCORE = 5;
let winner = null;

// Powerup variables
let powerup = { x: 0, y: 0, active: false, type: '' };
let powerupTimer = 0;

function setDifficulty(diff) {
  switch (diff) {
    case 'easy':
      baseBallSpeed = 4;
      baseAiSpeed = 3;
      break;
    case 'hard':
      baseBallSpeed = 8;
      baseAiSpeed = 7;
      break;
    case 'medium':
    default:
      baseBallSpeed = 6;
      baseAiSpeed = 5;
      break;
  }
  difficulty = diff;
}

function playSound(id) {
  if (!soundOn) return;
  const audio = document.getElementById(id);
  if (audio) {
    audio.currentTime = 0;
    audio.play();
  }
}

function drawRect(x, y, w, h, color) {
  ctx.fillStyle = color;
  ctx.fillRect(x, y, w, h);
}

function drawCircle(x, y, r, color) {
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2, false);
  ctx.fillStyle = color;
  ctx.fill();
}

function drawText(text, x, y, color, size=32) {
  ctx.fillStyle = color;
  ctx.font = `${size}px Arial`;
  ctx.fillText(text, x, y);
}

function drawLevel() {
  ctx.save();
  ctx.globalAlpha = 0.85;
  drawText(`Level: ${level}`, canvas.width/2 - 60, 40, "#ff0", 36);
  ctx.restore();
}

function resetBall() {
  ballX = canvas.width / 2;
  ballY = canvas.height / 2;
  let dir = Math.random() > 0.5 ? 1 : -1;
  ballSpeedX = baseBallSpeed * level * 0.25 * dir;
  ballSpeedY = (baseBallSpeed * 0.6 + Math.random() * 2) * (Math.random() > 0.5 ? 1 : -1);

  ballSpeedX = Math.max(3, Math.min(Math.abs(ballSpeedX), 15)) * dir;
  ballSpeedY = Math.max(2, Math.min(Math.abs(ballSpeedY), 10)) * (ballSpeedY > 0 ? 1 : -1);
}

function resetGame() {
  playerY = (canvas.height - paddleHeight) / 2;
  aiY = (canvas.height - paddleHeight) / 2;
  playerScore = 0;
  aiScore = 0;
  level = 1;
  hits = 0;
  winner = null;
  setDifficulty(difficultySel.value);
  resetBall();
  paddleHeight = basePaddleHeight;
  powerup = { x: 0, y: 0, active: false, type: '' };
  powerupTimer = 0;
}

function drawNet() {
  for (let i = 0; i < canvas.height; i += 32) {
    drawRect(canvas.width / 2 - 2, i, 4, 18, '#444');
  }
}

function spawnPowerup() {
  if (powerup.active) return;
  powerup.x = Math.random() * (canvas.width - 60) + 30;
  powerup.y = Math.random() * (canvas.height - 100) + 30;
  powerup.type = Math.random() < 0.5 ? 'bigPaddle' : 'slowBall';
  powerup.active = true;
}

function drawPowerup() {
  if (powerup.active) {
    ctx.fillStyle = powerup.type === 'bigPaddle' ? "#0ff" : "#ff0";
    ctx.beginPath();
    ctx.arc(powerup.x, powerup.y, 14, 0, Math.PI * 2);
    ctx.fill();
    ctx.font = "bold 16px Arial";
    ctx.fillStyle = "#222";
    ctx.textAlign = "center";
    ctx.fillText(powerup.type === "bigPaddle" ? "P" : "S", powerup.x, powerup.y + 6);
    ctx.textAlign = "start";
  }
}

function update() {
  // Powerup timer/spawn
  powerupTimer++;
  if (!powerup.active && powerupTimer > 300) { // every 5 seconds
    spawnPowerup();
    powerupTimer = 0;
  }

  // Ball-powerup collision
  if (
    powerup.active &&
    Math.abs(ballX - powerup.x) < ballRadius + 14 &&
    Math.abs(ballY - powerup.y) < ballRadius + 14
  ) {
    if (powerup.type === 'bigPaddle') {
      paddleHeight *= 1.5;
      setTimeout(() => { paddleHeight = basePaddleHeight; }, 5000);
    } else if (powerup.type === 'slowBall') {
      ballSpeedX *= 0.6;
      ballSpeedY *= 0.6;
      setTimeout(() => {
        ballSpeedX /= 0.6;
        ballSpeedY /= 0.6;
      }, 3000);
    }
    playSound('hitSound');
    powerup.active = false;
  }

  // Move ball
  ballX += ballSpeedX;
  ballY += ballSpeedY;

  // Top and bottom collision
  if (ballY < ballRadius || ballY > canvas.height - ballRadius) {
    ballSpeedY = -ballSpeedY;
  }

  // Left paddle collision
  if (
    ballX - ballRadius < paddleMargin + paddleWidth &&
    ballY > playerY &&
    ballY < playerY + paddleHeight
  ) {
    ballSpeedX = -ballSpeedX * 1.05;
    let collidePoint = ballY - (playerY + paddleHeight / 2);
    let norm = collidePoint / (paddleHeight / 2);
    ballSpeedY = norm * 5;
    ballX = paddleMargin + paddleWidth + ballRadius;
    hits++;
    playSound('hitSound');
    if (hits % HITS_PER_LEVEL === 0) {
      level++;
      baseBallSpeed += 0.8;
      baseAiSpeed += 0.5;
    }
  }

  // Right paddle collision (AI)
  if (
    ballX + ballRadius > canvas.width - paddleMargin - paddleWidth &&
    ballY > aiY &&
    ballY < aiY + paddleHeight
  ) {
    ballSpeedX = -ballSpeedX * 1.05;
    let collidePoint = ballY - (aiY + paddleHeight / 2);
    let norm = collidePoint / (paddleHeight / 2);
    ballSpeedY = norm * 5;
    ballX = canvas.width - paddleMargin - paddleWidth - ballRadius;
    hits++;
    playSound('hitSound');
    if (hits % HITS_PER_LEVEL === 0) {
      level++;
      baseBallSpeed += 0.8;
      baseAiSpeed += 0.5;
    }
  }

  // Score logic
  if (ballX < 0) {
    aiScore++;
    hits = 0;
    playSound('scoreSound');
    resetBall();
    paddleHeight = basePaddleHeight;
    powerup.active = false;
  } else if (ballX > canvas.width) {
    playerScore++;
    hits = 0;
    playSound('scoreSound');
    resetBall();
    paddleHeight = basePaddleHeight;
    powerup.active = false;
  }

  // AI paddle movement (difficulty adjusted)
  let aiCenter = aiY + paddleHeight / 2;
  let aiMoveSpeed = Math.min(baseAiSpeed + (level-1)*0.4, 15);
  if (aiCenter < ballY - 10) {
    aiY += aiMoveSpeed;
  } else if (aiCenter > ballY + 10) {
    aiY -= aiMoveSpeed;
  }
  aiY = Math.max(0, Math.min(canvas.height - paddleHeight, aiY));
}

function checkWin() {
  if (playerScore >= WIN_SCORE) {
    winner = "You Win!";
    playSound('winSound');
    return true;
  }
  if (aiScore >= WIN_SCORE) {
    winner = "AI Wins!";
    playSound('winSound');
    return true;
  }
  return false;
}

function render() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  drawNet();

  drawRect(paddleMargin, playerY, paddleWidth, paddleHeight, '#0ff');
  drawRect(canvas.width - paddleMargin - paddleWidth, aiY, paddleWidth, paddleHeight, '#f0f');

  drawCircle(ballX, ballY, ballRadius, '#fff');

  drawText(playerScore, canvas.width / 4, 50, '#0ff');
  drawText(aiScore, 3 * canvas.width / 4, 50, '#f0f');

  drawLevel();

  drawPowerup();
}

function gameLoop() {
  if (!gameRunning) return;
  update();
  render();
  if (checkWin()) {
    showWinMessage();
    return;
  }
  requestAnimationFrame(gameLoop);
}

// Mouse control for player paddle
canvas.addEventListener('mousemove', (e) => {
  if (!gameRunning) return;
  const rect = canvas.getBoundingClientRect();
  playerY = e.clientY - rect.top - paddleHeight / 2;
  playerY = Math.max(0, Math.min(canvas.height - paddleHeight, playerY));
});

// Touch support for mobile
canvas.addEventListener('touchmove', function(e) {
  if (!gameRunning) return;
  const rect = canvas.getBoundingClientRect();
  let touch = e.touches[0];
  playerY = touch.clientY - rect.top - paddleHeight / 2;
  playerY = Math.max(0, Math.min(canvas.height - paddleHeight, playerY));
});

// Start button
startBtn.addEventListener('click', () => {
  setDifficulty(difficultySel.value);
  resetGame();
  menu.style.display = 'none';
  canvas.style.display = 'block';
  winMessage.style.display = 'none';
  gameRunning = true;
  gameLoop();
});

// Restart button
restartBtn.addEventListener('click', () => {
  setDifficulty(difficultySel.value);
  resetGame();
  menu.style.display = 'none';
  canvas.style.display = 'block';
  winMessage.style.display = 'none';
  gameRunning = true;
  gameLoop();
});

function showWinMessage() {
  gameRunning = false;
  winText.textContent = winner;
  winMessage.style.display = 'block';
  canvas.style.display = 'block';
  menu.style.display = 'none';
}

// Optional: restart game on R key
document.addEventListener('keydown', (e) => {
  if (!gameRunning && e.key.toLowerCase() === 'r') {
    setDifficulty(difficultySel.value);
    resetGame();
    menu.style.display = 'none';
    canvas.style.display = 'block';
    winMessage.style.display = 'none';
    gameRunning = true;
    gameLoop();
  }
});

// Sound Toggle
soundToggle.addEventListener('change', function() {
  soundOn = this.checked;
});

// Theme Selector
themeSelector.addEventListener('change', function() {
  document.body.className = '';
  canvas.className = '';
  if (this.value !== 'default') {
    document.body.classList.add('theme-' + this.value);
    canvas.classList.add('theme-' + this.value);
  }
});

// Show menu on load
menu.style.display = 'block';
canvas.style.display = 'none';
winMessage.style.display = 'none';
