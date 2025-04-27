const chalk = require('chalk').default;
const inquirer = require('inquirer');

class Farm {
    constructor() {
        this.sustainabilityScore = 100;
        this.soilHealth = 100;
        this.waterQuality = 100;
        this.biodiversity = 100;
        this.money = 1000;
        this.history = [];
        this.currentSeason = 1;
    }

    updateStats(soilChange, waterChange, biodiversityChange, moneyChange) {
        this.soilHealth = Math.max(0, Math.min(100, this.soilHealth + soilChange));
        this.waterQuality = Math.max(0, Math.min(100, this.waterQuality + waterChange));
        this.biodiversity = Math.max(0, Math.min(100, this.biodiversity + biodiversityChange));
        this.money += moneyChange;
        
        // Calculate overall sustainability score
        this.sustainabilityScore = Math.round((this.soilHealth + this.waterQuality + this.biodiversity) / 3);
        
        this.history.push({
            season: this.currentSeason,
            soilHealth: this.soilHealth,
            waterQuality: this.waterQuality,
            biodiversity: this.biodiversity,
            money: this.money
        });
    }

    displayStats() {
        console.log('\n' + chalk.blue('=== Farm Status ==='));
        console.log(chalk.green(`Season: ${this.currentSeason}`));
        console.log(chalk.yellow(`Money: $${this.money}`));
        console.log(chalk.cyan(`Sustainability Score: ${this.sustainabilityScore}/100`));
        console.log(chalk.magenta(`Soil Health: ${this.soilHealth}/100`));
        console.log(chalk.blue(`Water Quality: ${this.waterQuality}/100`));
        console.log(chalk.green(`Biodiversity: ${this.biodiversity}/100`));
    }

    async makeDecision() {
        const choices = [
            'Plant crops',
            'Apply fertilizer',
            'Irrigate fields',
            'Use pest control',
            'Install solar panels',
            'View history',
            'Exit game'
        ];

        const { action } = await inquirer.prompt([
            {
                type: 'list',
                name: 'action',
                message: 'What would you like to do?',
                choices: choices
            }
        ]);

        switch (action) {
            case 'Plant crops':
                await this.plantCrops();
                break;
            case 'Apply fertilizer':
                await this.applyFertilizer();
                break;
            case 'Irrigate fields':
                await this.irrigateFields();
                break;
            case 'Use pest control':
                await this.usePestControl();
                break;
            case 'Install solar panels':
                await this.installSolarPanels();
                break;
            case 'View history':
                this.viewHistory();
                break;
            case 'Exit game':
                return false;
        }
        return true;
    }

    async plantCrops() {
        const { cropType } = await inquirer.prompt([
            {
                type: 'list',
                name: 'cropType',
                message: 'Which crop would you like to plant?',
                choices: [
                    'Corn (High yield, needs lots of water)',
                    'Soybeans (Good for soil, moderate water)',
                    'Wheat (Low water, good rotation crop)',
                    'Cover crops (Improves soil, no income)'
                ]
            }
        ]);

        let soilChange = 0;
        let waterChange = 0;
        let biodiversityChange = 0;
        let moneyChange = 0;

        switch (cropType) {
            case 'Corn (High yield, needs lots of water)':
                soilChange = -5;
                waterChange = -10;
                biodiversityChange = -5;
                moneyChange = 200;
                break;
            case 'Soybeans (Good for soil, moderate water)':
                soilChange = 5;
                waterChange = -5;
                biodiversityChange = 0;
                moneyChange = 150;
                break;
            case 'Wheat (Low water, good rotation crop)':
                soilChange = 2;
                waterChange = -3;
                biodiversityChange = 2;
                moneyChange = 100;
                break;
            case 'Cover crops (Improves soil, no income)':
                soilChange = 10;
                waterChange = -2;
                biodiversityChange = 5;
                moneyChange = -50;
                break;
        }

        this.updateStats(soilChange, waterChange, biodiversityChange, moneyChange);
        this.currentSeason++;
        console.log(chalk.green(`\nYou planted ${cropType.split(' ')[0]}.`));
    }

