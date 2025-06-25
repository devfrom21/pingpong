const canvas = document.getElementById('pongCanvas');
const ctx = canvas.getContext('2d');

const menu = document.getElementById('menu');
const startBtn = document.getElementById('startBtn');
const difficultySel = document.getElementById('difficulty');

const winMessage = document.getElementById('win-message');
const winText = document.getElementById('win-text');
const restartBtn = document.getElementById('restartBtn');

// Game objects
const paddleWidth = 12;
const paddleHeight = 90;
const paddleMargin = 18;
const ballRadius = 10;

let playerY, aiY, ballX, ballY, ballSpeedX, ballSpeedY;
let playerScore = 0;
let aiScore = 0;
let level = 1;
let hits = 0;

let baseBallSpeed, baseAiSpeed, difficulty;
let gameRunning = false;

// Level up every N paddle hits
const HITS_PER_LEVEL = 6;
// Score needed to win
const WIN_SCORE = 5;
let winner = null;

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
  // Draw at top center
  ctx.save();
  ctx.globalAlpha = 0.85;
  drawText(`Level: ${level}`, canvas.width/2 - 60, 40, "#ff0", 36);
  ctx.restore();
}

function resetBall() {
  ballX = canvas.width / 2;
  ballY = canvas.height / 2;
  // Ball direction alternates
  let dir = Math.random() > 0.5 ? 1 : -1;
  ballSpeedX = baseBallSpeed * level * 0.25 * dir;
  ballSpeedY = (baseBallSpeed * 0.6 + Math.random() * 2) * (Math.random() > 0.5 ? 1 : -1);

  // Limit speeds
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
}

function drawNet() {
  for (let i = 0; i < canvas.height; i += 32) {
    drawRect(canvas.width / 2 - 2, i, 4, 18, '#444');
  }
}

function update() {
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
    // Level up
    if (hits % HITS_PER_LEVEL === 0) {
      level++;
      // Slightly increase ball and AI speed
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
    // Level up
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
    resetBall();
  } else if (ballX > canvas.width) {
    playerScore++;
    hits = 0;
    resetBall();
  }

  // AI paddle movement (difficulty adjusted)
  let aiCenter = aiY + paddleHeight / 2;
  let aiMoveSpeed = Math.min(baseAiSpeed + (level-1)*0.4, 15);
  if (aiCenter < ballY - 10) {
    aiY += aiMoveSpeed;
  } else if (aiCenter > ballY + 10) {
    aiY -= aiMoveSpeed;
  }
  // Clamp
  aiY = Math.max(0, Math.min(canvas.height - paddleHeight, aiY));
}

function checkWin() {
  if (playerScore >= WIN_SCORE) {
    winner = "You Win!";
    return true;
  }
  if (aiScore >= WIN_SCORE) {
    winner = "AI Wins!";
    return true;
  }
  return false;
}

function render() {
  // Clear
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  drawNet();

  // Draw paddles
  drawRect(paddleMargin, playerY, paddleWidth, paddleHeight, '#0ff');
  drawRect(canvas.width - paddleMargin - paddleWidth, aiY, paddleWidth, paddleHeight, '#f0f');

  // Draw ball
  drawCircle(ballX, ballY, ballRadius, '#fff');

  // Draw scores
  drawText(playerScore, canvas.width / 4, 50, '#0ff');
  drawText(aiScore, 3 * canvas.width / 4, 50, '#f0f');

  // Draw level
  drawLevel();
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

startBtn.addEventListener('click', () => {
  setDifficulty(difficultySel.value);
  resetGame();
  menu.style.display = 'none';
  canvas.style.display = 'block';
  winMessage.style.display = 'none';
  gameRunning = true;
  gameLoop();
});

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

// Show menu on load
menu.style.display = 'block';
canvas.style.display = 'none';
winMessage.style.display = 'none';

// Start game
gameLoop();
