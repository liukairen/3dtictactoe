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

    // Camera control variables
    this.mouseDown = false;
    this.mouseX = 0;
    this.mouseY = 0;
    this.cameraDistance = 8;
    this.cameraAngleX = 0.3;
    this.cameraAngleY = 0.5;
    this.wasDragging = false;
    this.dragThreshold = 5; // pixels

    // Touch control variables
    this.touchDown = false;
    this.lastTouchDistance = 0;
    this.isPinching = false;
    this.lastTouchCenter = { x: 0, y: 0 };
    this.touchStartTime = 0;
    this.touchThreshold = 300; // ms for tap detection

    // Mobile device detection and performance settings
    this.isMobile = this.detectMobile();
    this.isLowEndDevice = this.detectLowEndDevice();

    // Inversion settings
    this.invertHorizontal = false;
    this.invertVertical = false;

    // Hover highlighting
    this.hoveredCell = null;
    this.originalMaterials = new Map();

    this.loadSettings();
    this.init();
    this.animate();
  }

  detectMobile() {
    return (
      /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
        navigator.userAgent
      ) ||
      (navigator.maxTouchPoints && navigator.maxTouchPoints > 2)
    );
  }

  detectLowEndDevice() {
    // Simple heuristic for low-end devices
    const canvas = document.createElement("canvas");
    const gl =
      canvas.getContext("webgl") || canvas.getContext("experimental-webgl");

    if (!gl) return true;

    const debugInfo = gl.getExtension("WEBGL_debug_renderer_info");
    if (debugInfo) {
      const renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
      // Check for known low-end GPU indicators
      return /Intel.*HD|Mali|Adreno.*3|PowerVR.*SGX/i.test(renderer);
    }

    return false;
  }

  loadSettings() {
    // Load inversion settings from localStorage
    const savedInvertH = localStorage.getItem("3dtictactoe_invertHorizontal");
    const savedInvertV = localStorage.getItem("3dtictactoe_invertVertical");

    if (savedInvertH !== null) {
      this.invertHorizontal = savedInvertH === "true";
    }
    if (savedInvertV !== null) {
      this.invertVertical = savedInvertV === "true";
    }
  }

  saveSettings() {
    // Save inversion settings to localStorage
    localStorage.setItem(
      "3dtictactoe_invertHorizontal",
      this.invertHorizontal.toString()
    );
    localStorage.setItem(
      "3dtictactoe_invertVertical",
      this.invertVertical.toString()
    );
  }

  setInvertHorizontal(invert) {
    this.invertHorizontal = invert;
    this.saveSettings();
  }

  setInvertVertical(invert) {
    this.invertVertical = invert;
    this.saveSettings();
  }

  init() {
    // Setup renderer with mobile optimizations
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setClearColor(0x87ceeb); // Sky blue

    // Mobile performance optimizations
    if (this.isMobile || this.isLowEndDevice) {
      // Reduce shadow quality for mobile
      this.renderer.shadowMap.enabled = true;
      this.renderer.shadowMap.type = THREE.BasicShadowMap; // Faster than PCFSoftShadowMap
      this.renderer.shadowMap.autoUpdate = false; // Manual shadow updates for better performance

      // Reduce pixel ratio for better performance
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

      // Enable power preference for mobile
      this.renderer.powerPreference = "low-power";
    } else {
      // Full quality for desktop
      this.renderer.shadowMap.enabled = true;
      this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      this.renderer.setPixelRatio(window.devicePixelRatio);
    }

    document.body.appendChild(this.renderer.domElement);

    // Setup camera
    this.updateCameraPosition();

    // Setup camera controls
    this.setupCameraControls();

    // Add lighting with mobile optimizations
    const ambientLight = new THREE.AmbientLight(0x404040, 0.6);
    this.scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(10, 10, 5);

    // Only enable shadows on non-mobile devices or high-end mobile
    if (!this.isMobile || !this.isLowEndDevice) {
      directionalLight.castShadow = true;
    }

    this.scene.add(directionalLight);

    // Initialize board with mobile optimization settings
    this.board.init(this.scene, {
      isMobile: this.isMobile,
      isLowEndDevice: this.isLowEndDevice,
    });

    // Setup click detection
    this.setupClickDetection();

    // Setup hover detection (only for desktop)
    if (!this.isMobile) {
      this.setupHoverDetection();
    }

    this.updateUI();
  }

  setupCameraControls() {
    const canvas = this.renderer.domElement;

    // Mouse down
    canvas.addEventListener("mousedown", (event) => {
      this.mouseDown = true;
      this.mouseX = event.clientX;
      this.mouseY = event.clientY;
      this.wasDragging = false;
      canvas.style.cursor = "grabbing";
    });

    // Mouse up
    canvas.addEventListener("mouseup", () => {
      this.mouseDown = false;
      canvas.style.cursor = "pointer";

      // Reset drag flag after a short delay to allow clicks again
      if (this.wasDragging) {
        setTimeout(() => {
          this.wasDragging = false;
        }, 100);
      }
    });

    // Mouse move
    canvas.addEventListener("mousemove", (event) => {
      if (!this.mouseDown) return;

      const deltaX = event.clientX - this.mouseX;
      const deltaY = event.clientY - this.mouseY;

      // Check if we've moved enough to consider it a drag
      const totalMovement = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
      if (totalMovement > this.dragThreshold) {
        this.wasDragging = true;
      }

      // Apply inversion settings
      const horizontalDelta = this.invertHorizontal ? -deltaX : deltaX;
      const verticalDelta = this.invertVertical ? -deltaY : deltaY;

      this.cameraAngleY += horizontalDelta * 0.01;
      this.cameraAngleX += verticalDelta * 0.01;

      // Limit vertical rotation
      this.cameraAngleX = Math.max(
        -Math.PI / 2,
        Math.min(Math.PI / 2, this.cameraAngleX)
      );

      this.mouseX = event.clientX;
      this.mouseY = event.clientY;

      this.updateCameraPosition();
    });

    // Mouse wheel for zoom
    canvas.addEventListener("wheel", (event) => {
      event.preventDefault();
      this.cameraDistance += event.deltaY * 0.01;
      this.cameraDistance = Math.max(3, Math.min(15, this.cameraDistance));
      this.updateCameraPosition();
    });

    // Touch events for mobile
    this.setupTouchControls(canvas);
  }

  setupTouchControls(canvas) {
    // Touch start
    canvas.addEventListener("touchstart", (event) => {
      event.preventDefault();
      this.touchStartTime = Date.now();

      if (event.touches.length === 1) {
        // Single touch - camera rotation
        this.touchDown = true;
        this.mouseX = event.touches[0].clientX;
        this.mouseY = event.touches[0].clientY;
        this.wasDragging = false;
      } else if (event.touches.length === 2) {
        // Two touches - pinch to zoom
        this.isPinching = true;
        this.touchDown = false;
        const touch1 = event.touches[0];
        const touch2 = event.touches[1];

        this.lastTouchDistance = Math.sqrt(
          Math.pow(touch2.clientX - touch1.clientX, 2) +
            Math.pow(touch2.clientY - touch1.clientY, 2)
        );

        // Calculate center point
        this.lastTouchCenter = {
          x: (touch1.clientX + touch2.clientX) / 2,
          y: (touch1.clientY + touch2.clientY) / 2,
        };
      }
    });

    // Touch move
    canvas.addEventListener("touchmove", (event) => {
      event.preventDefault();

      if (event.touches.length === 1 && this.touchDown && !this.isPinching) {
        // Single touch drag - camera rotation
        const deltaX = event.touches[0].clientX - this.mouseX;
        const deltaY = event.touches[0].clientY - this.mouseY;

        // Check if we've moved enough to consider it a drag
        const totalMovement = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
        if (totalMovement > this.dragThreshold) {
          this.wasDragging = true;
        }

        // Apply inversion settings
        const horizontalDelta = this.invertHorizontal ? -deltaX : deltaX;
        const verticalDelta = this.invertVertical ? -deltaY : deltaY;

        this.cameraAngleY += horizontalDelta * 0.01;
        this.cameraAngleX += verticalDelta * 0.01;

        // Limit vertical rotation
        this.cameraAngleX = Math.max(
          -Math.PI / 2,
          Math.min(Math.PI / 2, this.cameraAngleX)
        );

        this.mouseX = event.touches[0].clientX;
        this.mouseY = event.touches[0].clientY;

        this.updateCameraPosition();
      } else if (event.touches.length === 2 && this.isPinching) {
        // Two touches - pinch to zoom
        const touch1 = event.touches[0];
        const touch2 = event.touches[1];

        const currentDistance = Math.sqrt(
          Math.pow(touch2.clientX - touch1.clientX, 2) +
            Math.pow(touch2.clientY - touch1.clientY, 2)
        );

        const distanceChange = currentDistance - this.lastTouchDistance;
        const zoomFactor = distanceChange * 0.01;

        this.cameraDistance -= zoomFactor;
        this.cameraDistance = Math.max(3, Math.min(15, this.cameraDistance));

        this.lastTouchDistance = currentDistance;
        this.updateCameraPosition();
      }
    });

    // Touch end
    canvas.addEventListener("touchend", (event) => {
      event.preventDefault();

      // Handle tap for cell selection
      if (
        event.changedTouches.length === 1 &&
        !this.wasDragging &&
        !this.isPinching
      ) {
        const touchDuration = Date.now() - this.touchStartTime;

        if (
          touchDuration < this.touchThreshold &&
          this.gameStatus === "playing"
        ) {
          // This is a tap, handle cell selection
          const touch = event.changedTouches[0];
          this.handleTouchCellSelection(touch.clientX, touch.clientY);
        }
      }

      this.touchDown = false;
      this.isPinching = false;

      // Reset drag flag after a short delay
      if (this.wasDragging) {
        setTimeout(() => {
          this.wasDragging = false;
        }, 100);
      }
    });
  }

  handleTouchCellSelection(clientX, clientY) {
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    // Calculate touch position in normalized device coordinates
    mouse.x = (clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(clientY / window.innerHeight) * 2 + 1;

    // Update the picking ray with the camera and touch position
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
  }

  updateCameraPosition() {
    const x =
      Math.sin(this.cameraAngleY) *
      Math.cos(this.cameraAngleX) *
      this.cameraDistance;
    const y = Math.sin(this.cameraAngleX) * this.cameraDistance;
    const z =
      Math.cos(this.cameraAngleY) *
      Math.cos(this.cameraAngleX) *
      this.cameraDistance;

    this.camera.position.set(x, y, z);
    this.camera.lookAt(0, 0, 0);
  }

  setupHoverDetection() {
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    this.renderer.domElement.addEventListener("mousemove", (event) => {
      // Don't process hover if mouse is down (dragging camera)
      if (this.mouseDown) return;

      // Calculate mouse position in normalized device coordinates
      mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
      mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

      // Update the picking ray with the camera and mouse position
      raycaster.setFromCamera(mouse, this.camera);

      // Calculate objects intersecting the picking ray
      const intersects = raycaster.intersectObjects(
        this.board.getClickableObjects()
      );

      // Reset previous hover
      this.resetHover();

      // Set new hover if found
      if (intersects.length > 0) {
        const cell = intersects[0].object.userData.cell;
        if (cell && this.board.isCellEmpty(cell)) {
          this.setHover(intersects[0].object);
        }
      }
    });
  }

  setHover(object) {
    // Store reference to hovered cell
    this.hoveredCell = object;

    // Store original material
    this.originalMaterials.set(object, object.material);

    // Create highlight material
    const highlightMaterial = new THREE.MeshLambertMaterial({
      color: 0xffff00, // Bright yellow
      transparent: true,
      opacity: 0.7,
    });

    // Apply highlight material
    object.material = highlightMaterial;
  }

  resetHover() {
    if (this.hoveredCell && this.originalMaterials.has(this.hoveredCell)) {
      // Restore original material
      this.hoveredCell.material = this.originalMaterials.get(this.hoveredCell);
      this.originalMaterials.delete(this.hoveredCell);
    }
    this.hoveredCell = null;
  }

  setupClickDetection() {
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    this.renderer.domElement.addEventListener("click", (event) => {
      // Only handle clicks if mouse wasn't dragged (camera control)
      if (this.gameStatus !== "playing" || this.wasDragging) return;

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
    this.resetHover(); // Clear any hover highlighting
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
