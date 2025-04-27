// Game state
let gameState = {
    carbonFootprint: 0,
    waterUsage: 0,
    wasteProduction: 0,
    energyUsage: 0,
    money: 1000,
    interactionDistance: 5.0,
    originalCanvasWidth: 900,
    originalCanvasHeight: 700,
    climate: {
        year: 2020,
        day: 1,
        temperature: 15.3,
        co2: 410,
        dayStartTime: Date.now() // Add day start time
    },
    status: {
        health: 100,
        hunger: 100,
        exhaustion: 100
    },
    time: {
        isPaused: false,
        isFastForward: false,
        savedState: null,
        savedDayProgress: 0,
        lastYearAdvance: null
    }
};

// Sound effects
const sounds = {
    walk: null,
    click: null,
    button: null
};

// Initialize sounds
function initSounds() {
    // Create audio elements
    sounds.walk = new Audio();
    sounds.click = new Audio();
    sounds.button = new Audio();
    
    // Set sources
    sounds.walk.src = 'sounds/walk.mp3';
    sounds.click.src = 'sounds/click.mp3';
    sounds.button.src = 'sounds/button.mp3';
    
    // Set volume
    sounds.walk.volume = 0.3;
    sounds.click.volume = 0.5;
    sounds.button.volume = 0.5;
    
    // Set loop for walking sound
    sounds.walk.loop = true;
    
    // Preload sounds
    Object.values(sounds).forEach(sound => {
        sound.load();
    });
}

// Canvas variables
let canvas, ctx;
let objects = [];
let currentObject = null;
let interactionCooldown = false;
let player = {
    x: 400,
    y: 300,
    width: 40,
    height: 40,
    speed: 20,
    avatar: 'default'
};

// Initialize the game
function init() {
    // Initialize sounds
    initSounds();

    // Create canvas
    canvas = document.createElement('canvas');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    document.getElementById('game-container').appendChild(canvas);
    ctx = canvas.getContext('2d');

    // Create climate stats bar
    createClimateStatsBar();

    // Create status bars
    createStatusBars();

    // Create time controls
    createTimeControls();

    // Create interactive objects
    createInteractiveObjects();

    // Event listeners
    window.addEventListener('resize', onWindowResize);
    document.addEventListener('keydown', onKeyDown);
    document.getElementById('start-button').addEventListener('click', () => {
        playSound('button');
        startGame();
    });
    document.getElementById('settings-button').addEventListener('click', () => {
        playSound('button');
        toggleSettings();
    });

    // Initialize avatar selection
    initAvatarSelection();

    // Initialize settings UI
    initSettingsUI();

    // Start animation loop
    animate();

    // Start climate timer
    startClimateTimer();

    // Start status update timer
    startStatusTimer();
}

// Calculate day progress (0-100%)
function calculateDayProgress() {
    if (gameState.time.isPaused) {
        return (Date.now() - gameState.climate.dayStartTime) / (5 * 60 * 1000) * 100;
    }
    
    const dayDuration = 5 * 60 * 1000; // 5 minutes in milliseconds
    const currentTime = Date.now();
    const elapsedTime = currentTime - gameState.climate.dayStartTime;
    
    // If a full day has passed, reset the day start time
    if (elapsedTime >= dayDuration) {
        gameState.climate.dayStartTime = currentTime;
        return 0;
    }
    
    return (elapsedTime / dayDuration) * 100;
}

// Create climate stats bar
function createClimateStatsBar() {
    const statsBar = document.createElement('div');
    statsBar.className = 'climate-stats-bar';
    statsBar.innerHTML = `
        <div class="climate-stat">
            <span>Year:</span>
            <span id="climate-year">${gameState.climate.year}</span>
            <div class="year-explanation">
                <h3>Current Date</h3>
                <div class="date-display">
                    <span>Day ${gameState.climate.day}</span>
                    <div class="day-progress">
                        <div class="day-progress-fill" style="width: ${calculateDayProgress()}%"></div>
                    </div>
                    <span class="day-progress-text">${Math.round(calculateDayProgress())}%</span>
                </div>
            </div>
        </div>
        <div class="climate-stat">
            <span>Temp:</span>
            <span id="climate-temp">${gameState.climate.temperature.toFixed(2)}°C</span>
            <div class="temperature-explanation">
                <h3>Temperature Ranges</h3>
                <div class="temperature-range">
                    <div class="temperature-color freezing"></div>
                    <div class="temperature-description">Freezing (Below 0°C): Extreme cold conditions</div>
                </div>
                <div class="temperature-range">
                    <div class="temperature-color cold"></div>
                    <div class="temperature-description">Cold (0-10°C): Winter conditions</div>
                </div>
                <div class="temperature-range">
                    <div class="temperature-color cool"></div>
                    <div class="temperature-description">Cool (10-20°C): Spring/Fall conditions</div>
                </div>
                <div class="temperature-range">
                    <div class="temperature-color warm"></div>
                    <div class="temperature-description">Warm (20-30°C): Summer conditions</div>
                </div>
                <div class="temperature-range">
                    <div class="temperature-color hot"></div>
                    <div class="temperature-description">Hot (30-40°C): Heat wave conditions</div>
                </div>
                <div class="temperature-range">
                    <div class="temperature-color very-hot"></div>
                    <div class="temperature-description">Very Hot (Above 40°C): Extreme heat conditions</div>
                </div>
            </div>
        </div>
        <div class="climate-stat">
            <span>CO2:</span>
            <span id="climate-co2">${gameState.climate.co2}ppm</span>
        </div>
    `;
    document.body.appendChild(statsBar);
    
    // Update day progress every second
    let progressInterval;
    function updateProgressBar() {
        if (!gameState.time.isPaused) {
            const dayProgress = calculateDayProgress();
            const progressFill = document.querySelector('.day-progress-fill');
            const progressText = document.querySelector('.day-progress-text');
            const dayDisplay = document.querySelector('.date-display span');
            
            if (progressFill && progressText && dayDisplay) {
                progressFill.style.width = `${dayProgress}%`;
                progressText.textContent = `${Math.round(dayProgress)}%`;
                
                // If progress hits 100%, advance to the next day
                if (dayProgress >= 100) {
                    gameState.climate.day += 1;
                    if (gameState.climate.day > 365) {
                        gameState.climate.year += 1;
                        gameState.climate.day = 0;  // Reset to day 0 instead of 1
                    }
                    dayDisplay.textContent = `Day ${gameState.climate.day}`;
                    gameState.climate.dayStartTime = Date.now();
                }
            }
        }
    }
    
    // Start the progress bar update interval
    progressInterval = setInterval(updateProgressBar, 1000);
    
    // Store the interval ID so we can clear it later if needed
    window.progressInterval = progressInterval;
}

// Create status bars
function createStatusBars() {
    const statusBars = document.createElement('div');
    statusBars.className = 'status-bars';
    statusBars.innerHTML = `
        <div class="status-bar hunger">
            <div class="status-label">
                <span>Hunger</span>
                <span id="hunger-value">${Math.round(gameState.status.hunger)}%</span>
            </div>
            <div class="status-bar-fill">
                <div class="status-bar-progress" style="width: ${gameState.status.hunger}%"></div>
            </div>
        </div>
        <div class="status-bar exhaustion">
            <div class="status-label">
                <span>Exhaustion</span>
                <span id="exhaustion-value">${Math.round(gameState.status.exhaustion)}%</span>
            </div>
            <div class="status-bar-fill">
                <div class="status-bar-progress" style="width: ${gameState.status.exhaustion}%"></div>
            </div>
        </div>
    `;
    document.body.appendChild(statusBars);
}

