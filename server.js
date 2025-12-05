require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const cors = require('cors');
const path = require('path');

const authRoutes = require('./routes/authRoutes');
const stockRoutes = require('./routes/stockRoutes');
const billingRoutes = require('./routes/billingRoutes');
const reportRoutes = require('./routes/reportRoutes');

const app = express();
const PORT = process.env.PORT || 3000;

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log('✅ MongoDB connected successfully'))
    .catch(err => console.error('❌ MongoDB connection error:', err));

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

// Session configuration
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
    cookie: {
        secure: false, // Set to true in production with HTTPS
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
}));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/stock', stockRoutes);
app.use('/api/billing', billingRoutes);
app.use('/api/reports', reportRoutes);

// Serve HTML pages
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'login.html'));
});

app.get('/dashboard', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'dashboard.html'));
});

app.get('/stock', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'stock.html'));
});

app.get('/billing', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'billing.html'));
});

app.get('/cart', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'cart.html'));
});

app.get('/payment', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'payment.html'));
});

app.get('/payment-success', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'payment-success.html'));
});

app.get('/payment-failed', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'payment-failed.html'));
});

app.get('/reports', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'reports.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        success: false,
        message: 'Something went wrong!',
        error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
});
