// Game state
let gameState = {
    carbonFootprint: 0,
    waterUsage: 0,
    wasteProduction: 0,
    energyUsage: 0,
    money: 1000,
    sustainabilityScore: 0,
    interactionDistance: 5.0
};

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
    speed: 15
};

// Initialize the game
function init() {
    // Create canvas
    canvas = document.createElement('canvas');
    canvas.width = 800;
    canvas.height = 600;
    document.getElementById('game-container').appendChild(canvas);
    ctx = canvas.getContext('2d');

    // Create interactive objects
    createInteractiveObjects();

    // Event listeners
    window.addEventListener('resize', onWindowResize);
    document.addEventListener('keydown', onKeyDown);
    document.getElementById('start-button').addEventListener('click', startGame);
    document.getElementById('settings-button').addEventListener('click', toggleSettings);

    // Initialize settings UI
    initSettingsUI();

    // Start animation loop
    animate();
}

// Initialize settings UI
function initSettingsUI() {
    const settingsPanel = document.createElement('div');
    settingsPanel.className = 'settings-panel';
    settingsPanel.innerHTML = `
        <h2>Settings</h2>
        <div class="setting-group">
            <label>Movement Speed</label>
            <input type="range" id="movement-speed" min="1" max="10" step="0.1" value="${player.speed}">
            <span id="speed-value">${player.speed}</span>
        </div>
        <div class="setting-group">
            <label>Sound Volume</label>
            <input type="range" id="sound-volume" min="0" max="1" step="0.1" value="0.5">
            <span id="volume-value">50%</span>
        </div>
        <div class="setting-group">
            <label>Graphics Quality</label>
            <select id="graphics-quality">
                <option value="low">Low</option>
                <option value="medium" selected>Medium</option>
                <option value="high">High</option>
            </select>
        </div>
        <button id="apply-settings">Apply Settings</button>
    `;
    document.querySelector('.ui-overlay').appendChild(settingsPanel);

    // Add settings event listeners
    document.getElementById('movement-speed').addEventListener('input', (e) => {
        document.getElementById('speed-value').textContent = e.target.value;
    });

    document.getElementById('sound-volume').addEventListener('input', (e) => {
        document.getElementById('volume-value').textContent = `${Math.round(e.target.value * 100)}%`;
    });

    document.getElementById('apply-settings').addEventListener('click', applySettings);
}

// Apply settings
function applySettings() {
    player.speed = parseFloat(document.getElementById('movement-speed').value);
    const volume = parseFloat(document.getElementById('sound-volume').value);
    const graphicsQuality = document.getElementById('graphics-quality').value;

    // Update renderer settings based on graphics quality
    switch(graphicsQuality) {
        case 'low':
            renderer.setPixelRatio(1);
            break;
        case 'medium':
            renderer.setPixelRatio(2);
            break;
        case 'high':
            renderer.setPixelRatio(3);
            break;
    }

    // Show confirmation
    const confirmation = document.createElement('div');
    confirmation.className = 'settings-confirmation';
    confirmation.textContent = 'Settings applied successfully!';
    document.querySelector('.settings-panel').appendChild(confirmation);
    setTimeout(() => confirmation.remove(), 2000);
}