// Create time controls
function createTimeControls() {
    const timeControls = document.createElement('div');
    timeControls.className = 'time-controls';
    timeControls.innerHTML = `
        <button class="time-button" id="play-pause">
            <i class="fas fa-play"></i>
            Play/Pause
            <div class="time-button-tooltip">
                Pause or resume the game. When paused, time and day progress will stop.
            </div>
        </button>
        <button class="time-button" id="fast-forward">
            <i class="fas fa-forward"></i>
            Fast Forward
            <div class="time-button-tooltip">
                Speed up time. Years will advance every 3 seconds while days progress normally.
            </div>
        </button>
        <button class="time-button" id="revert">
            <i class="fas fa-undo"></i>
            Revert
            <div class="time-button-tooltip">
                Revert to the last day you were at in normal time before fast forwarding
            </div>
        </button>
        <button class="time-button" id="restart">
            <i class="fas fa-redo"></i>
            Restart
            <div class="time-button-tooltip">
                Restart the game from the beginning
            </div>
        </button>
        <div class="time-display">
            <i class="fas fa-clock"></i>
            <span id="time-speed">Normal</span>
            <div class="time-button-tooltip">
                Shows the current time speed: Normal, Fast Forward, or Paused
            </div>
        </div>
    `;
    document.body.appendChild(timeControls);

    // Add event listeners
    document.getElementById('play-pause').addEventListener('click', togglePause);
    document.getElementById('fast-forward').addEventListener('click', toggleFastForward);
    document.getElementById('revert').addEventListener('click', revertTime);
    document.getElementById('restart').addEventListener('click', restartGame);
}

function togglePause() {
    gameState.time.isPaused = !gameState.time.isPaused;
    const button = document.getElementById('play-pause');
    button.classList.toggle('active');
    button.querySelector('i').className = gameState.time.isPaused ? 'fas fa-play' : 'fas fa-pause';
    
    // Update time speed display
    const timeSpeedDisplay = document.getElementById('time-speed');
    if (gameState.time.isPaused) {
        timeSpeedDisplay.textContent = 'Paused';
    } else {
        timeSpeedDisplay.textContent = gameState.time.isFastForward ? 'Fast Forward' : 'Normal';
    }
    
    if (gameState.time.isPaused) {
        clearInterval(window.climateInterval);
        // Save the current day progress when pausing
        gameState.time.savedDayProgress = calculateDayProgress();
    } else {
        // Restore the day start time based on the saved progress
        const dayDuration = 5 * 60 * 1000;
        const currentTime = Date.now();
        const elapsedTime = (gameState.time.savedDayProgress / 100) * dayDuration;
        gameState.climate.dayStartTime = currentTime - elapsedTime;
        startClimateTimer();
    }
}

function toggleFastForward() {
    gameState.time.isFastForward = !gameState.time.isFastForward;
    const button = document.getElementById('fast-forward');
    button.classList.toggle('active');
    
    // Save current state when entering fast forward
    if (gameState.time.isFastForward) {
        gameState.time.savedState = JSON.parse(JSON.stringify(gameState));
    }
    
    // Update time speed display
    const timeSpeedDisplay = document.getElementById('time-speed');
    if (!gameState.time.isPaused) {
        timeSpeedDisplay.textContent = gameState.time.isFastForward ? 'Fast Forward' : 'Normal';
    }
    
    // Restart timer with appropriate speed
    clearInterval(window.climateInterval);
    startClimateTimer();
}

function revertTime() {
    if (gameState.time.savedState) {
        // Restore saved state
        gameState = JSON.parse(JSON.stringify(gameState.time.savedState));
        
        // Update UI
        updateStats();
        updateBackgroundGradient(gameState.climate.temperature);
        updateStatusBars();
        
        // Reset fast forward
        gameState.time.isFastForward = false;
        document.getElementById('fast-forward').classList.remove('active');
        document.getElementById('time-speed').textContent = 'Normal';
        
        // Restart timer
        clearInterval(window.climateInterval);
        startClimateTimer();
    }
}

// Restart game function
function restartGame() {
    // Reset game state to initial values
    gameState = {
        carbonFootprint: 0,
        waterUsage: 0,
        wasteProduction: 0,
        energyUsage: 0,
        money: 1000,
        interactionDistance: 5.0,
        originalCanvasWidth: 900,
        originalCanvasHeight: 700,
        climate: {
            year: 2020,
            day: 0,  // Start from day 0
            temperature: 15.3,
            co2: 410,
            dayStartTime: Date.now()
        },
        status: {
            health: 100,
            hunger: 100,
            exhaustion: 100
        },
        time: {
            isPaused: false,
            isFastForward: false,
            savedState: null,
            savedDayProgress: 0,
            lastYearAdvance: null
        }
    };

    // Reset UI elements
    document.getElementById('time-speed').textContent = 'Normal';
    const playPauseButton = document.getElementById('play-pause');
    playPauseButton.classList.remove('active');
    playPauseButton.querySelector('i').className = 'fas fa-pause';
    document.getElementById('fast-forward').classList.remove('active');

    // Clear intervals
    clearInterval(window.climateInterval);
    clearInterval(window.progressInterval);
    clearInterval(window.statusInterval);

    // Update existing elements instead of removing them
    document.querySelector('.climate-stats-bar').style.display = 'flex';
    document.querySelector('.status-bars').style.display = 'block';
    document.querySelector('.time-controls').style.display = 'flex';

    // Update the displays with initial values
    document.getElementById('climate-year').textContent = gameState.climate.year;
    document.getElementById('climate-temp').textContent = `${gameState.climate.temperature.toFixed(2)}°C`;
    document.getElementById('climate-co2').textContent = `${gameState.climate.co2}ppm`;
    document.querySelector('.date-display span').textContent = `Day ${gameState.climate.day}`;
    
    // Update status bars
    document.getElementById('hunger-value').textContent = '100%';
    document.querySelector('.hunger .status-bar-progress').style.width = '100%';
    document.getElementById('exhaustion-value').textContent = '100%';
    document.querySelector('.exhaustion .status-bar-progress').style.width = '100%';

    // Reset time state
    gameState.time.isPaused = false;
    gameState.time.isFastForward = false;

    // Restart timers
    startClimateTimer();
    startStatusTimer();

    // Reset day progress
    const progressFill = document.querySelector('.day-progress-fill');
    if (progressFill) {
        progressFill.style.width = '0%';
    }
    const progressText = document.querySelector('.day-progress-text');
    if (progressText) {
        progressText.textContent = '0%';
    }
}

