document.addEventListener("DOMContentLoaded", () => {
    const canvas = document.getElementById("gameCanvas");
    const ctx = canvas.getContext("2d");
    const namePrompt = document.getElementById("namePrompt");
    const nameInput = document.getElementById("nameInput");
    const startButton = document.getElementById("startButton");

    // Your Firebase configuration
    const firebaseConfig = {
        apiKey: "AIzaSyCnllqG2Q3b3ZoBcZKm7c5Ob-LUrKRTaH4",
        authDomain: "flappy-kekius.firebaseapp.com",
        databaseURL: "https://flappy-kekius-default-rtdb.europe-west1.firebasedatabase.app",
        projectId: "flappy-kekius",
        storageBucket: "flappy-kekius.firebasestorage.app",
        messagingSenderId: "454603492899",
        appId: "1:454603492899:web:6d810fd39e64c5e8a3eb96"
    };

    // Initialize Firebase
    firebase.initializeApp(firebaseConfig);
    const db = firebase.database();
    const leaderboardRef = db.ref("leaderboard");

    // Game constants
    const BASE_WIDTH = 612;
    const BASE_HEIGHT = 367;
    const GRAVITY = 0.5;
    const JUMP = -8;
    const PILLAR_WIDTH = 20;
    const PILLAR_GAP = 80;
    const PILLAR_SPEED = 4;
    const PILLAR_SPACING = 300;
    const BG_SPEED = 1.5;
    const PLAYER_SIZE = 32;
    const KEK_DURATION = 500;

    // Load images from image/ folder
    const playerImg = new Image();
    playerImg.src = "image/kekius.png"; // 156x156
    const pillarImg = new Image();
    pillarImg.src = "image/pillar.png"; // 236x600
    const coinImg = new Image();
    coinImg.src = "image/coin.png"; // 20x20
    const bgImg = new Image();
    bgImg.src = "image/rome_bg.png"; // 1224x367

    // Responsive scaling
    let scale = 1;
    function resizeCanvas() {
        const maxWidth = window.innerWidth * 0.95;
        const maxHeight = window.innerHeight * 0.95;
        scale = Math.min(maxWidth / BASE_WIDTH, maxHeight / BASE_HEIGHT);
        canvas.width = BASE_WIDTH * scale;
        canvas.height = BASE_HEIGHT * scale;
        ctx.scale(scale, scale);
    }
    window.addEventListener("resize", resizeCanvas);

    // Game objects
    let player = {
        x: 150,
        y: BASE_HEIGHT / 2,
        vel: 0,
        width: PLAYER_SIZE,
        height: PLAYER_SIZE
    };
    let pillars = [{ x: BASE_WIDTH, topHeight: Math.floor(Math.random() * (BASE_HEIGHT - PILLAR_GAP - 20)) + 20 }];
    let coins = [];
    let keks = [];
    let bgX = 0;
    let score = 0;
    let highScore = 0;
    let gameOver = false;
    let lastPillarX = BASE_WIDTH;
    let playerName = "";
    let leaderboard = []; // Store leaderboard data

    // Fetch initial leaderboard
    leaderboardRef.on("value", (snapshot) => {
        const data = snapshot.val();
        leaderboard = data ? Object.values(data) : [];
        leaderboard.sort((a, b) => b.score - a.score);
    }, (error) => {
        console.error("Leaderboard fetch error:", error);
    });

    startButton.addEventListener("click", () => {
        playerName = nameInput.value.trim() || "Anonymous";
        highScore = parseInt(localStorage.getItem(`highScore_${playerName}`)) || 0;
        namePrompt.style.display = "none";
        canvas.style.display = "block";
        resizeCanvas();
        requestAnimationFrame(gameLoop);
    });

    document.addEventListener("keydown", (e) => {
        if (e.code === "Space" && !gameOver) {
            player.vel = JUMP;
            e.preventDefault();
        } else if (e.code === "KeyR" && gameOver) {
            resetGame();
        }
    });
    canvas.addEventListener("touchstart", (e) => {
        if (!gameOver) {
            player.vel = JUMP;
        } else if (gameOver) {
            resetGame();
        }
        e.preventDefault();
    }, { passive: false });

    let lastTime = 0;
    function gameLoop(timestamp) {
        if (!lastTime) lastTime = timestamp;
        const delta = Math.min((timestamp - lastTime) / 16.67, 2);
        lastTime = timestamp;

        if (!gameOver) {
            update(delta, timestamp);
        }
        draw(timestamp);
        requestAnimationFrame(gameLoop);
    }

    function update(delta, timestamp) {
        player.vel += GRAVITY * delta;
        player.y += player.vel * delta;

        bgX -= BG_SPEED * delta;
        if (bgX <= -BASE_WIDTH) bgX = 0;

        pillars.forEach(pillar => {
            pillar.x -= PILLAR_SPEED * delta;
        });
        if (pillars[0].x < -PILLAR_WIDTH) {
            pillars.shift();
            score++;
        }
        if (lastPillarX - pillars[pillars.length - 1].x >= PILLAR_SPACING) {
            pillars.push({ x: lastPillarX, topHeight: Math.floor(Math.random() * (BASE_HEIGHT - PILLAR_GAP - 20)) + 20 });
            lastPillarX = pillars[pillars.length - 1].x;
        }

        coins.forEach(coin => {
            coin.x -= PILLAR_SPEED * delta;
        });
        coins = coins.filter(coin => coin.x > -20);
        if (Math.random() < 0.02 * delta) {
            coins.push({ x: BASE_WIDTH, y: Math.floor(Math.random() * (BASE_HEIGHT - 40)) + 20 });
        }

        keks = keks.filter(kek => timestamp < kek.expiry);

        const playerRect = { x: player.x, y: player.y, width: player.width, height: player.height };
        pillars.forEach(pillar => {
            const bottomY = pillar.topHeight + PILLAR_GAP;
            const bottomHeight = BASE_HEIGHT - bottomY;
            if (rectCollision(playerRect, { x: pillar.x, y: 0, width: PILLAR_WIDTH, height: pillar.topHeight }) ||
                rectCollision(playerRect, { x: pillar.x, y: bottomY, width: PILLAR_WIDTH, height: bottomHeight })) {
                gameOver = true;
                updateHighScoreAndLeaderboard();
            }
        });
        coins = coins.filter(coin => {
            if (rectCollision(playerRect, { x: coin.x, y: coin.y, width: 20, height: 20 })) {
                score += 5;
                keks.push({
                    x: Math.floor(Math.random() * (BASE_WIDTH - 50)),
                    y: Math.floor(Math.random() * (BASE_HEIGHT - 30)),
                    expiry: timestamp + KEK_DURATION
                });
                return false;
            }
            return true;
        });
        if (player.y < 0 || player.y + player.height > BASE_HEIGHT) {
            gameOver = true;
            updateHighScoreAndLeaderboard();
        }
    }

    function draw(timestamp) {
        ctx.clearRect(0, 0, BASE_WIDTH, BASE_HEIGHT);

        if (bgImg.complete) {
            ctx.drawImage(bgImg, bgX, 0, BASE_WIDTH * 2, BASE_HEIGHT);
            ctx.drawImage(bgImg, bgX + BASE_WIDTH, 0, BASE_WIDTH * 2, BASE_HEIGHT);
        } else {
            ctx.fillStyle = "white";
            ctx.fillRect(0, 0, BASE_WIDTH, BASE_HEIGHT);
        }

        pillars.forEach(pillar => {
            const bottomY = pillar.topHeight + PILLAR_GAP;
            const bottomHeight = BASE_HEIGHT - bottomY;
            if (pillarImg.complete) {
                ctx.drawImage(pillarImg, 0, 0, 236, 600, pillar.x, 0, PILLAR_WIDTH, pillar.topHeight);
                ctx.save();
                ctx.scale(1, -1);
                ctx.drawImage(pillarImg, 0, 0, 236, 600, pillar.x, -bottomY - bottomHeight, PILLAR_WIDTH, bottomHeight);
                ctx.restore();
            } else {
                ctx.fillStyle = "blue";
                ctx.fillRect(pillar.x, 0, PILLAR_WIDTH, pillar.topHeight);
                ctx.fillRect(pillar.x, bottomY, PILLAR_WIDTH, bottomHeight);
            }
        });

        coins.forEach(coin => {
            if (coinImg.complete) {
                ctx.drawImage(coinImg, coin.x, coin.y);
            } else {
                ctx.fillStyle = "yellow";
                ctx.fillRect(coin.x, coin.y, 20, 20);
            }
        });

        if (playerImg.complete) {
            ctx.drawImage(playerImg, player.x, player.y, PLAYER_SIZE, PLAYER_SIZE);
        } else {
            ctx.fillStyle = "green";
            ctx.fillRect(player.x, player.y, PLAYER_SIZE, PLAYER_SIZE);
        }

        ctx.fillStyle = "limegreen";
        ctx.font = "30px Arial";
        keks.forEach(kek => {
            ctx.fillText("KEK", kek.x, kek.y);
        });

        ctx.fillStyle = "red";
        ctx.font = "20px Arial";
        ctx.fillText(`Score: ${score}`, 10, 20);
        ctx.fillText(`High Score: ${highScore}`, 10, 45);

        if (gameOver) {
            ctx.fillStyle = "white";
            ctx.fillRect(BASE_WIDTH / 2 - 150, BASE_HEIGHT / 2 - 100, 300, 200);
            ctx.fillStyle = "red";
            ctx.fillText("Vae Victis! Tap or Press R to Retry", BASE_WIDTH / 2 - 140, BASE_HEIGHT / 2 - 70);
            ctx.font = "16px Arial";
            ctx.fillText("Global Leaderboard:", BASE_WIDTH / 2 - 60, BASE_HEIGHT / 2 - 40);
            leaderboard.slice(0, 5).forEach((entry, i) => {
                ctx.fillText(`${i + 1}. ${entry.name}: ${entry.score}`, BASE_WIDTH / 2 - 80, BASE_HEIGHT / 2 - 20 + i * 20);
            });
        }
    }

    function rectCollision(rect1, rect2) {
        return rect1.x < rect2.x + rect2.width &&
               rect1.x + rect1.width > rect2.x &&
               rect1.y < rect2.y + rect2.height &&
               rect1.y + rect1.height > rect2.y;
    }

    function resetGame() {
        player.y = BASE_HEIGHT / 2;
        player.vel = 0;
        pillars = [{ x: BASE_WIDTH, topHeight: Math.floor(Math.random() * (BASE_HEIGHT - PILLAR_GAP - 20)) + 20 }];
        coins = [];
        keks = [];
        score = 0;
        gameOver = false;
        lastPillarX = BASE_WIDTH;
    }

    // Function to update high score and leaderboard
    function updateHighScoreAndLeaderboard() {
        if (score > highScore) {
            highScore = score;
            localStorage.setItem(`highScore_${playerName}`, highScore);
        }
        const leaderboardEntry = { name: playerName, score: score, timestamp: Date.now() }; // Add timestamp for sorting
        leaderboardRef.push(leaderboardEntry);
    }
});
