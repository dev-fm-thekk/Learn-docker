const grid = document.getElementById("grid");

for (let i = 0; i < 25; i++) {
    const gifImage = document.createElement("img");

    gifImage.src = "static/assets/rickroll-roll.gif";
    gifImage.alt = "Rick Roll";

    gifImage.className =
        "w-36 h-36 object-cover rounded-xl shadow-lg hover:scale-110 transition-transform duration-300";

    grid.appendChild(gifImage);
}