// Create interactive objects in the scene
function createInteractiveObjects() {
    objects = [];

    // Residential Area (Top Left)
    objects.push({
        x: 400, y: 200, width: 120, height: 100,
        type: 'house',
        name: 'Your Home',
        impact: 0,
        description: 'Your sustainable living space. Make eco-friendly choices here!',
        options: [
            { text: 'Install solar panels', impact: 30, cost: -500 },
            { text: 'Upgrade insulation', impact: 20, cost: -300 },
            { text: 'Install smart thermostat', impact: 15, cost: -200 },
            { text: 'Do nothing', impact: -10, cost: 0 }
        ]
    });

    // Home Features
    objects.push({
        x: 350, y: 150, width: 40, height: 40,
        type: 'kitchen',
        name: 'Kitchen',
        impact: 0,
        description: 'Choose your kitchen habits.',
        options: [
            { text: 'Cook plant-based meal', impact: 12, cost: -10 },
            { text: 'Cook beef dinner', impact: -18, cost: -25 },
            { text: 'Use dishwasher', impact: 5, cost: -3 },
            { text: 'Hand wash dishes inefficiently', impact: -5, cost: -3 },
            { text: 'Compost food waste', impact: 10, cost: -5 },
            { text: 'Throw food waste in trash', impact: -10, cost: 0 }
        ]
    });

    objects.push({
        x: 450, y: 150, width: 40, height: 40,
        type: 'garden',
        name: 'Garden',
        impact: 0,
        description: 'Choose how you grow your food.',
        options: [
            { text: 'Plant vegetables', impact: 10, cost: -30 },
            { text: 'Use synthetic fertilizer', impact: -8, cost: -10 },
            { text: 'Use compost fertilizer', impact: 12, cost: -20 }
        ]
    });

    objects.push({
        x: 400, y: 300, width: 40, height: 40,
        type: 'bathroom',
        name: 'Bathroom',
        impact: 0,
        description: 'Choose your water habits.',
        options: [
            { text: 'Install low-flow showerhead', impact: 10, cost: -25 },
            { text: 'Fix leaky faucet', impact: 8, cost: -15 },
            { text: 'Take long hot showers', impact: -12, cost: 0 },
            { text: 'Take quick showers', impact: 8, cost: 0 }
        ]
    });

    objects.push({
        x: 350, y: 250, width: 40, height: 40,
        type: 'living',
        name: 'Living Room',
        impact: 0,
        description: 'Manage your comfort sustainably.',
        options: [
            { text: 'Use natural lighting', impact: 8, cost: 0 },
            { text: 'Set thermostat to eco mode', impact: 10, cost: 0 },
            { text: 'Blast AC all day', impact: -15, cost: -5 },
            { text: 'Unplug unused electronics', impact: 5, cost: 0 }
        ]
    });

    objects.push({
        x: 450, y: 250, width: 60, height: 40,
        type: 'bed',
        name: 'Bedroom',
        impact: 0,
        description: 'Sleep to recover energy and health.',
        options: [
            { text: 'Sleep for 8 hours', impact: 0, cost: 0 }
        ]
    });

    // Shopping District (Top Right)
    objects.push({
        x: 1000, y: 200, width: 60, height: 60,
        type: 'shopping',
        name: 'Fast Fashion Store',
        impact: -20,
        description: 'Fast, cheap, environmentally damaging fashion.',
        options: [
            { text: 'Buy cheap t-shirt', impact: -8, cost: -10 },
            { text: 'Buy jeans', impact: -12, cost: -30 },
            { text: 'Repair old clothes', impact: 8, cost: -5 }
        ]
    });

    objects.push({
        x: 1100, y: 200, width: 60, height: 60,
        type: 'shopping',
        name: 'Sustainable Fashion Store',
        impact: 10,
        description: 'Sustainable and ethical clothing.',
        options: [
            { text: 'Buy organic cotton t-shirt', impact: 6, cost: -25 },
            { text: 'Buy recycled jeans', impact: 9, cost: -60 },
            { text: 'Buy eco-friendly jacket', impact: 12, cost: -100 }
        ]
    });

    objects.push({
        x: 1050, y: 300, width: 80, height: 60,
        type: 'store',
        name: 'Eco Store',
        impact: 0,
        description: 'Purchase sustainable home improvements.',
        options: [
            { text: 'Buy solar panels', impact: 30, cost: -500 },
            { text: 'Buy rain barrel', impact: 15, cost: -100 },
            { text: 'Buy compost bin', impact: 10, cost: -50 }
        ]
    });

    // Transportation Hub (Middle)
    objects.push({
        x: 700, y: 400, width: 80, height: 40,
        type: 'transport',
        name: 'Gas Car',
        impact: -15,
        description: 'High emission travel options.',
        options: [
            { text: 'Drive to work', impact: -10, cost: -20 },
            { text: 'Idle engine while parked', impact: -20, cost: 0 },
            { text: 'Sell and upgrade', impact: 15, cost: -200 }
        ]
    });

    objects.push({
        x: 800, y: 400, width: 80, height: 40,
        type: 'transport',
        name: 'Electric Car',
        impact: 8,
        description: 'Cleaner transportation.',
        options: [
            { text: 'Drive to work', impact: 5, cost: -5 },
            { text: 'Charge with solar', impact: 10, cost: -100 },
            { text: 'Charge with coal power', impact: -5, cost: -20 }
        ]
    });

    // Community Area (Bottom Left)
    objects.push({
        x: 400, y: 500, width: 60, height: 60,
        type: 'thrift',
        name: 'Thrift Store',
        impact: 8,
        description: 'Reuse and recycle consumer goods.',
        options: [
            { text: 'Sell used clothes', impact: 5, cost: 50 },
            { text: 'Sell used furniture', impact: 8, cost: 100 },
            { text: 'Buy secondhand electronics', impact: 6, cost: -30 }
        ]
    });

    objects.push({
        x: 500, y: 500, width: 60, height: 60,
        type: 'market',
        name: "Farmer's Market",
        impact: 12,
        description: 'Support local agriculture.',
        options: [
            { text: 'Sell homegrown vegetables', impact: 10, cost: 40 },
            { text: 'Sell herbs', impact: 6, cost: 30 },
            { text: 'Buy seasonal produce', impact: 8, cost: -20 }
        ]
    });

    // New Locations (Bottom Right)
    objects.push({
        x: 1000, y: 500, width: 80, height: 60,
        type: 'park',
        name: 'Community Park',
        impact: 18,
        description: 'Promote eco activities.',
        options: [
            { text: 'Join tree planting', impact: 12, cost: 0 },
            { text: 'Attend eco workshop', impact: 10, cost: -20 },
            { text: 'Use reusable picnicware', impact: 5, cost: 0 }
        ]
    });

    objects.push({
        x: 1100, y: 500, width: 80, height: 60,
        type: 'recycling',
        name: 'Recycling Center',
        impact: 12,
        description: 'Proper disposal of waste.',
        options: [
            { text: 'Recycle electronics', impact: 10, cost: 0 },
            { text: 'Recycle paper/plastic', impact: 7, cost: 0 },
            { text: 'Throw recyclables in landfill', impact: -15, cost: 0 }
        ]
    });

    objects.push({
        x: 900, y: 500, width: 80, height: 60,
        type: 'library',
        name: 'Eco Library',
        impact: 8,
        description: 'Learn and spread awareness.',
        options: [
            { text: 'Read eco books', impact: 5, cost: 0 },
            { text: 'Attend sustainability lecture', impact: 8, cost: -10 },
            { text: 'Borrow gardening tools', impact: 6, cost: 0 }
        ]
    });

    // Nature Area (Top Center)
    objects.push({
        x: 700, y: 200, width: 100, height: 80,
        type: 'forest',
        name: 'Community Forest',
        impact: 25,
        description: 'Conserve biodiversity.',
        options: [
            { text: 'Join conservation group', impact: 15, cost: 0 },
            { text: 'Learn about local wildlife', impact: 8, cost: 0 },
            { text: 'Participate in tree census', impact: 10, cost: 0 }
        ]
    });

    objects.push({
        x: 700, y: 300, width: 80, height: 60,
        type: 'garden',
        name: 'Community Garden',
        impact: 18,
        description: 'Grow food and build community.',
        options: [
            { text: 'Plant community plot', impact: 10, cost: -20 },
            { text: 'Donate produce', impact: 12, cost: 0 },
            { text: 'Teach gardening classes', impact: 8, cost: 0 }
        ]
    });
}

