const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// Game constants
const WIDTH = 612;
const HEIGHT = 367;
const GRAVITY = 0.5;
const JUMP = -8;
const PILLAR_WIDTH = 50;
const PILLAR_GAP = 160;
const PILLAR_SPEED = 4;
const BG_SPEED = 1.5;

// Load images (adjust paths to your hosted/local files)
const playerImg = new Image();
playerImg.src = "image/kekius.png"; // 60x60
const pillarImg = new Image();
pillarImg.src = "image/pillar.png"; // 50x367 (will be cropped)
const coinImg = new Image();
coinImg.src = "image/coin.png"; // 20x20
const bgImg = new Image();
bgImg.src = "image/rome_bg.png"; // 1224x367

// Game objects
let player = {
    x: 150,
    y: HEIGHT / 2,
    vel: 0,
    width: 60,
    height: 60
};
let pillars = [{ x: WIDTH, topHeight: Math.floor(Math.random() * (HEIGHT - PILLAR_GAP - 50)) + 50 }];
let coins = [];
let bgX = 0;
let score = 0;
let gameOver = false;

// Event listeners
document.addEventListener("keydown", (e) => {
    if (e.code === "Space" && !gameOver) {
        player.vel = JUMP;
    } else if (e.code === "KeyR" && gameOver) {
        resetGame();
    }
});

// Game loop
let lastTime = 0;
function gameLoop(timestamp) {
    if (!lastTime) lastTime = timestamp;
    const delta = (timestamp - lastTime) / 16.67; // Normalize to ~60 FPS
    lastTime = timestamp;

    if (!gameOver) {
        update(delta);
    }
    draw();
    requestAnimationFrame(gameLoop);
}

function update(delta) {
    // Player
    player.vel += GRAVITY * delta;
    player.y += player.vel * delta;

    // Background
    bgX -= BG_SPEED * delta;
    if (bgX <= -WIDTH) bgX = 0;

    // Pillars
    pillars.forEach(pillar => {
        pillar.x -= PILLAR_SPEED * delta;
    });
    if (pillars[0].x < -PILLAR_WIDTH) {
        pillars.shift();
        score++;
    }
    if (Math.random() < 0.01 * delta) { // ~300 frames at 60 FPS
        pillars.push({ x: WIDTH, topHeight: Math.floor(Math.random() * (HEIGHT - PILLAR_GAP - 50)) + 50 });
    }

    // Coins
    coins.forEach(coin => {
        coin.x -= PILLAR_SPEED * delta;
    });
    coins = coins.filter(coin => coin.x > -20);
    if (Math.random() < 0.02 * delta) { // ~100 frames at 60 FPS
        coins.push({ x: WIDTH, y: Math.floor(Math.random() * (HEIGHT - 80)) + 40 });
    }

    // Collisions
    const playerRect = { x: player.x, y: player.y, width: player.width, height: player.height };
    pillars.forEach(pillar => {
        const bottomY = pillar.topHeight + PILLAR_GAP;
        const bottomHeight = HEIGHT - bottomY;
        if (rectCollision(playerRect, { x: pillar.x, y: 0, width: PILLAR_WIDTH, height: pillar.topHeight }) ||
            rectCollision(playerRect, { x: pillar.x, y: bottomY, width: PILLAR_WIDTH, height: bottomHeight })) {
            gameOver = true;
        }
    });
    coins = coins.filter(coin => {
        if (rectCollision(playerRect, { x: coin.x, y: coin.y, width: 20, height: 20 })) {
            score += 5;
            return false;
        }
        return true;
    });
    if (player.y < 0 || player.y + player.height > HEIGHT) gameOver = true;
}

function draw() {
    // Background
    ctx.drawImage(bgImg, bgX, 0, WIDTH * 2, HEIGHT);
    ctx.drawImage(bgImg, bgX + WIDTH, 0, WIDTH * 2, HEIGHT);

    // Pillars
    pillars.forEach(pillar => {
        const bottomY = pillar.topHeight + PILLAR_GAP;
        const bottomHeight = HEIGHT - bottomY;
        ctx.drawImage(pillarImg, 0, 0, PILLAR_WIDTH, pillar.topHeight, pillar.x, 0, PILLAR_WIDTH, pillar.topHeight);
        ctx.drawImage(pillarImg, 0, 0, PILLAR_WIDTH, bottomHeight, pillar.x, bottomY, PILLAR_WIDTH, bottomHeight);
    });

    // Coins
    coins.forEach(coin => ctx.drawImage(coinImg, coin.x, coin.y));

    // Player
    ctx.drawImage(playerImg, player.x, player.y);

    // Score
    ctx.fillStyle = "red";
    ctx.font = "30px Arial";
    ctx.fillText(`Score: ${score}`, 10, 30);

    // Game Over
    if (gameOver) {
        ctx.fillText("Vae Victis! Press R to Retry", WIDTH / 2 - 120, HEIGHT / 2);
    }
}

function rectCollision(rect1, rect2) {
    return rect1.x < rect2.x + rect2.width &&
           rect1.x + rect1.width > rect2.x &&
           rect1.y < rect2.y + rect2.height &&
           rect1.y + rect1.height > rect2.y;
}

function resetGame() {
    player.y = HEIGHT / 2;
    player.vel = 0;
    pillars = [{ x: WIDTH, topHeight: Math.floor(Math.random() * (HEIGHT - PILLAR_GAP - 50)) + 50 }];
    coins = [];
    score = 0;
    gameOver = false;
}

// Start the game
playerImg.onload = () => requestAnimationFrame(gameLoop); // Wait for player image to load
