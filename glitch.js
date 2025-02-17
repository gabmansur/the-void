document.addEventListener("DOMContentLoaded", function() {
    const title = document.querySelector("h1");
    setInterval(() => {
        title.style.opacity = Math.random() > 0.5 ? 0 : 1;
    }, 200);
});