// Handle window resize
function onWindowResize() {
    const oldWidth = canvas.width;
    const oldHeight = canvas.height;
    
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    
    // Scale object positions
    const scaleX = canvas.width / oldWidth;
    const scaleY = canvas.height / oldHeight;
    
    objects.forEach(obj => {
        obj.x *= scaleX;
        obj.y *= scaleY;
        obj.width *= scaleX;
        obj.height *= scaleY;
    });
    
    // Scale player position
    player.x *= scaleX;
    player.y *= scaleY;
    player.width *= scaleX;
    player.height *= scaleY;
}

// Handle key down events
function onKeyDown(event) {
    if (document.getElementById('modal').style.display === 'block') {
        return;
    }

    let isMoving = false;

    switch (event.code) {
        case 'KeyW':
            if (player.y - player.speed > player.width/2) {
                player.y -= player.speed;
                isMoving = true;
            }
            break;
        case 'KeyS':
            if (player.y + player.speed < canvas.height - player.width/2) {
                player.y += player.speed;
                isMoving = true;
            }
            break;
        case 'KeyA':
            if (player.x - player.speed > player.width/2) {
                player.x -= player.speed;
                isMoving = true;
            }
            break;
        case 'KeyD':
            if (player.x + player.speed < canvas.width - player.width/2) {
                player.x += player.speed;
                isMoving = true;
            }
            break;
        case 'KeyE':
            if (currentObject && !interactionCooldown) {
                const distance = Math.sqrt(
                    Math.pow(player.x - currentObject.x, 2) + 
                    Math.pow(player.y - currentObject.y, 2)
                );
                if (distance <= gameState.interactionDistance * 10) {
                    playSound('click');
                    showInteractionModal(currentObject);
                    interactionCooldown = true;
                    setTimeout(() => {
                        interactionCooldown = false;
                    }, 500);
                } else {
                    showInteractionPrompt(currentObject.name, true);
                }
            }
            break;
        case 'Escape':
            if (controls.isLocked) {
                controls.unlock();
                document.querySelector('.start-screen').style.display = 'flex';
            }
            break;
    }

    // Handle walking sound
    if (isMoving) {
        if (sounds.walk.paused) {
            sounds.walk.play().catch(e => console.log('Audio play error:', e));
        }
    } else {
        sounds.walk.pause();
    }
}

// Play sound with error handling
function playSound(soundName) {
    const sound = sounds[soundName];
    if (sound) {
        sound.currentTime = 0; // Reset to start
        sound.play().catch(e => console.log('Audio play error:', e));
    }
}

// Draw objects and check for interaction
function drawObjects() {
    objects.forEach(obj => {
        // Create object element if it doesn't exist
        if (!obj.element) {
            obj.element = document.createElement('div');
            obj.element.className = `object ${obj.type}`;
            obj.element.style.width = `${obj.width}px`;
            obj.element.style.height = `${obj.height}px`;
            obj.element.style.left = `${obj.x - obj.width/2}px`;
            obj.element.style.top = `${obj.y - obj.height/2}px`;
            
            // Add tooltip
            const tooltip = document.createElement('div');
            tooltip.className = 'object-tooltip';
            tooltip.innerHTML = `
                <h3>${obj.name}</h3>
                <p>${obj.description}</p>
            `;
            obj.element.appendChild(tooltip);
            
            document.body.appendChild(obj.element);
        }
        
        // Update position
        obj.element.style.left = `${obj.x - obj.width/2}px`;
        obj.element.style.top = `${obj.y - obj.height/2}px`;
        
        // Check for interaction
        const distance = Math.sqrt(
            Math.pow(player.x - obj.x, 2) + 
            Math.pow(player.y - obj.y, 2)
        );
        
        if (distance <= gameState.interactionDistance * 10) {
            currentObject = obj;
            obj.element.style.transform = 'translateY(-5px)';
            obj.element.style.boxShadow = '0 8px 15px rgba(0, 0, 0, 0.2)';
        } else {
            obj.element.style.transform = 'translateY(0)';
            obj.element.style.boxShadow = 'none';
        }
    });
}

// Animation loop
function animate() {
    requestAnimationFrame(animate);
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw ground
    ctx.fillStyle = '#e8e8e8';
    ctx.fillRect(0, canvas.height - 100, canvas.width, 100);
    
    // Draw player with selected avatar
    drawPlayer();
    
    // Draw objects
    drawObjects();
}

// Draw player with selected avatar
function drawPlayer() {
    const radius = player.width / 2;
    const scale = radius / 2; // Scale factor for pixel art
    
    // Save context state
    ctx.save();
    
    // Set pixel art style
    ctx.imageSmoothingEnabled = false;
    
    switch(player.avatar) {
        case 'default':
            // Farmer (orange overalls)
            drawStardewCharacter(player.x, player.y, scale, '#ff9f43', '#8d6e63', '#ffd700');
            break;
            
        case 'eco':
            // Eco Warrior (green outfit with leaf hat)
            drawStardewCharacter(player.x, player.y, scale, '#00b894', '#2ecc71', '#27ae60');
            break;
            
        case 'student':
            // Student (blue outfit with backpack)
            drawStardewCharacter(player.x, player.y, scale, '#3498db', '#2980b9', '#1abc9c');
            break;
            
        case 'professional':
            // Professional (purple suit)
            drawStardewCharacter(player.x, player.y, scale, '#9b59b6', '#8e44ad', '#f1c40f');
            break;
    }
    
    // Restore context state
    ctx.restore();
}

// Draw Stardew Valley style character
function drawStardewCharacter(x, y, scale, skinColor, clothesColor, hairColor) {
    // Head
    ctx.fillStyle = skinColor;
    ctx.fillRect(x - scale, y - scale * 2, scale * 2, scale * 2);
    
    // Hair
    ctx.fillStyle = hairColor;
    ctx.fillRect(x - scale, y - scale * 2.5, scale * 2, scale * 0.5);
    
    // Eyes
    ctx.fillStyle = '#000000';
    ctx.fillRect(x - scale * 0.5, y - scale * 1.5, scale * 0.3, scale * 0.3);
    ctx.fillRect(x + scale * 0.2, y - scale * 1.5, scale * 0.3, scale * 0.3);
    
    // Body
    ctx.fillStyle = clothesColor;
    ctx.fillRect(x - scale, y, scale * 2, scale * 2);
    
    // Arms
    ctx.fillStyle = skinColor;
    ctx.fillRect(x - scale * 1.5, y + scale * 0.5, scale * 0.5, scale * 1.5);
    ctx.fillRect(x + scale, y + scale * 0.5, scale * 0.5, scale * 1.5);
    
    // Legs
    ctx.fillStyle = clothesColor;
    ctx.fillRect(x - scale * 0.5, y + scale * 2, scale * 0.5, scale * 1.5);
    ctx.fillRect(x, y + scale * 2, scale * 0.5, scale * 1.5);
}

