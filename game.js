// Log the start of the script
console.log("Loading game.js...");

// Wait for DOM content to be fully loaded
document.addEventListener("DOMContentLoaded", () => {
    console.log("DOM is fully loaded, running game.js...");

    // Check for DOM elements
    const canvas = document.getElementById("gameCanvas");
    const namePrompt = document.getElementById("namePrompt");
    const nameInput = document.getElementById("nameInput");
    const startButton = document.getElementById("startButton");

    // Log whether each element is found
    console.log("DOM elements loaded:", {
        canvas: canvas ? "Found" : "Not Found",
        namePrompt: namePrompt ? "Found" : "Not Found",
        nameInput: nameInput ? "Found" : "Not Found",
        startButton: startButton ? "Found" : "Not Found"
    });

    // Check if any element is missing
    if (!canvas || !namePrompt || !nameInput || !startButton) {
        console.error("One or more DOM elements are missing. Check index.html.");
        return; // Stop execution if elements are missing
    }

    // Log the canvas properties
    console.log("Canvas properties:", {
        width: canvas.width,
        height: canvas.height,
        style: canvas.style.display
    });

    // Start button event listener with detailed logging
    startButton.addEventListener("click", () => {
        console.log("Start button clicked at:", new Date().toISOString());

        // Get and validate player name
        const playerName = nameInput.value.trim() || "Anonymous";
        console.log("Player name entered:", playerName);

        // Hide name prompt and show canvas
        namePrompt.style.display = "none";
        canvas.style.display = "block";
        console.log("Name prompt hidden, canvas displayed. Canvas style:", canvas.style.display);

        // Attempt to get canvas context (log if it fails)
        const ctx = canvas.getContext("2d");
        if (!ctx) {
            console.error("Failed to get 2D context for canvas.");
            return;
        }
        console.log("Canvas context obtained successfully.");

        // Basic game loop test
        let lastTime = 0;
        function gameLoop(timestamp) {
            console.log("Game loop running at timestamp:", timestamp);
            if (!lastTime) lastTime = timestamp;
            const delta = Math.min((timestamp - lastTime) / 16.67, 2);
            lastTime = timestamp;

            // Clear canvas for testing
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = "red";
            ctx.fillText("Game Starting...", 10, 50);

            // Request next frame
            requestAnimationFrame(gameLoop);
        }

        // Start the game loop
        requestAnimationFrame(gameLoop);
        console.log("Game loop initiated.");
    });

    // Log if the event listener is successfully attached
    console.log("Start button event listener attached.");
});
