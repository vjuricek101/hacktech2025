class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.canvas.width = 800;
        this.canvas.height = 600;
        
        this.tileSize = 32;
        this.grid = [];
        this.selectedTool = null;
        this.selectedCrop = null;
        
        // Game state
        this.gameOver = false;
        this.gameOverReason = '';
        this.maxCarbonFootprint = 50; // Game over if carbon footprint exceeds this
        
        // Game economy
        this.money = 100; // Starting money
        this.lastCrops = {}; // Track last crop planted in each tile
        
        // Sustainability metrics
        this.carbonFootprint = 0;
        this.soilQuality = 100; // Starts at 100%
        
        // Add soil depletion threshold
        this.soilDepletionThreshold = 30; // Soil quality below this cannot be planted on
        this.soilRestorationThreshold = 50; // Soil must reach this quality to be plantable again
        
        // Crop types and their properties
        this.cropTypes = {
            corn: {
                name: 'Corn',
                growthTime: 3,
                carbonImpact: -2, // Negative means it reduces carbon
                soilImpact: -5, // Negative means it depletes soil
                color: '#FFD700',
                basePrice: 15,
                rotationBonus: 1.5, // Bonus multiplier if planted after beans
                rotationPenalty: 0.7 // Penalty if planted after corn
            },
            beans: {
                name: 'Beans',
                growthTime: 2,
                carbonImpact: -3,
                soilImpact: 2, // Positive means it improves soil
                color: '#228B22',
                basePrice: 10,
                rotationBonus: 1.2, // Bonus multiplier if planted after wheat
                rotationPenalty: 0.8 // Penalty if planted after beans
            },
            wheat: {
                name: 'Wheat',
                growthTime: 4,
                carbonImpact: -1,
                soilImpact: -3,
                color: '#F5DEB3',
                basePrice: 12,
                rotationBonus: 1.3, // Bonus multiplier if planted after corn
                rotationPenalty: 0.9 // Penalty if planted after wheat
            }
        };
        
        // Player properties
        this.player = {
            x: 400,
            y: 300,
            width: 32,
            height: 32,
            speed: 4,
            direction: 'down',
            isMoving: false
        };
        
        // Player movement keys state
        this.keys = {
            w: false,
            a: false,
            s: false,
            d: false
        };
        
        this.initGrid();
        this.setupEventListeners();
        this.gameLoop();
    }

    initGrid() {
        const rows = Math.floor(this.canvas.height / this.tileSize);
        const cols = Math.floor(this.canvas.width / this.tileSize);
        
        for (let y = 0; y < rows; y++) {
            this.grid[y] = [];
            for (let x = 0; x < cols; x++) {
                this.grid[y][x] = {
                    type: 'dirt',
                    state: 'untilled',
                    growth: 0,
                    cropType: null,
                    soilQuality: 100,
                    lastCrop: null
                };
            }
        }
    }

    setupEventListeners() {
        // Keyboard controls
        window.addEventListener('keydown', (e) => {
            const key = e.key.toLowerCase();
            if (this.keys.hasOwnProperty(key)) {
                this.keys[key] = true;
                this.player.isMoving = true;
                
                if (key === 'w') this.player.direction = 'up';
                if (key === 's') this.player.direction = 'down';
                if (key === 'a') this.player.direction = 'left';
                if (key === 'd') this.player.direction = 'right';
            }
            
            // Handle number key selection (1-6)
            if (key >= '1' && key <= '6') {
                const slotNumber = parseInt(key);
                this.selectHotbarSlot(slotNumber);
            }
            
            if (e.key === ' ' && this.selectedTool) {
                this.useTool();
            }
        });

        window.addEventListener('keyup', (e) => {
            const key = e.key.toLowerCase();
            if (this.keys.hasOwnProperty(key)) {
                this.keys[key] = false;
                this.player.isMoving = false;
            }
        });
        
        // Tool and crop selection
        document.querySelectorAll('.hotbar-slot').forEach(slot => {
            slot.addEventListener('click', () => {
                const slotNumber = parseInt(slot.dataset.slot);
                this.selectHotbarSlot(slotNumber);
            });
        });
    }

    selectHotbarSlot(slotNumber) {
        // Remove selected class from all slots
        document.querySelectorAll('.hotbar-slot').forEach(slot => {
            slot.classList.remove('selected');
        });
        
        // Add selected class to the new slot
        const newSlot = document.querySelector(`.hotbar-slot[data-slot="${slotNumber}"]`);
        if (newSlot) {
            newSlot.classList.add('selected');
            
            // Update selected tool/crop
            const item = newSlot.querySelector('.item');
            if (item.dataset.tool) {
                this.selectedTool = item.dataset.tool;
                this.selectedCrop = null;
            } else if (item.dataset.crop) {
                this.selectedTool = 'seeds';
                this.selectedCrop = item.dataset.crop;
            }
        }
    }

    updateSustainability(tile) {
        if (tile.cropType) {
            const crop = this.cropTypes[tile.cropType];
            this.carbonFootprint += crop.carbonImpact;
            this.soilQuality += crop.soilImpact;
            
            // Update tile's soil quality
            tile.soilQuality += crop.soilImpact;
            
            // Ensure soil quality stays within bounds
            this.soilQuality = Math.max(0, Math.min(100, this.soilQuality));
            tile.soilQuality = Math.max(0, Math.min(100, tile.soilQuality));
            
            // If soil is severely depleted, mark it as depleted
            if (tile.soilQuality < this.soilDepletionThreshold) {
                tile.state = 'depleted';
            }
        }
    }

    calculateHarvestValue(tile) {
        if (!tile.cropType) return 0;
        
        const crop = this.cropTypes[tile.cropType];
        let value = crop.basePrice;
        
        // Apply soil quality bonus/penalty
        const soilBonus = tile.soilQuality / 100;
        value *= soilBonus;
        
        // Apply crop rotation bonus/penalty
        if (tile.lastCrop) {
            if (this.isGoodRotation(tile.lastCrop, tile.cropType)) {
                value *= crop.rotationBonus;
            } else if (tile.lastCrop === tile.cropType) {
                value *= crop.rotationPenalty;
            }
        }
        
        return Math.round(value);
    }

    isGoodRotation(previousCrop, currentCrop) {
        // Define good crop rotations
        const goodRotations = {
            'beans': 'corn',
            'corn': 'wheat',
            'wheat': 'beans'
        };
        
        return goodRotations[previousCrop] === currentCrop;
    }

    harvest(tile) {
        if (tile.state === 'ready') {
            const value = this.calculateHarvestValue(tile);
            this.money += value;
            
            // Update last crop
            tile.lastCrop = tile.cropType;
            
            // Reset tile
            tile.state = 'untilled';
            tile.cropType = null;
            tile.growth = 0;
            
            return value;
        }
        return 0;
    }

    useTool() {
        if (this.gameOver) return;
        
        // Calculate grid position based on avatar's centroid
        const centerX = this.player.x + this.player.width / 2;
        const centerY = this.player.y + this.player.height / 2;
        
        const gridX = Math.floor(centerX / this.tileSize);
        const gridY = Math.floor(centerY / this.tileSize);
        
        if (gridX >= 0 && gridX < this.grid[0].length && gridY >= 0 && gridY < this.grid.length) {
            const tile = this.grid[gridY][gridX];
            
            switch (this.selectedTool) {
                case 'hoe':
                    if (tile.state === 'untilled' && tile.soilQuality >= this.soilRestorationThreshold) {
                        tile.state = 'tilled';
                        this.carbonFootprint += 1;
                        this.checkGameOver();
                    }
                    break;
                case 'seeds':
                    if (tile.state === 'tilled' && this.selectedCrop && tile.soilQuality >= this.soilRestorationThreshold) {
                        // Check if player can afford the seeds
                        const crop = this.cropTypes[this.selectedCrop];
                        if (this.money >= crop.basePrice / 2) {
                            this.money -= crop.basePrice / 2; // Cost to plant
                            tile.state = 'planted';
                            tile.growth = 0;
                            tile.cropType = this.selectedCrop;
                            this.updateSustainability(tile);
                            this.checkGameOver();
                        }
                    }
                    break;
                case 'water':
                    if (tile.state === 'planted' && tile.growth < 100) {
                        tile.growth += 25;
                        if (tile.growth >= 100) {
                            tile.state = 'ready';
                            this.updateSustainability(tile);
                            this.checkGameOver();
                        }
                    } else if (tile.state === 'depleted') {
                        // Watering depleted soil helps restore it
                        tile.soilQuality += 5;
                        if (tile.soilQuality >= this.soilRestorationThreshold) {
                            tile.state = 'untilled';
                        }
                    }
                    break;
                case 'harvest':
                    if (tile.state === 'ready') {
                        const harvestValue = this.harvest(tile);
                        if (harvestValue > 0) {
                            // Show harvest value popup at the tile's center
                            const tileCenterX = gridX * this.tileSize + this.tileSize / 2;
                            const tileCenterY = gridY * this.tileSize + this.tileSize / 2;
                            this.showHarvestPopup(tileCenterX, tileCenterY, harvestValue);
                        }
                    }
                    break;
            }
        }
    }

    showHarvestPopup(x, y, value) {
        const popup = document.createElement('div');
        popup.className = 'harvest-popup';
        popup.textContent = `+$${value}`;
        popup.style.left = `${x}px`;
        popup.style.top = `${y}px`;
        document.querySelector('.game-container').appendChild(popup);
        
        // Animate and remove popup
        setTimeout(() => {
            popup.style.opacity = '0';
            popup.style.transform = 'translateY(-20px)';
            setTimeout(() => popup.remove(), 500);
        }, 1000);
    }

    drawSustainabilityInfo() {
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        this.ctx.fillRect(10, 10, 200, 100);
        
        this.ctx.fillStyle = '#000';
        this.ctx.font = '14px Arial';
        this.ctx.fillText(`Money: $${this.money}`, 20, 30);
        this.ctx.fillText(`Carbon Footprint: ${this.carbonFootprint}`, 20, 50);
        this.ctx.fillText(`Overall Soil Quality: ${Math.round(this.soilQuality)}%`, 20, 70);
        
        // Color code the soil quality
        let soilColor;
        if (this.soilQuality > 75) soilColor = '#228B22';
        else if (this.soilQuality > 50) soilColor = '#FFA500';
        else soilColor = '#FF0000';
        
        this.ctx.fillStyle = soilColor;
        this.ctx.fillRect(20, 80, this.soilQuality * 1.6, 20);
    }

    checkGameOver() {
        if (this.money <= 0) {
            this.gameOver = true;
            this.gameOverReason = 'bankruptcy';
            this.showGameOverScreen();
            return true;
        }
        
        if (this.carbonFootprint >= this.maxCarbonFootprint) {
            this.gameOver = true;
            this.gameOverReason = 'carbon';
            this.showGameOverScreen();
            return true;
        }
        
        return false;
    }

    showGameOverScreen() {
        const gameOverScreen = document.createElement('div');
        gameOverScreen.className = 'game-over-screen';
        
        let message = '';
        if (this.gameOverReason === 'bankruptcy') {
            message = 'Game Over - You ran out of money!';
        } else if (this.gameOverReason === 'carbon') {
            message = 'Game Over - Your carbon footprint is too high!';
        }
        
        gameOverScreen.innerHTML = `
            <div class="game-over-content">
                <h2>${message}</h2>
                <p>Final Money: $${this.money}</p>
                <p>Final Carbon Footprint: ${this.carbonFootprint}</p>
                <p>Final Soil Quality: ${Math.round(this.soilQuality)}%</p>
                <button onclick="window.location.reload()">Play Again</button>
            </div>
        `;
        
        document.body.appendChild(gameOverScreen);
    }

    update() {
        if (this.gameOver) return;
        
        // Update player position based on key states
        if (this.keys.w) {
            this.player.y = Math.max(0, this.player.y - this.player.speed);
        }
        if (this.keys.s) {
            this.player.y = Math.min(this.canvas.height - this.player.height, this.player.y + this.player.speed);
        }
        if (this.keys.a) {
            this.player.x = Math.max(0, this.player.x - this.player.speed);
        }
        if (this.keys.d) {
            this.player.x = Math.min(this.canvas.width - this.player.width, this.player.x + this.player.speed);
        }
        
        this.checkGameOver();
    }

    drawPlayer() {
        const { x, y, direction } = this.player;
        
        // Draw body
        this.ctx.fillStyle = '#4A90E2'; // Blue shirt
        this.ctx.fillRect(x + 8, y + 16, 16, 16);
        
        // Draw head
        this.ctx.fillStyle = '#FFD3B6'; // Skin tone
        this.ctx.fillRect(x + 8, y + 8, 16, 8);
        
        // Draw legs
        this.ctx.fillStyle = '#2C3E50'; // Dark pants
        this.ctx.fillRect(x + 8, y + 32, 6, 8);
        this.ctx.fillRect(x + 18, y + 32, 6, 8);
        
        // Draw face based on direction
        this.ctx.fillStyle = '#000';
        switch (direction) {
            case 'up':
                // Eyes looking up
                this.ctx.fillRect(x + 10, y + 10, 4, 2);
                this.ctx.fillRect(x + 18, y + 10, 4, 2);
                break;
            case 'down':
                // Eyes looking down
                this.ctx.fillRect(x + 10, y + 12, 4, 2);
                this.ctx.fillRect(x + 18, y + 12, 4, 2);
                break;
            case 'left':
                // Eyes looking left
                this.ctx.fillRect(x + 10, y + 10, 2, 4);
                this.ctx.fillRect(x + 18, y + 10, 2, 4);
                break;
            case 'right':
                // Eyes looking right
                this.ctx.fillRect(x + 12, y + 10, 2, 4);
                this.ctx.fillRect(x + 20, y + 10, 2, 4);
                break;
        }
        
        // Draw arms
        this.ctx.fillStyle = '#4A90E2';
        switch (direction) {
            case 'up':
                // Arms up
                this.ctx.fillRect(x + 4, y + 16, 4, 8);
                this.ctx.fillRect(x + 24, y + 16, 4, 8);
                break;
            case 'down':
                // Arms down
                this.ctx.fillRect(x + 4, y + 24, 4, 8);
                this.ctx.fillRect(x + 24, y + 24, 4, 8);
                break;
            case 'left':
                // Arms to the left
                this.ctx.fillRect(x + 4, y + 16, 8, 4);
                this.ctx.fillRect(x + 4, y + 24, 8, 4);
                break;
            case 'right':
                // Arms to the right
                this.ctx.fillRect(x + 20, y + 16, 8, 4);
                this.ctx.fillRect(x + 20, y + 24, 8, 4);
                break;
        }
    }

    draw() {
        if (this.gameOver) return;
        
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw grid
        for (let y = 0; y < this.grid.length; y++) {
            for (let x = 0; x < this.grid[y].length; x++) {
                const tile = this.grid[y][x];
                const xPos = x * this.tileSize;
                const yPos = y * this.tileSize;
                
                // Draw dirt with soil quality influence
                const baseColor = '#D2B48C';
                const qualityFactor = tile.soilQuality / 100;
                const r = parseInt(baseColor.slice(1, 3), 16) * qualityFactor;
                const g = parseInt(baseColor.slice(3, 5), 16) * qualityFactor;
                const b = parseInt(baseColor.slice(5, 7), 16) * qualityFactor;
                this.ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
                this.ctx.fillRect(xPos, yPos, this.tileSize, this.tileSize);
                
                // Draw grid lines
                this.ctx.strokeStyle = '#8B4513';
                this.ctx.strokeRect(xPos, yPos, this.tileSize, this.tileSize);
                
                // Draw tile state
                switch (tile.state) {
                    case 'depleted':
                        // Draw warning pattern for depleted soil
                        this.ctx.fillStyle = 'rgba(255, 0, 0, 0.3)';
                        this.ctx.fillRect(xPos, yPos, this.tileSize, this.tileSize);
                        this.ctx.fillStyle = '#FF0000';
                        this.ctx.font = '12px Arial';
                        this.ctx.fillText('⚠', xPos + 5, yPos + 15);
                        break;
                    case 'tilled':
                        this.ctx.fillStyle = '#8B4513';
                        this.ctx.fillRect(xPos, yPos, this.tileSize, this.tileSize);
                        break;
                    case 'planted':
                        const growthPercent = tile.growth / 100;
                        let soilColor;
                        if (growthPercent < 0.25) {
                            soilColor = '#654321';
                        } else if (growthPercent < 0.5) {
                            soilColor = '#5C4033';
                        } else if (growthPercent < 0.75) {
                            soilColor = '#4B3621';
                        } else {
                            soilColor = '#3D2811';
                        }
                        
                        this.ctx.fillStyle = soilColor;
                        this.ctx.fillRect(xPos, yPos, this.tileSize, this.tileSize);
                        
                        if (growthPercent > 0 && tile.cropType) {
                            const crop = this.cropTypes[tile.cropType];
                            this.ctx.fillStyle = crop.color;
                            const plantHeight = (this.tileSize * growthPercent) / 2;
                            this.ctx.fillRect(xPos + this.tileSize/4, yPos + this.tileSize - plantHeight, this.tileSize/2, plantHeight);
                        }
                        break;
                    case 'ready':
                        this.ctx.fillStyle = '#3D2811';
                        this.ctx.fillRect(xPos, yPos, this.tileSize, this.tileSize);
                        
                        if (tile.cropType) {
                            const crop = this.cropTypes[tile.cropType];
                            this.ctx.fillStyle = crop.color;
                            this.ctx.fillRect(xPos + this.tileSize/4, yPos + this.tileSize/4, this.tileSize/2, this.tileSize/2);
                        }
                        break;
                }
            }
        }
        
        // Draw player
        this.drawPlayer();
        
        // Draw sustainability info
        this.drawSustainabilityInfo();
    }

    gameLoop() {
        this.update();
        this.draw();
        requestAnimationFrame(() => this.gameLoop());
    }
}

// Start the game when the page loads
window.addEventListener('load', () => {
    new Game();
}); 