// Show interaction prompt
function showInteractionPrompt(name, tooFar = false) {
    const prompt = document.querySelector('.interaction-prompt');
    if (tooFar) {
        prompt.textContent = `Too far to interact with ${name}. Move closer!`;
        prompt.style.color = '#ff4444';
    } else {
        prompt.textContent = `Press E to interact with ${name}`;
        prompt.style.color = '#ffffff';
    }
    prompt.style.display = 'block';
    prompt.style.opacity = '1';
    
    // Automatically hide after 3 seconds
    setTimeout(() => {
        prompt.style.opacity = '0';
        setTimeout(() => {
            prompt.style.display = 'none';
        }, 500); // Wait for transition to complete
    }, 3000);
}

// Hide interaction prompt
function hideInteractionPrompt() {
    const prompt = document.querySelector('.interaction-prompt');
    prompt.style.opacity = '0';
    setTimeout(() => {
        prompt.style.display = 'none';
    }, 500); // Wait for transition to complete
}

// Show interaction modal
function showInteractionModal(data) {
    const modal = document.getElementById('modal');
    const modalContent = modal.querySelector('.modal-content');
    
    // Clear previous content
    modalContent.innerHTML = '';
    
    // Add close button first
    const closeButton = document.createElement('span');
    closeButton.className = 'close';
    closeButton.innerHTML = '&times;';
    closeButton.onclick = () => closeModal();
    modalContent.appendChild(closeButton);
    
    // Add title and description
    const title = document.createElement('h2');
    title.textContent = data.name;
    modalContent.appendChild(title);

    const description = document.createElement('p');
    description.className = 'modal-description';
    description.textContent = data.description;
    modalContent.appendChild(description);
    
    // Add options
    const options = document.createElement('div');
    options.className = 'modal-options';
    
    data.options.forEach(option => {
        const optionDiv = document.createElement('div');
        optionDiv.className = 'modal-option';
        
        const optionText = document.createElement('span');
        optionText.textContent = option.text;
        optionDiv.appendChild(optionText);
        
        const optionDetails = document.createElement('div');
        optionDetails.className = 'option-details';
        optionDetails.innerHTML = `
            <span class="impact ${option.impact > 0 ? 'positive' : 'negative'}">
                ${option.impact > 0 ? '+' : ''}${option.impact} Impact
            </span>
            <span class="cost">
                $${Math.abs(option.cost)} ${option.cost < 0 ? 'Cost' : 'Gain'}
            </span>
        `;
        optionDiv.appendChild(optionDetails);
        
        optionDiv.onclick = () => handleInteraction(data, option);
        options.appendChild(optionDiv);
    });
    
    // Add cancel option
    const cancelOption = document.createElement('div');
    cancelOption.className = 'modal-option cancel';
    cancelOption.textContent = 'Cancel';
    cancelOption.onclick = () => closeModal();
    options.appendChild(cancelOption);
    
    modalContent.appendChild(options);
    
    // Show modal
    modal.style.display = 'block';
    
    // Add click outside to close
    modal.onclick = (event) => {
        if (event.target === modal) {
            closeModal();
        }
    };
    
    // Add escape key to close
    document.addEventListener('keydown', handleEscapeKey);
}

// Close modal function
function closeModal() {
    const modal = document.getElementById('modal');
    modal.style.display = 'none';
    document.removeEventListener('keydown', handleEscapeKey);
    
    // Re-enable controls if they were locked
    if (controls.isLocked) {
        controls.lock();
    }
}

// Handle escape key
function handleEscapeKey(event) {
    if (event.code === 'Escape') {
        closeModal();
        // Don't prevent default to allow normal escape key behavior
    }
}