// Create interactive objects in the scene
function createInteractiveObjects() {
    // Transportation options
    objects.push({
        x: 100,
        y: 200,
        width: 80,
        height: 40,
        color: '#ff6b6b',
        type: 'transport',
        name: 'Gas Car',
        impact: -10,
        description: 'A conventional gas-powered car. High emissions but low initial cost.',
        options: [
            { text: 'Drive to work', impact: -5, cost: -20 },
            { text: 'Take a road trip', impact: -15, cost: -50 },
            { text: 'Sell and upgrade', impact: 10, cost: -200 }
        ]
    });

    objects.push({
        x: 100,
        y: 300,
        width: 80,
        height: 40,
        color: '#4ecdc4',
        type: 'transport',
        name: 'Electric Car',
        impact: 5,
        description: 'An eco-friendly electric vehicle. Low emissions but higher initial cost.',
        options: [
            { text: 'Drive to work', impact: 2, cost: -5 },
            { text: 'Take a road trip', impact: -2, cost: -25 },
            { text: 'Charge with solar', impact: 5, cost: -100 }
        ]
    });

    // Shopping options
    objects.push({
        x: 600,
        y: 200,
        width: 60,
        height: 60,
        color: '#ff9ff3',
        type: 'shopping',
        name: 'Fast Fashion Store',
        impact: -15,
        description: 'A store selling cheap, mass-produced clothing with high environmental impact.',
        options: [
            { text: 'Buy a t-shirt', impact: -5, cost: -10 },
            { text: 'Buy jeans', impact: -8, cost: -30 },
            { text: 'Buy a jacket', impact: -10, cost: -50 }
        ]
    });

    objects.push({
        x: 600,
        y: 300,
        width: 60,
        height: 60,
        color: '#1dd1a1',
        type: 'shopping',
        name: 'Sustainable Fashion Store',
        impact: 10,
        description: 'A store selling ethically produced, sustainable clothing.',
        options: [
            { text: 'Buy organic cotton t-shirt', impact: 3, cost: -25 },
            { text: 'Buy recycled jeans', impact: 5, cost: -60 },
            { text: 'Buy eco-friendly jacket', impact: 7, cost: -100 }
        ]
    });

    // House and its interactive elements
    objects.push({
        x: 350,
        y: 250,
        width: 120,
        height: 100,
        color: '#ff9f43',
        type: 'house',
        name: 'Your Home',
        impact: 0,
        description: 'Your sustainable living space. Make eco-friendly choices here!',
        options: [
            { text: 'Install solar panels', impact: 15, cost: -500 },
            { text: 'Upgrade insulation', impact: 10, cost: -300 },
            { text: 'Install smart thermostat', impact: 8, cost: -200 }
        ]
    });

    // Kitchen area
    objects.push({
        x: 300,
        y: 200,
        width: 40,
        height: 40,
        color: '#ff9f43',
        type: 'kitchen',
        name: 'Kitchen',
        impact: 0,
        description: 'Make sustainable food and cleaning choices here.',
        options: [
            { text: 'Cook plant-based meal', impact: 5, cost: -15 },
            { text: 'Use dishwasher (full load)', impact: 3, cost: -2 },
            { text: 'Compost food waste', impact: 4, cost: -20 }
        ]
    });

    // Garden area
    objects.push({
        x: 400,
        y: 200,
        width: 40,
        height: 40,
        color: '#00b894',
        type: 'garden',
        name: 'Garden',
        impact: 0,
        description: 'Grow your own food and create a sustainable outdoor space.',
        options: [
            { text: 'Plant vegetables', impact: 6, cost: -30 },
            { text: 'Install rain barrel', impact: 4, cost: -50 },
            { text: 'Start composting', impact: 5, cost: -40 }
        ]
    });

    // Bathroom area
    objects.push({
        x: 350,
        y: 300,
        width: 40,
        height: 40,
        color: '#74b9ff',
        type: 'bathroom',
        name: 'Bathroom',
        impact: 0,
        description: 'Make water-saving choices in your bathroom.',
        options: [
            { text: 'Install low-flow showerhead', impact: 4, cost: -25 },
            { text: 'Fix leaky faucet', impact: 3, cost: -15 },
            { text: 'Use eco-friendly cleaning products', impact: 2, cost: -20 }
        ]
    });

    // Living room area
    objects.push({
        x: 350,
        y: 350,
        width: 40,
        height: 40,
        color: '#a29bfe',
        type: 'living',
        name: 'Living Room',
        impact: 0,
        description: 'Manage your energy usage and comfort.',
        options: [
            { text: 'Use natural lighting', impact: 3, cost: 0 },
            { text: 'Set thermostat to eco mode', impact: 4, cost: 0 },
            { text: 'Unplug unused electronics', impact: 2, cost: 0 }
        ]
    });
}

