import * as THREE from "three";
import { Game } from "./components/Game.js";

// Initialize the game
const game = new Game();

// Handle window resize
window.addEventListener("resize", () => {
  game.handleResize();
});

// Handle reset button
document.getElementById("resetBtn").addEventListener("click", () => {
  game.reset();
});

// Handle panel toggle
document.getElementById("togglePanelBtn").addEventListener("click", () => {
  const gameInfo = document.getElementById("gameInfo");
  const toggleBtn = document.getElementById("togglePanelBtn");

  if (gameInfo.classList.contains("hidden")) {
    gameInfo.classList.remove("hidden");
    toggleBtn.textContent = "☰";
    localStorage.setItem("3dtictactoe_panelHidden", "false");
  } else {
    gameInfo.classList.add("hidden");
    toggleBtn.textContent = "☰";
    localStorage.setItem("3dtictactoe_panelHidden", "true");
  }
});

// Handle congratulations modal buttons
document.getElementById("playAgainBtn").addEventListener("click", () => {
  game.reset();
});

document.getElementById("closeModalBtn").addEventListener("click", () => {
  game.hideCongratulations();
});

// Handle inversion settings
document.getElementById("invertHorizontal").addEventListener("change", (e) => {
  game.setInvertHorizontal(e.target.checked);
});

document.getElementById("invertVertical").addEventListener("change", (e) => {
  game.setInvertVertical(e.target.checked);
});

// Load initial settings into UI
window.addEventListener("load", () => {
  const savedInvertH = localStorage.getItem("3dtictactoe_invertHorizontal");
  const savedInvertV = localStorage.getItem("3dtictactoe_invertVertical");
  const savedPanelHidden = localStorage.getItem("3dtictactoe_panelHidden");

  if (savedInvertH !== null) {
    document.getElementById("invertHorizontal").checked =
      savedInvertH === "true";
  }
  if (savedInvertV !== null) {
    document.getElementById("invertVertical").checked = savedInvertV === "true";
  }

  // Load panel visibility preference
  if (savedPanelHidden === "true") {
    document.getElementById("gameInfo").classList.add("hidden");
  }
});