// Handle interaction
function handleInteraction(data, option) {
    // Update game state based on interaction
    gameState.carbonFootprint += option.impact;
    gameState.money += option.cost;
    
    // Update climate based on interaction
    if (option.impact < 0) {
        gameState.climate.co2 += Math.abs(option.impact) * 2;
    } else {
        gameState.climate.co2 -= option.impact;
    }
    
    // Update resource usage based on interaction type and option
    switch(data.type) {
        case 'kitchen':
            if (option.text.includes('plant-based meal')) {
                gameState.waterUsage += 2;
                gameState.wasteProduction += 1;
                gameState.energyUsage += 2;
                gameState.status.hunger = Math.min(100, gameState.status.hunger + 30);
                gameState.status.exhaustion = Math.max(0, gameState.status.exhaustion - 10);
                gameState.status.health = Math.min(100, gameState.status.health + 10);
            } else if (option.text.includes('dishwasher')) {
                gameState.waterUsage += 3;
                gameState.wasteProduction += 0;
                gameState.energyUsage += 3;
                gameState.status.hunger = Math.min(100, gameState.status.hunger + 10);
                gameState.status.exhaustion = Math.max(0, gameState.status.exhaustion - 3);
            } else if (option.text.includes('compost')) {
                gameState.waterUsage += 0;
                gameState.wasteProduction -= 2;
                gameState.energyUsage += 1;
                gameState.status.hunger = Math.min(100, gameState.status.hunger + 5);
                gameState.status.exhaustion = Math.max(0, gameState.status.exhaustion - 5);
                gameState.status.health = Math.min(100, gameState.status.health + 5);
            }
            break;
            
        case 'garden':
            if (option.text.includes('vegetables')) {
                gameState.waterUsage += 2;
                gameState.wasteProduction += 0;
                gameState.energyUsage += 1;
                gameState.status.hunger = Math.min(100, gameState.status.hunger + 5);
                gameState.status.exhaustion = Math.max(0, gameState.status.exhaustion - 15);
                gameState.status.health = Math.min(100, gameState.status.health + 15);
            } else if (option.text.includes('rain barrel')) {
                gameState.waterUsage -= 3;
                gameState.wasteProduction += 1;
                gameState.energyUsage += 0;
                gameState.status.hunger = Math.min(100, gameState.status.hunger + 5);
                gameState.status.exhaustion = Math.max(0, gameState.status.exhaustion - 10);
                gameState.status.health = Math.min(100, gameState.status.health + 5);
            } else if (option.text.includes('composting')) {
                gameState.waterUsage += 0;
                gameState.wasteProduction -= 2;
                gameState.energyUsage += 1;
                gameState.status.hunger = Math.min(100, gameState.status.hunger + 5);
                gameState.status.exhaustion = Math.max(0, gameState.status.exhaustion - 8);
                gameState.status.health = Math.min(100, gameState.status.health + 10);
            }
            break;
            
        case 'bathroom':
            if (option.text.includes('showerhead')) {
                gameState.waterUsage -= 2;
                gameState.wasteProduction += 1;
                gameState.energyUsage += 0;
                gameState.status.hunger = Math.min(100, gameState.status.hunger + 5);
                gameState.status.exhaustion = Math.max(0, gameState.status.exhaustion - 5);
                gameState.status.health = Math.min(100, gameState.status.health + 5);
            } else if (option.text.includes('faucet')) {
                gameState.waterUsage -= 1;
                gameState.wasteProduction += 0;
                gameState.energyUsage += 0;
                gameState.status.hunger = Math.min(100, gameState.status.hunger + 5);
                gameState.status.exhaustion = Math.max(0, gameState.status.exhaustion - 3);
                gameState.status.health = Math.min(100, gameState.status.health + 5);
            } else if (option.text.includes('cleaning products')) {
                gameState.waterUsage += 1;
                gameState.wasteProduction += 1;
                gameState.energyUsage += 0;
                gameState.status.hunger = Math.min(100, gameState.status.hunger + 5);
                gameState.status.exhaustion = Math.max(0, gameState.status.exhaustion - 5);
                gameState.status.health = Math.min(100, gameState.status.health + 5);
            }
            break;
            
        case 'living':
            if (option.text.includes('lighting')) {
                gameState.waterUsage += 0;
                gameState.wasteProduction += 0;
                gameState.energyUsage -= 2;
                gameState.status.hunger = Math.min(100, gameState.status.hunger + 5);
                gameState.status.exhaustion = Math.max(0, gameState.status.exhaustion - 5);
                gameState.status.health = Math.min(100, gameState.status.health + 5);
            } else if (option.text.includes('thermostat')) {
                gameState.waterUsage += 0;
                gameState.wasteProduction += 0;
                gameState.energyUsage -= 4;
                gameState.status.hunger = Math.min(100, gameState.status.hunger + 5);
                gameState.status.exhaustion = Math.max(0, gameState.status.exhaustion - 5);
                gameState.status.health = Math.min(100, gameState.status.health + 10);
            } else if (option.text.includes('electronics')) {
                gameState.waterUsage += 0;
                gameState.wasteProduction += 0;
                gameState.energyUsage -= 2;
                gameState.status.hunger = Math.min(100, gameState.status.hunger + 5);
                gameState.status.exhaustion = Math.max(0, gameState.status.exhaustion - 3);
                gameState.status.health = Math.min(100, gameState.status.health + 5);
            }
            break;
            
        case 'house':
            if (option.text.includes('solar panels')) {
                gameState.waterUsage += 0;
                gameState.wasteProduction += 1;
                gameState.energyUsage -= 10;
                gameState.status.hunger = Math.min(100, gameState.status.hunger + 5);
                gameState.status.exhaustion = Math.max(0, gameState.status.exhaustion - 25);
                gameState.status.health = Math.min(100, gameState.status.health + 20);
            } else if (option.text.includes('insulation')) {
                gameState.waterUsage += 0;
                gameState.wasteProduction += 1;
                gameState.energyUsage -= 8;
                gameState.status.hunger = Math.min(100, gameState.status.hunger + 5);
                gameState.status.exhaustion = Math.max(0, gameState.status.exhaustion - 15);
                gameState.status.health = Math.min(100, gameState.status.health + 10);
            } else if (option.text.includes('thermostat')) {
                gameState.waterUsage += 0;
                gameState.wasteProduction += 0;
                gameState.energyUsage -= 5;
                gameState.status.hunger = Math.min(100, gameState.status.hunger + 5);
                gameState.status.exhaustion = Math.max(0, gameState.status.exhaustion - 5);
                gameState.status.health = Math.min(100, gameState.status.health + 5);
            }
            break;
            
        case 'transport':
            if (option.text.includes('Drive to work')) {
                gameState.waterUsage += 0;
                gameState.wasteProduction += 2;
                gameState.energyUsage += 5;
                gameState.status.hunger = Math.min(100, gameState.status.hunger + 5);
                gameState.status.exhaustion = Math.max(0, gameState.status.exhaustion - 8);
                gameState.status.health = Math.max(0, gameState.status.health - 5);
            } else if (option.text.includes('road trip')) {
                gameState.waterUsage += 0;
                gameState.wasteProduction += 3;
                gameState.energyUsage += 10;
                gameState.status.hunger = Math.min(100, gameState.status.hunger + 10);
                gameState.status.exhaustion = Math.max(0, gameState.status.exhaustion - 15);
                gameState.status.health = Math.max(0, gameState.status.health - 10);
            } else if (option.text.includes('upgrade')) {
                gameState.waterUsage += 0;
                gameState.wasteProduction += 1;
                gameState.energyUsage -= 5;
                gameState.status.hunger = Math.min(100, gameState.status.hunger + 5);
                gameState.status.exhaustion = Math.max(0, gameState.status.exhaustion - 10);
                gameState.status.health = Math.min(100, gameState.status.health + 10);
            }
            break;
            
        case 'shopping':
            if (option.text.includes('t-shirt') || option.text.includes('jeans') || option.text.includes('jacket')) {
                gameState.waterUsage += 3;
                gameState.wasteProduction += 2;
                gameState.energyUsage += 2;
                gameState.status.hunger = Math.min(100, gameState.status.hunger + 5);
                gameState.status.exhaustion = Math.max(0, gameState.status.exhaustion - 5);
                gameState.status.health = Math.max(0, gameState.status.health - 5);
            } else if (option.text.includes('organic') || option.text.includes('recycled') || option.text.includes('eco-friendly')) {
                gameState.waterUsage += 1;
                gameState.wasteProduction += 1;
                gameState.energyUsage += 1;
                gameState.status.hunger = Math.min(100, gameState.status.hunger + 5);
                gameState.status.exhaustion = Math.max(0, gameState.status.exhaustion - 3);
                gameState.status.health = Math.min(100, gameState.status.health + 5);
            }
            break;

        case 'thrift':
            if (option.text.includes('clothes') || option.text.includes('furniture') || option.text.includes('electronics')) {
                gameState.wasteProduction -= 2;
                gameState.status.exhaustion = Math.max(0, gameState.status.exhaustion - 5);
                gameState.status.hunger = Math.max(0, gameState.status.hunger - 5);
            }
            break;

        case 'market':
            if (option.text.includes('vegetables') || option.text.includes('herbs') || option.text.includes('flowers')) {
                gameState.waterUsage -= 2;
                gameState.wasteProduction -= 1;
                gameState.status.exhaustion = Math.max(0, gameState.status.exhaustion - 10);
                gameState.status.hunger = Math.max(0, gameState.status.hunger - 10);
            }
            break;

        case 'store':
            if (option.text.includes('solar panels')) {
                gameState.energyUsage -= 10;
                gameState.status.health = Math.min(100, gameState.status.health + 10);
            } else if (option.text.includes('rain barrel')) {
                gameState.waterUsage -= 5;
                gameState.status.health = Math.min(100, gameState.status.health + 5);
            } else if (option.text.includes('compost bin')) {
                gameState.wasteProduction -= 3;
                gameState.status.health = Math.min(100, gameState.status.health + 5);
            }
            break;

        case 'bed':
            if (option.text.includes('Sleep')) {
                gameState.status.exhaustion = 100;
                gameState.status.health = Math.min(100, gameState.status.health + 20);
                gameState.status.hunger = Math.max(0, gameState.status.hunger - 20);
                // Advance time by one day
                advanceClimateYear();
                // Reset day progress
                gameState.climate.dayStartTime = Date.now();
                const progressFill = document.querySelector('.day-progress-fill');
                const progressText = document.querySelector('.day-progress-text');
                if (progressFill && progressText) {
                    progressFill.style.width = '0%';
                    progressText.textContent = '0%';
                }
            }
            break;
    }
    
    // Check for consequences of exhaustion and hunger
    if (gameState.status.exhaustion < 20) {
        showFeedback(-5, 0, "You're too tired! Your health is decreasing.");
        gameState.status.health = Math.max(0, gameState.status.health - 5);
    }
    if (gameState.status.hunger < 20) {
        showFeedback(-5, 0, "You're too hungry! Your health is decreasing.");
        gameState.status.health = Math.max(0, gameState.status.health - 5);
    }

    // Force sleep if exhaustion is too low
    if (gameState.status.exhaustion < 10) {
        showFeedback(0, 0, "You're exhausted! You need to sleep.");
        // Find bed object
        const bed = objects.find(obj => obj.type === 'bed');
        if (bed) {
            showInteractionModal(bed);
        }
    }

    // Update UI
    updateStats();
    updateBackgroundGradient(gameState.climate.temperature);
    updateStatusBars();
    
    // Show feedback
    showFeedback(option.impact, option.cost);
    
    // Close modal
    closeModal();
}

