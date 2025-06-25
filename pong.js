const canvas = document.getElementById('pongCanvas');
const ctx = canvas.getContext('2d');

// Game objects
const paddleWidth = 12;
const paddleHeight = 90;
const paddleMargin = 18;
const ballRadius = 10;

let playerY = (canvas.height - paddleHeight) / 2;
let aiY = (canvas.height - paddleHeight) / 2;
let ballX = canvas.width / 2;
let ballY = canvas.height / 2;
let ballSpeedX = 6 * (Math.random() > 0.5 ? 1 : -1);
let ballSpeedY = 4 * (Math.random() * 2 - 1);

let playerScore = 0;
let aiScore = 0;

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

function resetBall() {
  ballX = canvas.width / 2;
  ballY = canvas.height / 2;
  ballSpeedX = 6 * (Math.random() > 0.5 ? 1 : -1);
  ballSpeedY = 4 * (Math.random() * 2 - 1);
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
    // Ball reflection
    let collidePoint = ballY - (playerY + paddleHeight / 2);
    let norm = collidePoint / (paddleHeight / 2);
    ballSpeedY = norm * 5;
    ballX = paddleMargin + paddleWidth + ballRadius; // Avoid sticking
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
  }

  // Score logic
  if (ballX < 0) {
    aiScore++;
    resetBall();
  } else if (ballX > canvas.width) {
    playerScore++;
    resetBall();
  }

  // AI paddle movement (basic)
  let aiCenter = aiY + paddleHeight / 2;
  if (aiCenter < ballY - 10) {
    aiY += 5;
  } else if (aiCenter > ballY + 10) {
    aiY -= 5;
  }
  // Clamp
  aiY = Math.max(0, Math.min(canvas.height - paddleHeight, aiY));
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
}

function gameLoop() {
  update();
  render();
  requestAnimationFrame(gameLoop);
}

// Mouse control for player paddle
canvas.addEventListener('mousemove', (e) => {
  const rect = canvas.getBoundingClientRect();
  // Map mouse Y to canvas Y
  playerY = e.clientY - rect.top - paddleHeight / 2;
  // Clamp
  playerY = Math.max(0, Math.min(canvas.height - paddleHeight, playerY));
});

// Start game
gameLoop();
