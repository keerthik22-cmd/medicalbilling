const express = require('express');
const router = express.Router();
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
const Sale = require('../models/Sale');
const authMiddleware = require('../middleware/auth');

// Get sales report with filters
router.get('/sales', authMiddleware, async (req, res) => {
    try {
        const { filter } = req.query; // 'daily', 'weekly', 'monthly', 'yearly'

        let startDate = new Date();
        const endDate = new Date();

        switch (filter) {
            case 'daily':
                startDate.setHours(0, 0, 0, 0);
                break;
            case 'weekly':
                startDate.setDate(startDate.getDate() - 7);
                break;
            case 'monthly':
                startDate.setMonth(startDate.getMonth() - 1);
                break;
            case 'yearly':
                startDate.setFullYear(startDate.getFullYear() - 1);
                break;
            default:
                startDate = new Date(0); // All time
        }

        const sales = await Sale.find({
            date: { $gte: startDate, $lte: endDate },
            paymentStatus: 'success'
        }).sort({ date: -1 });

        const totalRevenue = sales.reduce((sum, sale) => sum + sale.totalAmount, 0);
        const totalSales = sales.length;

        res.json({
            success: true,
            sales,
            summary: {
                totalSales,
                totalRevenue,
                filter,
                startDate,
                endDate
            }
        });
    } catch (error) {
        console.error('Get sales error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching sales report'
        });
    }
});

// Download invoice PDF
router.get('/invoice/:invoiceNo', authMiddleware, async (req, res) => {
    try {
        const { invoiceNo } = req.params;

        const sale = await Sale.findOne({ invoiceNo });
        if (!sale) {
            return res.status(404).json({
                success: false,
                message: 'Invoice not found'
            });
        }

        // Create PDF
        const doc = new PDFDocument({ margin: 50 });

        // Set response headers
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=invoice-${invoiceNo}.pdf`);

        // Pipe PDF to response
        doc.pipe(res);

        // Add content
        doc.fontSize(20).text('MEDICAL SHOP INVOICE', { align: 'center' });
        doc.moveDown();

        doc.fontSize(12);
        doc.text(`Invoice No: ${sale.invoiceNo}`);
        doc.text(`Date: ${sale.date.toLocaleDateString()}`);
        doc.text(`Time: ${sale.date.toLocaleTimeString()}`);
        doc.moveDown();

        // Table header
        doc.fontSize(10).text('Items:', { underline: true });
        doc.moveDown(0.5);

        const tableTop = doc.y;
        const itemX = 50;
        const qtyX = 250;
        const priceX = 320;
        const totalX = 400;

        doc.text('Item', itemX, tableTop);
        doc.text('Qty', qtyX, tableTop);
        doc.text('Price', priceX, tableTop);
        doc.text('Total', totalX, tableTop);

        doc.moveTo(50, tableTop + 15).lineTo(550, tableTop + 15).stroke();

        let y = tableTop + 25;

        // Items
        sale.items.forEach(item => {
            doc.text(item.name, itemX, y);
            doc.text(item.quantity.toString(), qtyX, y);
            doc.text(`₹${item.price.toFixed(2)}`, priceX, y);
            doc.text(`₹${item.total.toFixed(2)}`, totalX, y);
            y += 20;
        });

        doc.moveTo(50, y).lineTo(550, y).stroke();
        y += 10;

        // Total
        doc.fontSize(12).text(`Total Amount: ₹${sale.totalAmount.toFixed(2)}`, totalX - 50, y, {
            bold: true
        });

        doc.moveDown(2);
        doc.fontSize(10).text('Payment Status: PAID', { align: 'center' });
        doc.text('Thank you for your business!', { align: 'center' });

        // Finalize PDF
        doc.end();
    } catch (error) {
        console.error('Generate invoice error:', error);
        res.status(500).json({
            success: false,
            message: 'Error generating invoice'
        });
    }
});

// Download sales report PDF
router.get('/sales-report/download', authMiddleware, async (req, res) => {
    try {
        const { filter } = req.query;

        let startDate = new Date();
        const endDate = new Date();

        switch (filter) {
            case 'daily':
                startDate.setHours(0, 0, 0, 0);
                break;
            case 'weekly':
                startDate.setDate(startDate.getDate() - 7);
                break;
            case 'monthly':
                startDate.setMonth(startDate.getMonth() - 1);
                break;
            case 'yearly':
                startDate.setFullYear(startDate.getFullYear() - 1);
                break;
            default:
                startDate = new Date(0);
        }

        const sales = await Sale.find({
            date: { $gte: startDate, $lte: endDate },
            paymentStatus: 'success'
        }).sort({ date: -1 });

        const totalRevenue = sales.reduce((sum, sale) => sum + sale.totalAmount, 0);

        // Create PDF
        const doc = new PDFDocument({ margin: 50 });

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=sales-report-${filter || 'all'}.pdf`);

        doc.pipe(res);

        // Header
        doc.fontSize(20).text('SALES REPORT', { align: 'center' });
        doc.moveDown();

        doc.fontSize(12);
        doc.text(`Period: ${filter ? filter.toUpperCase() : 'ALL TIME'}`);
        doc.text(`Date Range: ${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}`);
        doc.text(`Total Sales: ${sales.length}`);
        doc.text(`Total Revenue: ₹${totalRevenue.toFixed(2)}`);
        doc.moveDown();

        // Table
        doc.fontSize(10).text('Sales Details:', { underline: true });
        doc.moveDown(0.5);

        const tableTop = doc.y;
        const dateX = 50;
        const invoiceX = 150;
        const itemsX = 280;
        const amountX = 450;

        doc.text('Date', dateX, tableTop);
        doc.text('Invoice', invoiceX, tableTop);
        doc.text('Items', itemsX, tableTop);
        doc.text('Amount', amountX, tableTop);

        doc.moveTo(50, tableTop + 15).lineTo(550, tableTop + 15).stroke();

        let y = tableTop + 25;

        sales.forEach(sale => {
            if (y > 700) {
                doc.addPage();
                y = 50;
            }

            doc.text(sale.date.toLocaleDateString(), dateX, y);
            doc.text(sale.invoiceNo, invoiceX, y);
            doc.text(sale.items.length.toString(), itemsX, y);
            doc.text(`₹${sale.totalAmount.toFixed(2)}`, amountX, y);
            y += 20;
        });

        doc.end();
    } catch (error) {
        console.error('Generate sales report error:', error);
        res.status(500).json({
            success: false,
            message: 'Error generating sales report'
        });
    }
});

module.exports = router;