// Handle window resize
function onWindowResize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}

// Handle key down events
function onKeyDown(event) {
    if (document.getElementById('modal').style.display === 'block') {
        return;
    }

    switch (event.code) {
        case 'KeyW':
            player.y -= player.speed;
            break;
        case 'KeyS':
            player.y += player.speed;
            break;
        case 'KeyA':
            player.x -= player.speed;
            break;
        case 'KeyD':
            player.x += player.speed;
            break;
        case 'KeyE':
            if (currentObject && !interactionCooldown) {
                const distance = Math.sqrt(
                    Math.pow(player.x - currentObject.x, 2) + 
                    Math.pow(player.y - currentObject.y, 2)
                );
                if (distance <= gameState.interactionDistance * 10) {
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
}

// Animation loop
function animate() {
    requestAnimationFrame(animate);
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw background
    ctx.fillStyle = '#f7f1e3';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw ground
    ctx.fillStyle = '#e8e8e8';
    ctx.fillRect(0, canvas.height - 100, canvas.width, 100);
    
    // Draw player
    ctx.fillStyle = '#ff9f43';
    ctx.beginPath();
    ctx.arc(player.x, player.y, player.width/2, 0, Math.PI * 2);
    ctx.fill();
    
    // Draw objects and check for interaction
    currentObject = null;
    objects.forEach(obj => {
        // Draw object
        ctx.fillStyle = obj.color;
        
        if (obj.type === 'house') {
            // Draw house with details
            ctx.fillRect(obj.x - obj.width/2, obj.y - obj.height/2, obj.width, obj.height);
            // Draw roof
            ctx.beginPath();
            ctx.moveTo(obj.x - obj.width/2, obj.y - obj.height/2);
            ctx.lineTo(obj.x, obj.y - obj.height/2 - 30);
            ctx.lineTo(obj.x + obj.width/2, obj.y - obj.height/2);
            ctx.fill();
            // Draw door
            ctx.fillStyle = '#8d6e63';
            ctx.fillRect(obj.x - 15, obj.y + 20, 30, 30);
        } else {
            ctx.fillRect(obj.x - obj.width/2, obj.y - obj.height/2, obj.width, obj.height);
        }
        
        // Add cute details
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(obj.x, obj.y - 10, 5, 0, Math.PI * 2);
        ctx.fill();
        
        // Check for interaction
        const distance = Math.sqrt(
            Math.pow(player.x - obj.x, 2) + 
            Math.pow(player.y - obj.y, 2)
        );
        if (distance <= gameState.interactionDistance * 10) {
            currentObject = obj;
            // Draw interaction indicator
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 3;
            ctx.strokeRect(
                obj.x - obj.width/2 - 5, 
                obj.y - obj.height/2 - 5, 
                obj.width + 10, 
                obj.height + 10
            );
        }
    });
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
}

// Hide interaction prompt
function hideInteractionPrompt() {
    const prompt = document.querySelector('.interaction-prompt');
    prompt.style.display = 'none';
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
    gameState.sustainabilityScore += option.impact;
    gameState.money += option.cost;
    
    // Update UI
    updateStats();
    
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
    document.getElementById('carbon-footprint').textContent = gameState.carbonFootprint;
    document.getElementById('water-usage').textContent = gameState.waterUsage;
    document.getElementById('waste-production').textContent = gameState.wasteProduction;
    document.getElementById('energy-usage').textContent = gameState.energyUsage;
    document.getElementById('money').textContent = gameState.money;
    document.getElementById('sustainability-score').textContent = gameState.sustainabilityScore;
}

// Start game
function startGame() {
    document.querySelector('.start-screen').style.display = 'none';
    controls.lock();
}

// Initialize the game when the page loads
window.onload = init; 