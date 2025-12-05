const express = require('express');
const router = express.Router();
const multer = require('multer');
const Cart = require('../models/Cart');
const Item = require('../models/Item');
const Sale = require('../models/Sale');
const authMiddleware = require('../middleware/auth');

// Configure multer for QR image upload
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'public/uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, 'qr-' + Date.now() + '-' + file.originalname);
    }
});

const upload = multer({
    storage,
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Only image files are allowed'));
        }
    }
});

// Get or create cart for session
router.get('/cart', authMiddleware, async (req, res) => {
    try {
        const sessionId = req.session.id;
        let cart = await Cart.findOne({ sessionId }).populate('items.itemId');

        if (!cart) {
            cart = await Cart.create({ sessionId, items: [] });
        }

        res.json({
            success: true,
            cart
        });
    } catch (error) {
        console.error('Get cart error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching cart'
        });
    }
});

// Add item to cart
router.post('/cart/add', authMiddleware, async (req, res) => {
    try {
        const { itemId, quantity } = req.body;
        const sessionId = req.session.id;

        // Check if item exists and has enough stock
        const item = await Item.findById(itemId);
        if (!item) {
            return res.status(404).json({
                success: false,
                message: 'Item not found'
            });
        }

        if (item.quantity < quantity) {
            return res.status(400).json({
                success: false,
                message: 'Insufficient stock'
            });
        }

        // Get or create cart
        let cart = await Cart.findOne({ sessionId });
        if (!cart) {
            cart = await Cart.create({ sessionId, items: [] });
        }

        // Check if item already in cart
        const existingItemIndex = cart.items.findIndex(
            i => i.itemId.toString() === itemId
        );

        if (existingItemIndex > -1) {
            // Update quantity
            cart.items[existingItemIndex].quantity += quantity;
        } else {
            // Add new item
            cart.items.push({
                itemId: item._id,
                name: item.name,
                quantity,
                price: item.price
            });
        }

        await cart.save();
        await cart.populate('items.itemId');

        res.json({
            success: true,
            message: 'Item added to cart',
            cart
        });
    } catch (error) {
        console.error('Add to cart error:', error);
        res.status(500).json({
            success: false,
            message: 'Error adding item to cart',
            error: error.message
        });
    }
});

// Update cart item quantity
router.put('/cart/update/:itemId', authMiddleware, async (req, res) => {
    try {
        const { itemId } = req.params;
        const { quantity } = req.body;
        const sessionId = req.session.id;

        const cart = await Cart.findOne({ sessionId });
        if (!cart) {
            return res.status(404).json({
                success: false,
                message: 'Cart not found'
            });
        }

        const cartItem = cart.items.find(i => i.itemId.toString() === itemId);
        if (!cartItem) {
            return res.status(404).json({
                success: false,
                message: 'Item not in cart'
            });
        }

        // Check stock
        const item = await Item.findById(itemId);
        if (item.quantity < quantity) {
            return res.status(400).json({
                success: false,
                message: 'Insufficient stock'
            });
        }

        cartItem.quantity = quantity;
        await cart.save();
        await cart.populate('items.itemId');

        res.json({
            success: true,
            message: 'Cart updated',
            cart
        });
    } catch (error) {
        console.error('Update cart error:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating cart'
        });
    }
});

// Remove item from cart
router.delete('/cart/remove/:itemId', authMiddleware, async (req, res) => {
    try {
        const { itemId } = req.params;
        const sessionId = req.session.id;

        const cart = await Cart.findOne({ sessionId });
        if (!cart) {
            return res.status(404).json({
                success: false,
                message: 'Cart not found'
            });
        }

        cart.items = cart.items.filter(i => i.itemId.toString() !== itemId);
        await cart.save();
        await cart.populate('items.itemId');

        res.json({
            success: true,
            message: 'Item removed from cart',
            cart
        });
    } catch (error) {
        console.error('Remove from cart error:', error);
        res.status(500).json({
            success: false,
            message: 'Error removing item from cart'
        });
    }
});

// Upload QR code
router.post('/cart/upload-qr', authMiddleware, upload.single('qrImage'), async (req, res) => {
    try {
        const sessionId = req.session.id;

        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'No file uploaded'
            });
        }

        const cart = await Cart.findOne({ sessionId });
        if (!cart) {
            return res.status(404).json({
                success: false,
                message: 'Cart not found'
            });
        }

        cart.qrImage = '/uploads/' + req.file.filename;
        await cart.save();

        res.json({
            success: true,
            message: 'QR code uploaded',
            qrImage: cart.qrImage
        });
    } catch (error) {
        console.error('Upload QR error:', error);
        res.status(500).json({
            success: false,
            message: 'Error uploading QR code'
        });
    }
});

// Process payment
router.post('/payment/process', authMiddleware, async (req, res) => {
    try {
        const { status } = req.body; // 'success' or 'failed'
        const sessionId = req.session.id;

        const cart = await Cart.findOne({ sessionId }).populate('items.itemId');
        if (!cart || cart.items.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Cart is empty'
            });
        }

        // Calculate total
        let totalAmount = 0;
        const saleItems = [];

        for (const cartItem of cart.items) {
            const item = await Item.findById(cartItem.itemId);

            if (!item) {
                return res.status(404).json({
                    success: false,
                    message: `Item ${cartItem.name} not found`
                });
            }

            if (item.quantity < cartItem.quantity) {
                return res.status(400).json({
                    success: false,
                    message: `Insufficient stock for ${item.name}`
                });
            }

            const itemTotal = cartItem.price * cartItem.quantity;
            totalAmount += itemTotal;

            saleItems.push({
                itemId: item._id,
                name: item.name,
                quantity: cartItem.quantity,
                price: cartItem.price,
                total: itemTotal
            });
        }

        if (status === 'success') {
            // Generate invoice number with date format: INV-YYYYMMDD-HHMMSS
            const now = new Date();
            const year = now.getFullYear();
            const month = String(now.getMonth() + 1).padStart(2, '0');
            const day = String(now.getDate()).padStart(2, '0');
            const hours = String(now.getHours()).padStart(2, '0');
            const minutes = String(now.getMinutes()).padStart(2, '0');
            const seconds = String(now.getSeconds()).padStart(2, '0');
            const invoiceNo = `INV-${year}${month}${day}-${hours}${minutes}${seconds}`;


            // Create sale record
            const sale = await Sale.create({
                invoiceNo,
                items: saleItems,
                totalAmount,
                paymentStatus: 'success',
                date: new Date()
            });

            // Update stock quantities
            for (const cartItem of cart.items) {
                await Item.findByIdAndUpdate(cartItem.itemId, {
                    $inc: { quantity: -cartItem.quantity }
                });
            }

            // Clear cart
            await Cart.findByIdAndDelete(cart._id);

            res.json({
                success: true,
                message: 'Payment successful',
                sale,
                invoiceNo
            });
        } else {
            res.json({
                success: false,
                message: 'Payment failed',
                paymentStatus: 'failed'
            });
        }
    } catch (error) {
        console.error('Process payment error:', error);
        res.status(500).json({
            success: false,
            message: 'Error processing payment',
            error: error.message
        });
    }
});

module.exports = router;
