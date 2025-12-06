// Payment page JavaScript

let currentCart = null;

// Load cart and display payment info
async function loadPaymentInfo() {
    try {
        const response = await fetch('/api/billing/cart', {
            headers: getAuthHeaders()
        });

        const data = await response.json();

        if (data.success) {
            currentCart = data.cart;

            if (!data.cart || data.cart.items.length === 0) {
                showAlert('Your cart is empty', 'error');
                setTimeout(() => {
                    window.location.href = '/billing';
                }, 2000);
                return;
            }

            // Calculate total
            const totalAmount = data.cart.items.reduce((sum, item) =>
                sum + (item.price * item.quantity), 0
            );

            document.getElementById('totalAmount').textContent = formatCurrency(totalAmount);

            // Display QR code
            const qrDisplay = document.getElementById('qrDisplay');
            if (data.cart.qrImage) {
                qrDisplay.innerHTML = `
          <img src="${data.cart.qrImage}" alt="Payment QR Code" 
               style="max-width: 300px; width: 100%; border-radius: var(--radius-sm); box-shadow: var(--shadow);">
        `;
            } else {
                qrDisplay.innerHTML = `
          <p style="color: var(--gray);">No QR code uploaded. Please upload QR code from cart page.</p>
          <a href="/cart" class="btn btn-primary" style="margin-top: 1rem;">Go to Cart</a>
        `;
            }
        }
    } catch (error) {
        console.error('Load payment info error:', error);
        showAlert('Error loading payment information');
    }
}

// Process payment
async function processPayment(status) {
    if (!currentCart || currentCart.items.length === 0) {
        showAlert('Cart is empty');
        return;
    }

    if (!confirm(`Are you sure you want to mark this payment as ${status}?`)) {
        return;
    }

    try {
        const response = await fetch('/api/billing/payment/process', {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({ status })
        });

        const data = await response.json();

        if (status === 'success' && data.success) {
            // Store invoice number for success page
            localStorage.setItem('lastInvoice', data.invoiceNo);
            window.location.href = '/payment-success';
        } else if (status === 'failed') {
            window.location.href = '/payment-failed';
        } else {
            showAlert(data.message || 'Payment processing failed');
        }
    } catch (error) {
        console.error('Process payment error:', error);
        showAlert('Error processing payment');
    }
}

// Load payment info on page load
document.addEventListener('DOMContentLoaded', () => {
    loadPaymentInfo();
});