// Show feedback message
function showFeedback(impact, cost) {
    const feedback = document.createElement('div');
    feedback.className = 'feedback-message';
    
    const impactText = document.createElement('span');
    impactText.className = `impact ${impact > 0 ? 'positive' : 'negative'}`;
    impactText.textContent = `Impact: ${impact > 0 ? '+' : ''}${impact}`;
    feedback.appendChild(impactText);
    
    const costText = document.createElement('span');
    costText.className = `cost ${cost < 0 ? 'negative' : 'positive'}`;
    costText.textContent = `$${Math.abs(cost)} ${cost < 0 ? 'Cost' : 'Gain'}`;
    feedback.appendChild(costText);
    
    document.querySelector('.ui-overlay').appendChild(feedback);
    
    // Animate and remove
    setTimeout(() => {
        feedback.style.opacity = '0';
        setTimeout(() => feedback.remove(), 500);
    }, 2000);
}

// Toggle settings panel
function toggleSettings() {
    const settingsPanel = document.querySelector('.settings-panel');
    settingsPanel.style.display = settingsPanel.style.display === 'none' ? 'block' : 'none';
}

// Update stats display
function updateStats() {
    // Update values
    document.getElementById('carbon-footprint').textContent = gameState.carbonFootprint;
    document.getElementById('water-usage').textContent = gameState.waterUsage;
    document.getElementById('waste-production').textContent = gameState.wasteProduction;
    document.getElementById('energy-usage').textContent = gameState.energyUsage;
    document.getElementById('money').textContent = gameState.money;
    
    // Update climate stats in the bar
    document.getElementById('climate-year').textContent = gameState.climate.year;
    document.getElementById('climate-temp').textContent = `${gameState.climate.temperature.toFixed(2)}°C`;
    document.getElementById('climate-co2').textContent = `${gameState.climate.co2}ppm`;
}

// Start game
function startGame() {
    document.querySelector('.start-screen').style.display = 'none';
    document.querySelector('.climate-stats-bar').style.display = 'flex';
    controls.lock();
    
    // Ensure climate timer is running
    startClimateTimer();
}

// Update background based on temperature
function updateBackgroundGradient(temp) {
    const container = document.getElementById('game-container');

    container.classList.add('no-animation');  // <-- NEW

    container.style.animation = 'none';  // Double insurance
    container.style.backgroundSize = '100% 100%';
    container.style.backgroundPosition = 'center center';

    // Set correct static background
    if (temp < 0) {
        container.style.background = 'linear-gradient(45deg, #87CEEB, #E0F7FA)';
    } else if (temp >= 0 && temp < 10) {
        container.style.background = 'linear-gradient(45deg, #a0c8f0, #e0f7fa)';
    } else if (temp >= 10 && temp < 20) {
        container.style.background = 'linear-gradient(45deg, #b0e0e6, #f0fff0)';
    } else if (temp >= 20 && temp < 30) {
        container.style.background = 'linear-gradient(45deg, #f9e0a6, #fffacd)';
    } else if (temp >= 30 && temp < 40) {
        container.style.background = 'linear-gradient(45deg, #f5b0d2, #ffe4e1)';
    } else {
        container.style.background = 'linear-gradient(45deg, #f5a7a7, #ffe4e1)';
    }
}

// Map temperature to color gradient
function getTemperatureColor(temp) {
    if (temp < 0) {
        return 'linear-gradient(45deg, #87CEEB, #E0F7FA)'; // Freezing (light blue -> very light blue)
    } else if (temp >= 0 && temp < 10) {
        return 'linear-gradient(45deg, #B0E0E6, #E0F7FA)'; // Cold (powder blue -> very light blue)
    } else if (temp >= 10 && temp < 20) {
        return 'linear-gradient(45deg, #98FB98, #F0FFF0)'; // Cool (pale green -> honeydew)
    } else if (temp >= 20 && temp < 30) {
        return 'linear-gradient(45deg, #FFD700, #FFFACD)'; // Warm (gold -> lemon chiffon)
    } else if (temp >= 30 && temp < 40) {
        return 'linear-gradient(45deg, #FFA07A, #FFE4E1)'; // Hot (light salmon -> misty rose)
    } else {
        return 'linear-gradient(45deg, #FF6347, #FFE4E1)'; // Very Hot (tomato -> misty rose)
    }
}

// Show climate event message
function showClimateEvent(message) {
    const eventDiv = document.createElement('div');
    eventDiv.className = 'climate-event';
    eventDiv.textContent = message;
    document.body.appendChild(eventDiv);
    eventDiv.style.display = 'block';
    
    setTimeout(() => {
        eventDiv.style.opacity = '0';
        setTimeout(() => eventDiv.remove(), 500);
    }, 5000);
}

// Create death popup
function createDeathPopup() {
    const popup = document.createElement('div');
    popup.className = 'death-popup';
    popup.innerHTML = `
        <div class="death-popup-content">
            <h2>You Have Died!</h2>
            <p>Your hunger or exhaustion has reached 0%. You must restart the game.</p>
            <div class="death-popup-buttons">
                <button class="death-popup-button revert" id="death-revert">
                    <i class="fas fa-undo"></i>
                    Go Back One Day
                </button>
                <button class="death-popup-button restart" id="death-restart">
                    <i class="fas fa-redo"></i>
                    Restart Game
                </button>
            </div>
        </div>
    `;
    document.body.appendChild(popup);

    // Add event listeners
    document.getElementById('death-revert').addEventListener('click', () => {
        // Go back one day
        gameState.climate.day = Math.max(1, gameState.climate.day - 1);
        if (gameState.climate.day === 0) {
            gameState.climate.year -= 1;
            gameState.climate.day = 365;
        }
        // Reset status
        gameState.status.hunger = 100;
        gameState.status.exhaustion = 100;
        // Close popup
        popup.style.display = 'none';
        // Update UI
        updateStats();
        updateStatusBars();
    });

    document.getElementById('death-restart').addEventListener('click', () => {
        // Close popup
        popup.style.display = 'none';
        // Restart game
        restartGame();
    });

    return popup;
}

