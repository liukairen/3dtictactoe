import * as THREE from "three";
import { Board } from "./Board.js";
import { Player } from "./Player.js";

export class Game {
  constructor() {
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    this.renderer = new THREE.WebGLRenderer({ antialias: true });

    this.currentPlayer = "X";
    this.gameStatus = "playing";
    this.board = new Board();
    this.player = new Player();

    this.init();
    this.animate();
  }

  init() {
    // Setup renderer
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setClearColor(0x87ceeb); // Sky blue
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    document.body.appendChild(this.renderer.domElement);

    // Setup camera
    this.camera.position.set(5, 5, 8);
    this.camera.lookAt(0, 0, 0);

    // Add lighting
    const ambientLight = new THREE.AmbientLight(0x404040, 0.6);
    this.scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(10, 10, 5);
    directionalLight.castShadow = true;
    this.scene.add(directionalLight);

    // Initialize board
    this.board.init(this.scene);

    // Setup click detection
    this.setupClickDetection();

    this.updateUI();
  }

  setupClickDetection() {
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    this.renderer.domElement.addEventListener("click", (event) => {
      if (this.gameStatus !== "playing") return;

      // Calculate mouse position in normalized device coordinates
      mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
      mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

      // Update the picking ray with the camera and mouse position
      raycaster.setFromCamera(mouse, this.camera);

      // Calculate objects intersecting the picking ray
      const intersects = raycaster.intersectObjects(
        this.board.getClickableObjects()
      );

      if (intersects.length > 0) {
        const cell = intersects[0].object.userData.cell;
        if (cell && this.board.isCellEmpty(cell)) {
          this.makeMove(cell);
        }
      }
    });
  }

  makeMove(cell) {
    // Place the piece
    const piece = this.board.placePiece(cell, this.currentPlayer);

    // Check for win condition
    if (this.board.checkWin(cell, this.currentPlayer)) {
      this.gameStatus = "won";
      this.updateUI();
      return;
    }

    // Check for draw
    if (this.board.isBoardFull()) {
      this.gameStatus = "draw";
      this.updateUI();
      return;
    }

    // Switch players
    this.currentPlayer = this.currentPlayer === "X" ? "O" : "X";
    this.updateUI();
  }

  updateUI() {
    document.getElementById("currentPlayer").textContent = this.currentPlayer;

    let statusText = "Your turn";
    if (this.gameStatus === "won") {
      statusText = `Player ${this.currentPlayer} wins!`;
    } else if (this.gameStatus === "draw") {
      statusText = "It's a draw!";
    }

    document.getElementById("gameStatus").textContent = statusText;
  }

  reset() {
    this.currentPlayer = "X";
    this.gameStatus = "playing";
    this.board.reset();
    this.updateUI();
  }

  handleResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  animate() {
    requestAnimationFrame(() => this.animate());
    this.board.animate();
    this.renderer.render(this.scene, this.camera);
  }
}
