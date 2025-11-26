const path = require('path');
const drugService = require('../src/services/drugs/drugService');
const database = require('../src/config/database');

async function seedDrugs() {
    try {
        const csvPath = path.join(__dirname, '../../sample-drugs-import.csv');
        console.log(`Importing drugs from: ${csvPath}`);

        const result = await drugService.importFromCSV(csvPath);

        console.log('Import result:', result);
    } catch (error) {
        console.error('Seed failed:', error);
    } finally {
        // Close database connection
        const prisma = database.getClient();
        await prisma.$disconnect();
    }
}

seedDrugs();
