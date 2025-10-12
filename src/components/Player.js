import * as THREE from "three";

export class Player {
  constructor() {
    this.currentPlayer = "X";
    this.score = { X: 0, O: 0 };
  }

  switchPlayer() {
    this.currentPlayer = this.currentPlayer === "X" ? "O" : "X";
    return this.currentPlayer;
  }

  getCurrentPlayer() {
    return this.currentPlayer;
  }

  addScore(player) {
    if (this.score.hasOwnProperty(player)) {
      this.score[player]++;
    }
  }

  getScore() {
    return this.score;
  }

  resetScore() {
    this.score = { X: 0, O: 0 };
  }
}