// Start status update timer
function startStatusTimer() {
    // Clear any existing interval
    if (window.statusInterval) {
        clearInterval(window.statusInterval);
    }
    
    window.statusInterval = setInterval(() => {
        // Decrease hunger over time
        if (gameState.status.hunger > 0) {
            gameState.status.hunger -= 0.1;
        }
        
        // Decrease exhaustion when moving
        if (sounds.walk && !sounds.walk.paused) {
            gameState.status.exhaustion = Math.max(0, gameState.status.exhaustion - 0.2);
        } else {
            // Increase exhaustion when resting
            gameState.status.exhaustion = Math.min(100, gameState.status.exhaustion + 0.1);
        }
        
        // Check for death from hunger
        if (gameState.status.hunger <= 0) {
            if (!document.querySelector('.death-popup')) {
                const deathPopup = createDeathPopup();
                deathPopup.style.display = 'flex';
                // Stop the status timer to prevent multiple popups
                clearInterval(window.statusInterval);
            }
        }
        
        // Force sleep when exhaustion hits 0
        if (gameState.status.exhaustion <= 0) {
            // Find bed object
            const bed = objects.find(obj => obj.type === 'bed');
            if (bed) {
                showInteractionModal(bed);
                showFeedback(0, 0, "You're exhausted! You must sleep.");
                // Prevent movement while sleeping
                player.speed = 0;
                // Reset exhaustion after showing the modal
                gameState.status.exhaustion = 0.1;
            }
        }
        
        updateStatusBars();
    }, 1000);
}

// Advance climate year and adjust temperature
function advanceClimateYear() {
    if (gameState.time.isFastForward) {
        const currentTime = Date.now();
        if (!gameState.time.lastYearAdvance || currentTime - gameState.time.lastYearAdvance >= 1500) {
            gameState.climate.year += 1;
            gameState.time.lastYearAdvance = currentTime;
        }
    } else {
        gameState.climate.day += 1;
        if (gameState.climate.day > 365) {
            gameState.climate.year += 1;
            gameState.climate.day = 1; // Fix day reset to 1
        }
    }

    gameState.climate.dayStartTime = Date.now();

    // -- New temperature update logic --
    const baselineCO2 = 410;
    const baselineTemp = 15.3;

    const co2Delta = (gameState.climate.co2 - baselineCO2);

    let tempChange = 0;

    if (co2Delta > 0) {
        tempChange = 0.01 + (co2Delta * 0.0002);
    } else if (co2Delta < 0) {
        tempChange = 0.005 + (co2Delta * 0.0003);
    } else {
        tempChange = 0.005;
    }

    gameState.climate.temperature += tempChange;

    // Lock temperature to two decimals
    gameState.climate.temperature = parseFloat(gameState.climate.temperature.toFixed(2));

    updateClimateDisplay(); 
}

let lastTempBucket = null; // Track last temp bucket for background updates

function updateClimateDisplay() {
    const temp = gameState.climate.temperature;

    // Update UI elements
    document.getElementById('climate-year').textContent = gameState.climate.year;
    document.getElementById('climate-temp').textContent = `${temp.toFixed(2)}°C`;
    document.getElementById('climate-co2').textContent = `${gameState.climate.co2}ppm`;
    
    // Determine current temperature bucket
    let tempBucket;
    if (temp < 0) tempBucket = 'freezing';
    else if (temp < 10) tempBucket = 'cold';
    else if (temp < 20) tempBucket = 'cool';
    else if (temp < 30) tempBucket = 'warm';
    else if (temp < 40) tempBucket = 'hot';
    else tempBucket = 'very-hot';

    // Only update background if the bucket has changed
    if (tempBucket !== lastTempBucket) {
        updateBackgroundGradient(temp);
        lastTempBucket = tempBucket;
    }
}

// Trigger random climate events
function triggerRandomClimateEvent() {
    const randomEvent = Math.random();
    if (randomEvent < 0.2) {
        gameState.climate.temperature += 3;
        updateBackgroundGradient(gameState.climate.temperature);
    } else if (randomEvent < 0.4) {
        gameState.money -= 100;
    }
}

// Start climate timer
function startClimateTimer() {
    // Clear any existing interval
    if (window.climateInterval) {
        clearInterval(window.climateInterval);
    }
    
    // Set interval based on current time mode
    const interval = gameState.time.isFastForward ? 1000 : 600000; // 1 second or 10 minutes
    window.climateInterval = setInterval(advanceClimateYear, interval);
}

// Update status bars
function updateStatusBars() {
    document.getElementById('hunger-value').textContent = `${Math.round(gameState.status.hunger)}%`;
    document.querySelector('.hunger .status-bar-progress').style.width = `${gameState.status.hunger}%`;
    
    document.getElementById('exhaustion-value').textContent = `${Math.round(gameState.status.exhaustion)}%`;
    document.querySelector('.exhaustion .status-bar-progress').style.width = `${gameState.status.exhaustion}%`;
}

// Initialize avatar selection
function initAvatarSelection() {
    const avatarOptions = document.querySelectorAll('.avatar-option');
    avatarOptions.forEach(option => {
        option.addEventListener('click', () => {
            playSound('click');
            // Remove selected class from all options
            avatarOptions.forEach(opt => opt.classList.remove('selected'));
            // Add selected class to clicked option
            option.classList.add('selected');
            // Update player avatar
            player.avatar = option.dataset.avatar;
        });
    });
}

// Initialize settings UI
function initSettingsUI() {
    const settingsPanel = document.createElement('div');
    settingsPanel.className = 'settings-panel';
    settingsPanel.innerHTML = `
        <h2>Settings</h2>
        <div class="setting-group">
            <label>Movement Speed</label>
            <input type="range" id="movement-speed" min="1" max="20" step="0.1" value="${player.speed}">
            <span id="speed-value">${player.speed}</span>
        </div>
        <div class="setting-group">
            <label>Avatar</label>
            <div class="avatar-options">
                <div class="avatar-option" data-avatar="default">
                    <div class="avatar-preview default"></div>
                    <span>Farmer</span>
                </div>
                <div class="avatar-option" data-avatar="eco">
                    <div class="avatar-preview eco"></div>
                    <span>Eco Warrior</span>
                </div>
                <div class="avatar-option" data-avatar="student">
                    <div class="avatar-preview student"></div>
                    <span>Student</span>
                </div>
                <div class="avatar-option" data-avatar="professional">
                    <div class="avatar-preview professional"></div>
                    <span>Professional</span>
                </div>
            </div>
        </div>
        <button id="apply-settings">Apply Settings</button>
    `;
    document.querySelector('.ui-overlay').appendChild(settingsPanel);

    // Add settings event listeners
    document.getElementById('movement-speed').addEventListener('input', (e) => {
        document.getElementById('speed-value').textContent = e.target.value;
    });

    // Add avatar selection event listeners
    const avatarOptions = settingsPanel.querySelectorAll('.avatar-option');
    avatarOptions.forEach(option => {
        option.addEventListener('click', () => {
            // Remove selected class from all options
            avatarOptions.forEach(opt => opt.classList.remove('selected'));
            // Add selected class to clicked option
            option.classList.add('selected');
            // Update player avatar
            player.avatar = option.dataset.avatar;
        });
    });

    document.getElementById('apply-settings').addEventListener('click', applySettings);
}

// Apply settings
function applySettings() {
    player.speed = parseFloat(document.getElementById('movement-speed').value);

    // Show confirmation
    const confirmation = document.createElement('div');
    confirmation.className = 'settings-confirmation';
    confirmation.textContent = 'Settings applied successfully!';
    document.querySelector('.settings-panel').appendChild(confirmation);
    setTimeout(() => confirmation.remove(), 2000);
}

// Initialize the game when the page loads
window.onload = init; 