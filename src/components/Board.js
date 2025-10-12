import * as THREE from "three";

export class Board {
  constructor() {
    this.gridSize = 3;
    this.cellSize = 1;
    this.spacing = 0.1;
    this.board = [];
    this.clickableObjects = [];
    this.pieces = [];

    // Initialize empty board
    for (let x = 0; x < this.gridSize; x++) {
      this.board[x] = [];
      for (let y = 0; y < this.gridSize; y++) {
        this.board[x][y] = [];
        for (let z = 0; z < this.gridSize; z++) {
          this.board[x][y][z] = null;
        }
      }
    }
  }

  init(scene, options = {}) {
    this.scene = scene;
    this.isMobile = options.isMobile || false;
    this.isLowEndDevice = options.isLowEndDevice || false;
    this.createBoard();
  }

  createBoard() {
    const group = new THREE.Group();

    // Create grid lines and cells
    for (let x = 0; x < this.gridSize; x++) {
      for (let y = 0; y < this.gridSize; y++) {
        for (let z = 0; z < this.gridSize; z++) {
          const cell = this.createCell(x, y, z);
          group.add(cell);
          this.clickableObjects.push(cell);
        }
      }
    }

    // Grid lines removed for cleaner look

    this.scene.add(group);
    this.boardGroup = group;
  }

  createCell(x, y, z) {
    const geometry = new THREE.BoxGeometry(
      this.cellSize - this.spacing,
      this.cellSize - this.spacing,
      this.cellSize - this.spacing
    );

    const material = new THREE.MeshLambertMaterial({
      color: 0xf0f0f0,
      transparent: true,
      opacity: 0.5,
    });

    const mesh = new THREE.Mesh(geometry, material);

    // Disable shadows for mobile devices
    if (this.isMobile && this.isLowEndDevice) {
      mesh.castShadow = false;
      mesh.receiveShadow = false;
    }

    // Position the cell
    const offset = (this.gridSize - 1) / 2;
    mesh.position.set(
      (x - offset) * this.cellSize,
      (y - offset) * this.cellSize,
      (z - offset) * this.cellSize
    );

    // Store cell coordinates in userData for click detection
    mesh.userData = { cell: { x, y, z } };

    return mesh;
  }

  isCellEmpty(cell) {
    return this.board[cell.x][cell.y][cell.z] === null;
  }

  placePiece(cell, player) {
    if (!this.isCellEmpty(cell)) return null;

    // Mark cell as occupied
    this.board[cell.x][cell.y][cell.z] = player;

    // Create visual piece
    const piece = this.createPiece(cell, player);
    this.pieces.push(piece);
    this.scene.add(piece);

    return piece;
  }

  createPiece(cell, player) {
    // Use lower geometry complexity for mobile devices
    const segments = this.isLowEndDevice ? 8 : 16;
    const geometry = new THREE.SphereGeometry(0.3, segments, segments);
    const material = new THREE.MeshLambertMaterial({
      color: player === "X" ? 0xff4444 : 0x4444ff,
      emissive: player === "X" ? 0x220000 : 0x000022,
    });

    const piece = new THREE.Mesh(geometry, material);

    // Disable shadows for mobile devices
    if (this.isMobile && this.isLowEndDevice) {
      piece.castShadow = false;
      piece.receiveShadow = false;
    }

    // Position the piece
    const offset = (this.gridSize - 1) / 2;
    piece.position.set(
      (cell.x - offset) * this.cellSize,
      (cell.y - offset) * this.cellSize,
      (cell.z - offset) * this.cellSize
    );

    // Add entrance animation
    piece.scale.set(0, 0, 0);

    return piece;
  }

  checkWin(cell, player) {
    const { x, y, z } = cell;

    // Check all possible winning lines through this cell
    const directions = [
      // Face diagonals
      [
        [1, 0, 0],
        [-1, 0, 0],
      ], // X-axis
      [
        [0, 1, 0],
        [0, -1, 0],
      ], // Y-axis
      [
        [0, 0, 1],
        [0, 0, -1],
      ], // Z-axis

      // Edge diagonals
      [
        [1, 1, 0],
        [-1, -1, 0],
      ], // XY diagonal
      [
        [1, -1, 0],
        [-1, 1, 0],
      ], // XY anti-diagonal
      [
        [1, 0, 1],
        [-1, 0, -1],
      ], // XZ diagonal
      [
        [1, 0, -1],
        [-1, 0, 1],
      ], // XZ anti-diagonal
      [
        [0, 1, 1],
        [0, -1, -1],
      ], // YZ diagonal
      [
        [0, 1, -1],
        [0, -1, 1],
      ], // YZ anti-diagonal

      // Space diagonal
      [
        [1, 1, 1],
        [-1, -1, -1],
      ], // Main diagonal
      [
        [1, 1, -1],
        [-1, -1, 1],
      ], // Anti diagonal
      [
        [1, -1, 1],
        [-1, 1, -1],
      ], // Anti diagonal
      [
        [-1, 1, 1],
        [1, -1, -1],
      ], // Anti diagonal
    ];

    for (const [dir1, dir2] of directions) {
      let count = 1; // Count the current cell

      // Check in positive direction
      count += this.countInDirection(x, y, z, dir1, player);

      // Check in negative direction
      count += this.countInDirection(x, y, z, dir2, player);

      if (count >= 3) {
        return true;
      }
    }

    return false;
  }

  countInDirection(x, y, z, direction, player) {
    let count = 0;
    let [dx, dy, dz] = direction;

    let newX = x + dx;
    let newY = y + dy;
    let newZ = z + dz;

    while (
      newX >= 0 &&
      newX < this.gridSize &&
      newY >= 0 &&
      newY < this.gridSize &&
      newZ >= 0 &&
      newZ < this.gridSize
    ) {
      if (this.board[newX][newY][newZ] === player) {
        count++;
        newX += dx;
        newY += dy;
        newZ += dz;
      } else {
        break;
      }
    }

    return count;
  }

  isBoardFull() {
    for (let x = 0; x < this.gridSize; x++) {
      for (let y = 0; y < this.gridSize; y++) {
        for (let z = 0; z < this.gridSize; z++) {
          if (this.board[x][y][z] === null) {
            return false;
          }
        }
      }
    }
    return true;
  }

  reset() {
    // Clear board state
    for (let x = 0; x < this.gridSize; x++) {
      for (let y = 0; y < this.gridSize; y++) {
        for (let z = 0; z < this.gridSize; z++) {
          this.board[x][y][z] = null;
        }
      }
    }

    // Remove all pieces from scene
    this.pieces.forEach((piece) => {
      this.scene.remove(piece);
    });
    this.pieces = [];
  }

  getClickableObjects() {
    return this.clickableObjects;
  }

  animate() {
    // Animate piece entrance
    this.pieces.forEach((piece) => {
      if (piece.scale.x < 1) {
        piece.scale.x += 0.1;
        piece.scale.y += 0.1;
        piece.scale.z += 0.1;
      }
    });

    // Removed automatic rotation - camera will be controlled manually
  }
}
