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
