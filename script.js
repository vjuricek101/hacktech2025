function checkGameOver() {
    if (money <= 0 || carbonFootprint >= 100 || soilQuality <= 0) {
        showGameOver();
        return true;
    }
    return false;
}

function showGameOver() {
    const gameOverScreen = document.querySelector('.game-over-screen');
    const gameOverMessage = document.getElementById('game-over-message');
    const finalMoney = document.getElementById('final-money');
    const finalCarbon = document.getElementById('final-carbon');
    const finalSoil = document.getElementById('final-soil');

    // Set the game over message based on the failure condition
    if (money <= 0) {
        gameOverMessage.textContent = "You ran out of money!";
    } else if (carbonFootprint >= 100) {
        gameOverMessage.textContent = "Your carbon footprint became too high!";
    } else if (soilQuality <= 0) {
        gameOverMessage.textContent = "Your soil quality degraded completely!";
    }

    // Update final stats
    finalMoney.textContent = money.toFixed(2);
    finalCarbon.textContent = carbonFootprint.toFixed(2);
    finalSoil.textContent = soilQuality.toFixed(2);

    // Show the game over screen
    gameOverScreen.style.display = 'block';
}

function restartGame() {
    // Reset game state
    money = 1000;
    carbonFootprint = 0;
    soilQuality = 100;
    
    // Clear inventory
    inventory = [];
    
    // Hide game over screen
    document.querySelector('.game-over-screen').style.display = 'none';
    
    // Reset any other game state variables
    // ...
    
    // Restart the game loop
    requestAnimationFrame(gameLoop);
}

let selectedSlot = 1;

function selectHotbarSlot(slotNumber) {
    // Remove selected class from all slots
    document.querySelectorAll('.hotbar-slot').forEach(slot => {
        slot.classList.remove('selected');
    });
    
    // Add selected class to the new slot
    const newSlot = document.querySelector(`.hotbar-slot[data-slot="${slotNumber}"]`);
    if (newSlot) {
        newSlot.classList.add('selected');
        selectedSlot = slotNumber;
        
        // Update selected tool/crop
        const item = newSlot.querySelector('.item');
        if (item.dataset.tool) {
            selectedTool = item.dataset.tool;
            selectedCrop = null;
        } else if (item.dataset.crop) {
            selectedTool = 'seeds';
            selectedCrop = item.dataset.crop;
        }
    }
}

// Add event listeners for number keys
document.addEventListener('keydown', (e) => {
    const key = e.key;
    if (key >= '1' && key <= '6') {
        selectHotbarSlot(parseInt(key));
    }
});

// Initialize the first slot as selected
selectHotbarSlot(1); 