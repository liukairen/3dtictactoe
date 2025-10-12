import * as THREE from "three";
import { Game } from "./src/components/Game.js";

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

  if (savedInvertH !== null) {
    document.getElementById("invertHorizontal").checked =
      savedInvertH === "true";
  }
  if (savedInvertV !== null) {
    document.getElementById("invertVertical").checked = savedInvertV === "true";
  }
});
