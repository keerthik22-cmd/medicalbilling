# Medical Shop Billing Application

A comprehensive web application for managing medical shop operations including stock management, billing, payment processing, and sales reporting.

## Features

- 🔐 **Admin Authentication** - Secure login with JWT
- 📦 **Stock Management** - Excel upload and manual CRUD operations
- 🛒 **Billing System** - Search items and add to cart
- 💳 **Payment Processing** - QR code payment with success/failure handling
- 📊 **Sales Reports** - Filter by daily/weekly/monthly/yearly with PDF download
- 📱 **Responsive Design** - Mobile-friendly UI

## Tech Stack

- **Backend**: Node.js, Express.js, MongoDB
- **Frontend**: HTML5, CSS3, Vanilla JavaScript
- **Libraries**: bcryptjs, jsonwebtoken, multer, xlsx, pdfkit

## Installation

1. **Clone the repository**
   ```bash
   cd medicalbilling
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment**
   - Update `.env` file with your MongoDB URI if needed
   - Default MongoDB URI: `mongodb://localhost:27017/medicalbilling`

4. **Seed the database**
   ```bash
   npm run seed
   ```

5. **Start the server**
   ```bash
   npm start
   ```
   
   For development with auto-reload:
   ```bash
   npm run dev
   ```

6. **Access the application**
   - Open browser and navigate to: `http://localhost:3000`
   - Login with default credentials:
     - Email: `admin@medical.com`
     - Password: `admin123`

## Usage

### Stock Management
1. Navigate to **Stock Maintain** page
2. Upload Excel file with columns: Item Name, Batch No, Quantity, Price per unit, Expiry Date
3. Or manually add items using the form

### Billing Process
1. Go to **Billing** page
2. Search and add items to cart
3. Navigate to **Cart** page
4. Upload payment QR code
5. Proceed to **Payment**
6. Mark payment as success/failed
7. Download invoice from success page

### Sales Reports
1. Go to **Sales Report** page
2. Filter by period (Daily/Weekly/Monthly/Yearly)
3. View sales details
4. Download PDF reports

## Project Structure

```
medicalbilling/
├── models/           # MongoDB schemas
├── routes/           # API routes
├── middleware/       # Authentication middleware
├── public/           # Static files (CSS, JS, uploads)
├── views/            # HTML pages
├── server.js         # Express server
├── seed.js           # Database seeding script
└── .env              # Environment variables
```

## API Endpoints

### Authentication
- `POST /api/auth/login` - Admin login
- `POST /api/auth/logout` - Logout
- `GET /api/auth/status` - Check auth status

### Stock Management
- `GET /api/stock/items` - Get all items
- `POST /api/stock/items` - Add new item
- `PUT /api/stock/items/:id` - Update item
- `DELETE /api/stock/items/:id` - Delete item
- `POST /api/stock/upload-excel` - Upload Excel file

### Billing
- `GET /api/billing/cart` - Get cart
- `POST /api/billing/cart/add` - Add item to cart
- `PUT /api/billing/cart/update/:itemId` - Update cart item
- `DELETE /api/billing/cart/remove/:itemId` - Remove from cart
- `POST /api/billing/cart/upload-qr` - Upload QR code
- `POST /api/billing/payment/process` - Process payment

### Reports
- `GET /api/reports/sales` - Get sales report
- `GET /api/reports/invoice/:invoiceNo` - Download invoice PDF
- `GET /api/reports/sales-report/download` - Download sales report PDF

## License

MIT
