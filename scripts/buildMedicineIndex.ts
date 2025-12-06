import * as fs from 'fs';
import * as path from 'path';
import { parse } from 'csv-parse/sync';

interface MedicineRecord {
    id: string;
    name: string;
    'price(₹)': string;
    Is_discontinued: string;
    manufacturer_name: string;
    type: string;
    pack_size_label: string;
    short_composition1: string;
    short_composition2: string;
}

interface ProcessedMedicine {
    id: string;
    name: string;
    price: number;
    manufacturer: string;
    packSize: string;
    composition: string;
    type: string;
    discontinued: boolean;
}

interface SearchIndex {
    version: string;
    generatedAt: string;
    totalRecords: number;
    medicines: ProcessedMedicine[];
}

function processMedicine(record: MedicineRecord): ProcessedMedicine {
    const composition = [
        record.short_composition1.trim(),
        record.short_composition2.trim()
    ].filter(Boolean).join(' + ');

    return {
        id: record.id,
        name: record.name.trim(),
        price: parseFloat(record['price(₹)']) || 0,
        manufacturer: record.manufacturer_name.trim(),
        packSize: record.pack_size_label.trim(),
        composition: composition,
        type: record.type.trim(),
        discontinued: record.Is_discontinued.toUpperCase() === 'TRUE'
    };
}

async function buildIndex() {
    console.log('🚀 Building medicine search index...\n');

    const csvPath = path.join(__dirname, 'medicine-data', 'indian_medicine_data.csv');
    const outputPath = path.join(__dirname, '..', 'public', 'data', 'medicine-index.json');

    console.log(`📂 Reading CSV from: ${csvPath}`);

    if (!fs.existsSync(csvPath)) {
        console.error('❌ CSV file not found!');
        process.exit(1);
    }

    const csvContent = fs.readFileSync(csvPath, 'utf-8');

    console.log('📊 Parsing CSV data...');
    const records: MedicineRecord[] = parse(csvContent, {
        columns: true,
        skip_empty_lines: true,
        trim: true
    });

    console.log(`✅ Parsed ${records.length.toLocaleString()} records\n`);

    console.log('🔄 Processing medicines...');
    const startTime = Date.now();

    const medicines = records.map((record, index) => {
        if (index % 10000 === 0 && index > 0) {
            console.log(`   Processed ${index.toLocaleString()} / ${records.length.toLocaleString()}`);
        }
        return processMedicine(record);
    });

    const processingTime = Date.now() - startTime;
    console.log(`✅ Processed all records in ${processingTime}ms\n`);

    const index: SearchIndex = {
        version: '1.0.0',
        generatedAt: new Date().toISOString(),
        totalRecords: medicines.length,
        medicines
    };

    console.log('💾 Writing index to file...');
    const jsonContent = JSON.stringify(index);
    fs.writeFileSync(outputPath, jsonContent, 'utf-8');

    const fileSizeBytes = fs.statSync(outputPath).size;
    const fileSizeMB = (fileSizeBytes / (1024 * 1024)).toFixed(2);

    console.log(`✅ Index written to: ${outputPath}`);
    console.log(`📦 File size: ${fileSizeMB} MB\n`);

    // Statistics
    const activeCount = medicines.filter(m => !m.discontinued).length;
    const discontinuedCount = medicines.filter(m => m.discontinued).length;

    console.log('📈 Statistics:');
    console.log(`   Total medicines: ${medicines.length.toLocaleString()}`);
    console.log(`   Active: ${activeCount.toLocaleString()}`);
    console.log(`   Discontinued: ${discontinuedCount.toLocaleString()}`);
    console.log(`   Processing time: ${processingTime}ms`);
    console.log(`   File size: ${fileSizeMB} MB`);

    console.log('\n✨ Index generation complete!');
}

buildIndex().catch(console.error);
