const express = require('express');
const router = express.Router();
const multer = require('multer');
const xlsx = require('xlsx');
const fs = require('fs');
const path = require('path');
const Item = require('../models/Item');
const authMiddleware = require('../middleware/auth');

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '../public/uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for Excel file upload
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'public/uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + file.originalname);
    }
});

const upload = multer({
    storage,
    fileFilter: (req, file, cb) => {
        if (file.mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
            file.mimetype === 'application/vnd.ms-excel') {
            cb(null, true);
        } else {
            cb(new Error('Only Excel files are allowed'));
        }
    }
});

// Upload Excel file and update stock
router.post('/upload-excel', authMiddleware, upload.single('excelFile'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'No file uploaded'
            });
        }

        // Read Excel file
        const workbook = xlsx.readFile(req.file.path);
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const data = xlsx.utils.sheet_to_json(sheet);

        let successCount = 0;
        let errorCount = 0;
        const errors = [];

        // Process each row
        for (const row of data) {
            try {
                const itemData = {
                    name: row['Item Name'] || row['name'],
                    batchNo: row['Batch No'] || row['batchNo'],
                    quantity: parseInt(row['Quantity'] || row['quantity']),
                    price: parseFloat(row['Price per unit'] || row['price']),
                    expiryDate: new Date(row['Expiry Date'] || row['expiryDate'])
                };

                // Check if item with same batch number exists
                const existingItem = await Item.findOne({ batchNo: itemData.batchNo });

                if (existingItem) {
                    // Update existing item
                    existingItem.quantity += itemData.quantity;
                    existingItem.price = itemData.price;
                    existingItem.expiryDate = itemData.expiryDate;
                    await existingItem.save();
                } else {
                    // Create new item
                    await Item.create(itemData);
                }

                successCount++;
            } catch (error) {
                errorCount++;
                errors.push({ row, error: error.message });
            }
        }

        res.json({
            success: true,
            message: `Processed ${data.length} rows. Success: ${successCount}, Errors: ${errorCount}`,
            successCount,
            errorCount,
            errors: errors.length > 0 ? errors : undefined
        });
    } catch (error) {
        console.error('Excel upload error:', error);
        res.status(500).json({
            success: false,
            message: 'Error processing Excel file',
            error: error.message
        });
    }
});

// Get all items
router.get('/items', authMiddleware, async (req, res) => {
    try {
        const items = await Item.find().sort({ createdAt: -1 });
        res.json({
            success: true,
            items
        });
    } catch (error) {
        console.error('Get items error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching items'
        });
    }
});

// Search items - MUST come before /items/:id
router.get('/items/search', authMiddleware, async (req, res) => {
    try {
        const { q } = req.query;

        if (!q) {
            return res.json({ success: true, items: [] });
        }

        const items = await Item.find({
            name: { $regex: q, $options: 'i' }
        }).limit(10);

        res.json({
            success: true,
            items
        });
    } catch (error) {
        console.error('Search items error:', error);
        res.status(500).json({
            success: false,
            message: 'Error searching items'
        });
    }
});

// Get single item
router.get('/items/:id', authMiddleware, async (req, res) => {
    try {
        const item = await Item.findById(req.params.id);

        if (!item) {
            return res.status(404).json({
                success: false,
                message: 'Item not found'
            });
        }

        res.json({
            success: true,
            item
        });
    } catch (error) {
        console.error('Get item error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching item'
        });
    }
});

// Add new item manually
router.post('/items', authMiddleware, async (req, res) => {
    try {
        console.log('=== ADD ITEM REQUEST ===');
        console.log('Request body:', req.body);

        const { name, batchNo, quantity, price, expiryDate } = req.body;

        console.log('Parsed data:', { name, batchNo, quantity, price, expiryDate });

        const item = await Item.create({
            name,
            batchNo,
            quantity,
            price,
            expiryDate
        });

        console.log('Item created successfully:', item);

        res.status(201).json({
            success: true,
            message: 'Item added successfully',
            item
        });
    } catch (error) {
        console.error('Add item error:', error);
        console.error('Error stack:', error.stack);
        res.status(500).json({
            success: false,
            message: 'Error adding item',
            error: error.message
        });
    }
});

// Update item
router.put('/items/:id', authMiddleware, async (req, res) => {
    try {
        const { name, batchNo, quantity, price, expiryDate } = req.body;

        const item = await Item.findByIdAndUpdate(
            req.params.id,
            { name, batchNo, quantity, price, expiryDate, updatedAt: Date.now() },
            { new: true, runValidators: true }
        );

        if (!item) {
            return res.status(404).json({
                success: false,
                message: 'Item not found'
            });
        }

        res.json({
            success: true,
            message: 'Item updated successfully',
            item
        });
    } catch (error) {
        console.error('Update item error:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating item',
            error: error.message
        });
    }
});

// Delete item
router.delete('/items/:id', authMiddleware, async (req, res) => {
    try {
        const item = await Item.findByIdAndDelete(req.params.id);

        if (!item) {
            return res.status(404).json({
                success: false,
                message: 'Item not found'
            });
        }

        res.json({
            success: true,
            message: 'Item deleted successfully'
        });
    } catch (error) {
        console.error('Delete item error:', error);
        res.status(500).json({
            success: false,
            message: 'Error deleting item'
        });
    }
});

module.exports = router;