    async applyFertilizer() {
        const { fertilizerType } = await inquirer.prompt([
            {
                type: 'list',
                name: 'fertilizerType',
                message: 'Which type of fertilizer would you like to use?',
                choices: [
                    'Chemical fertilizer (Fast acting, harmful)',
                    'Organic compost (Slow release, sustainable)',
                    'No fertilizer (Save money, soil suffers)'
                ]
            }
        ]);

        let soilChange = 0;
        let waterChange = 0;
        let biodiversityChange = 0;
        let moneyChange = 0;

        switch (fertilizerType) {
            case 'Chemical fertilizer (Fast acting, harmful)':
                soilChange = 15;
                waterChange = -10;
                biodiversityChange = -10;
                moneyChange = -100;
                break;
            case 'Organic compost (Slow release, sustainable)':
                soilChange = 10;
                waterChange = 0;
                biodiversityChange = 5;
                moneyChange = -50;
                break;
            case 'No fertilizer (Save money, soil suffers)':
                soilChange = -5;
                waterChange = 0;
                biodiversityChange = 0;
                moneyChange = 0;
                break;
        }

        this.updateStats(soilChange, waterChange, biodiversityChange, moneyChange);
        console.log(chalk.green(`\nYou applied ${fertilizerType.split(' ')[0]} fertilizer.`));
    }

    async irrigateFields() {
        const { irrigationType } = await inquirer.prompt([
            {
                type: 'list',
                name: 'irrigationType',
                message: 'How would you like to irrigate?',
                choices: [
                    'Flood irrigation (Wastes water, cheap)',
                    'Drip irrigation (Efficient, expensive)',
                    'Rainwater collection (Sustainable, moderate cost)'
                ]
            }
        ]);

        let soilChange = 0;
        let waterChange = 0;
        let biodiversityChange = 0;
        let moneyChange = 0;

        switch (irrigationType) {
            case 'Flood irrigation (Wastes water, cheap)':
                soilChange = 5;
                waterChange = -15;
                biodiversityChange = -5;
                moneyChange = -30;
                break;
            case 'Drip irrigation (Efficient, expensive)':
                soilChange = 5;
                waterChange = 5;
                biodiversityChange = 0;
                moneyChange = -100;
                break;
            case 'Rainwater collection (Sustainable, moderate cost)':
                soilChange = 5;
                waterChange = 10;
                biodiversityChange = 5;
                moneyChange = -70;
                break;
        }

        this.updateStats(soilChange, waterChange, biodiversityChange, moneyChange);
        console.log(chalk.green(`\nYou used ${irrigationType.split(' ')[0]} irrigation.`));
    }

    async usePestControl() {
        const { pestControlType } = await inquirer.prompt([
            {
                type: 'list',
                name: 'pestControlType',
                message: 'How would you like to control pests?',
                choices: [
                    'Chemical pesticides (Effective, harmful)',
                    'Natural predators (Sustainable, moderate)',
                    'Crop rotation (Preventative, no cost)'
                ]
            }
        ]);

        let soilChange = 0;
        let waterChange = 0;
        let biodiversityChange = 0;
        let moneyChange = 0;

        switch (pestControlType) {
            case 'Chemical pesticides (Effective, harmful)':
                soilChange = -5;
                waterChange = -10;
                biodiversityChange = -15;
                moneyChange = -80;
                break;
            case 'Natural predators (Sustainable, moderate)':
                soilChange = 0;
                waterChange = 0;
                biodiversityChange = 5;
                moneyChange = -50;
                break;
            case 'Crop rotation (Preventative, no cost)':
                soilChange = 5;
                waterChange = 0;
                biodiversityChange = 5;
                moneyChange = 0;
                break;
        }

        this.updateStats(soilChange, waterChange, biodiversityChange, moneyChange);
        console.log(chalk.green(`\nYou used ${pestControlType.split(' ')[0]} for pest control.`));
    }

    async installSolarPanels() {
        if (this.money < 500) {
            console.log(chalk.red('\nNot enough money to install solar panels!'));
            return;
        }

        this.updateStats(0, 0, 5, -500);
        console.log(chalk.green('\nYou installed solar panels!'));
        console.log(chalk.yellow('Your farm is now more sustainable and will save money on energy costs.'));
    }

    viewHistory() {
        console.log('\n' + chalk.blue('=== Farm History ==='));
        this.history.forEach(entry => {
            console.log(chalk.yellow(`\nSeason ${entry.season}:`));
            console.log(`Soil Health: ${entry.soilHealth}`);
            console.log(`Water Quality: ${entry.waterQuality}`);
            console.log(`Biodiversity: ${entry.biodiversity}`);
            console.log(`Money: $${entry.money}`);
        });
    }
}

async function main() {
    console.log(chalk.blue('Welcome to Sustainable Farm Simulator!'));
    console.log(chalk.yellow('Make decisions to maintain a sustainable farm while making a profit.'));
    
    const farm = new Farm();
    let continuePlaying = true;

    while (continuePlaying) {
        farm.displayStats();
        continuePlaying = await farm.makeDecision();
    }

    console.log(chalk.green('\nThanks for playing!'));
    console.log(chalk.yellow('Final Sustainability Score: ' + farm.sustainabilityScore));
}

main().catch(console.error); 