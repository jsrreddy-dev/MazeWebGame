import "./style.css";
import Phaser from "phaser"

const sizes = {
  width: 1092,
  height: 810,
};

const speedDown = 300;

class GameScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameScene' });
    this.playerSpeed = 100;
    this.hasMoved = false;
    this.notout = true;
    this.playerGridPosition = { row: 0, col: 0 };
    this.visibleBlocks = new Set();
    this.visitedCells = new Set();
    this.level = 1;
  }
  
  preload() {
    this.load.image("bg", "/assets/bg.jpg");

    this.load.image("playerImage1", "/assets/playerstanding.png");
    this.load.image("playerImage2", "/assets/playerwalking.png");
    this.load.image("playerdead", "/assets/playerdead.png")

    this.load.image("platform", "/assets/block.png")
    
    this.load.image("player", "/assets/playerstanding.png");
    this.load.image("gameover", "/assets/gameover.png");
    this.load.image("win", "/assets/win.png");
    this.load.audio("bgMusic", "/assets/bgmusic.mp3");
    this.load.audio("gameovermp3", "/assets/gameover.mp3");
    this.load.audio("winmp3", "/assets/winmp3.mp3");
  }

  create() {
    //bg
    this.add.image(0, 0, "bg")
      .setOrigin(0, 0)
      .setScale(2);

    this.bgMusic = this.sound.add("bgMusic", { loop: true });
    this.bgMusic.setVolume(0.5);
    this.bgMusic.play();

    const restartButton = document.getElementById('restart-button');
    if (restartButton) {
      restartButton.addEventListener('click', () => {
        location.reload();
      });
    }

    // Grid configuration
    const gridSize = { rows: 7, cols: 9 };
    const boxSize = 110; // Size of each box
    const gridWidth = gridSize.cols * boxSize;
    const gridHeight = gridSize.rows * boxSize;
    const startX = (sizes.width - gridWidth) / 2 + 50;
    const startY = (sizes.height - gridHeight) / 2 + 50;

    for (let row = 0; row < gridSize.rows; row++) {
      for (let col = 0; col < gridSize.cols; col++) {
        const x = startX + col * boxSize;
        const y = startY + row * boxSize;
        this.add.rectangle(x, y, boxSize, boxSize)
          .setOrigin(0.5, 0.5)
          .setStrokeStyle(1, 0x000000)
          .setAlpha(0.1);
      }
    }

    // Generate random path
    this.path = this.generateRandomPath(gridSize);

    // Create the grid
    this.grid = [];
    for (let row = 0; row < gridSize.rows; row++) {
      for (let col = 0; col < gridSize.cols; col++) {
        const x = startX + col * boxSize;
        const y = startY + row * boxSize;
        const isPathCell = this.path.some(cell => cell.row === row && cell.col === col);

        let cell;
        if (isPathCell) {
          cell = this.add.image(x, y, "platform")
            .setOrigin(0.5, 0.5)
            .setInteractive()
            .setScale(0.45);
        } else {
          cell = this.add.rectangle(x, y, boxSize, boxSize, 0xffffff)
            .setOrigin(0.5, 0.5)
            .setStrokeStyle(1, 0x000000)
            .setAlpha(0.001);
        }

        // Add input handler for each cell
        cell.setInteractive();
        cell.on('pointerdown', () => {
          const playerPosition = { x: this.player.x, y: this.player.y };
          const cellPosition = { x, y };
          this.movePlayerToCell(row, col, x, y, gridSize.cols - 1, playerPosition, cellPosition);
        });

        this.grid.push({ row, col, cell });
      }
    }

    // Player
    const firstCellX = startX;
    const firstCellY = startY;
    this.player = this.physics.add
      .image(firstCellX, firstCellY, "player")
      .setOrigin(0.5, 0.5) // Ensure the origin is set correctly
      .setScale(0.4);
    this.player.setImmovable(true);
    this.player.body.allowGravity = false;
    this.player.setCollideWorldBounds(true);
    this.player.body.debugShowBody = false;

    // Initialize playerGridPosition
    this.playerGridPosition = { row: 0, col: 0 };
  }

  generateRandomPath(gridSize) {
    const path = [];
    let currentRow = Math.floor(Math.random() * gridSize.rows);
    let currentCol = 1;

    path.push({ row: currentRow, col: currentCol });

    while (currentCol < 7) {
      const direction = Math.floor(Math.random() * 3); // 0: up, 1: down, 2: right
      if (direction === 0 && currentRow > 0) {
        currentRow--;
      } else if (direction === 1 && currentRow < gridSize.rows - 1) {
        currentRow++;
      } else if (direction === 2) {
        currentCol++;
      }
      path.push({ row: currentRow, col: currentCol });
    }

    return path;
  }

  updateGreenBlocksVisibility(currentRow, currentCol) {
    // Make all previously visited green blocks visible
    this.visibleBlocks.forEach(block => {
      const [row, col] = block.split(',').map(Number);
      const cellObj = this.grid.find(cell => cell.row === row && cell.col === col);
      if (cellObj && col !== 0 && col !== 8) {
        cellObj.cell.setAlpha(1);
      }
    });
  
    // Make the current green block visible
    const currentCell = this.grid.find(cellObj => cellObj.row === currentRow && cellObj.col === currentCol);
    if (currentCell && currentCol !== 0 && currentCol !== 8) {
      currentCell.cell.setAlpha(1);
      this.visibleBlocks.add(`${currentRow},${currentCol}`); // Add to visibleBlocks
    }
  }

  updateLevelDisplay(winnloss) {
    const levelDisplay = document.getElementById('level-display');
    if (winnloss == 1) {
      this.level += 1;
      levelDisplay.textContent = `Level: ${this.level}`;
    }
    else if(winnloss == 0){
      levelDisplay.textContent = `Height Level Reached: ${this.level-1}`;
      this.level = 1;
    }
  }

  movePlayerToCell(targetRow, targetCol, x, y, lastcol, playerPosition, cellPosition) {

    const rowDiff = Math.abs(targetRow - this.playerGridPosition.row);
    const colDiff = Math.abs(targetCol - this.playerGridPosition.col);

    if (targetRow < this.playerGridPosition.row) {
      this.player.setRotation(-Math.PI / 2); // Rotate left
    } 
    else if (targetRow > this.playerGridPosition.row) {
      this.player.setRotation(Math.PI / 2); // Rotate right
    } 
    else if (targetCol > this.playerGridPosition.col) {
      this.player.setRotation(0); // Rotate 180 degrees
    } 
    else if (targetCol < this.playerGridPosition.col) {
      this.player.setRotation(Math.PI); // Rotate 0 degrees
    }

    // Check if the target cell is adjacent
    if ((rowDiff === 1 && colDiff === 0) || (rowDiff === 0 && colDiff === 1)) {
      
      this.player.setTexture("playerImage2");
      setTimeout(() => {
        this.player.setTexture("playerImage1");
      }, 500);

      const isPathCell = this.path.some(cell => cell.row === targetRow && cell.col === targetCol);

      if (isPathCell) {
        // If the player steps on any green block, make the path invisible
        this.path.forEach(cell => {
          const gridCell = this.grid.find(g => g.row === cell.row && g.col === cell.col);
          if (gridCell && !this.visibleBlocks.has(`${cell.row},${cell.col}`)) {
            gridCell.cell.setAlpha(0.01);
          }
        });

        this.tweens.add({
          targets: this.player,
          x: x,
          y: y,
          duration: 500,
          onComplete: () => {
            this.playerGridPosition = { row: targetRow, col: targetCol };
            // Update the visibility of green blocks
            this.updateGreenBlocksVisibility(targetRow, targetCol);
          }
        });
      } else if (targetCol !== 0 && targetCol !== 8 && !isPathCell) {
        // If the player steps on a non-green area (except for column 0 and column 8)
        this.tweens.add({
          targets: this.player,
          x: x,
          y: y,
          scaleX: 0.25,
          scaleY: 0.25,
          duration: 500,
          onComplete: () => {
            this.add.image(500, 400, "gameover")
              .setScale(0.3);
            this.gameovermp3 = this.sound.add("gameovermp3", { loop: true });
            this.level == 1;
            this.bgMusic.stop();
            this.updateLevelDisplay(0);
            this.gameovermp3.play();
            this.player.setTexture("playerdead");
            setTimeout(() => {
              this.gameovermp3.stop();
              this.scene.pause()
            }, 1500);
          }
        });
        
      } else if (targetCol === 8) {
        this.tweens.add({
          targets: this.player,
          x: x,
          y: y,
          duration: 500,
          onComplete: () => {
            this.add.image(500, 400, "win");
            this.winmp3 = this.sound.add("winmp3", { loop: true });
            this.bgMusic.stop();
            this.winmp3.play();
            this.visitedCells.clear();
            this.visibleBlocks.clear();
            setTimeout(() => {
              console.log("Pass");
              this.updateLevelDisplay(1);
              this.scene.restart();
              this.winmp3.stop();
            }, 1500);
          }
        });
      } else {
        // Allow movement in column 0 without triggering reload
        this.tweens.add({
          targets: this.player,
          x: x,
          y: y,
          duration: 500,
          onComplete: () => {
            this.playerGridPosition = { row: targetRow, col: targetCol };
            // Update the visibility of green blocks
            this.updateGreenBlocksVisibility(targetRow, targetCol);
          }
        });
      }
    }
  }

  update() {
    // Update logic here
  }
}

const config = {
  type: Phaser.WEBGL,
  width: sizes.width,
  height: sizes.height,
  canvas: gameCanvas,
  physics: {
    default: "arcade",
    arcade: {
      gravity: { y: speedDown },
      debug: true,
    },
  },
  scene: [GameScene],
};

const game = new Phaser.Game(config);