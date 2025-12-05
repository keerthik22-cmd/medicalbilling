const XLSX = require('xlsx');
const path = require('path');

// Create sample Excel file for testing
const data = [
    {
        'Item Name': 'Aspirin',
        'Batch No': 'ASP001',
        'Quantity': 200,
        'Price per unit': 3.50,
        'Expiry Date': '2026-06-30'
    },
    {
        'Item Name': 'Ibuprofen',
        'Batch No': 'IBU001',
        'Quantity': 150,
        'Price per unit': 5.00,
        'Expiry Date': '2026-12-31'
    },
    {
        'Item Name': 'Amoxicillin',
        'Batch No': 'AMX001',
        'Quantity': 100,
        'Price per unit': 8.75,
        'Expiry Date': '2025-09-15'
    },
    {
        'Item Name': 'Paracetamol',
        'Batch No': 'PAR002',
        'Quantity': 300,
        'Price per unit': 2.25,
        'Expiry Date': '2027-03-20'
    },
    {
        'Item Name': 'Cetirizine',
        'Batch No': 'CET001',
        'Quantity': 180,
        'Price per unit': 4.50,
        'Expiry Date': '2026-08-10'
    }
];

// Create workbook and worksheet
const wb = XLSX.utils.book_new();
const ws = XLSX.utils.json_to_sheet(data);

// Add worksheet to workbook
XLSX.utils.book_append_sheet(wb, ws, 'Stock');

// Write to file
const filePath = path.join(__dirname, 'sample-stock.xlsx');
XLSX.writeFile(wb, filePath);

console.log('✅ Sample Excel file created:', filePath);
console.log('📊 File contains', data.length, 'items');
