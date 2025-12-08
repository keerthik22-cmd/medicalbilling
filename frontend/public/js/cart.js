// Cart page JavaScript

let currentCart = null;
let qrCodeInstance = null;
let cachedUpiId = ''; // Cache UPI ID fetched from server

// Load saved UPI ID from server
async function loadSavedUpiId() {
    try {
        const response = await fetch('/api/billing/upi-settings', {
            headers: getAuthHeaders()
        });
        const data = await response.json();

        if (data.success) {
            cachedUpiId = data.upiId || '';
            const upiInput = document.getElementById('savedUpiId');
            if (upiInput) {
                upiInput.value = cachedUpiId;
            }
        }
    } catch (error) {
        console.error('Load UPI settings error:', error);
    }
}

// Save UPI ID to server (admin only)
async function saveUpiId() {
    const upiInput = document.getElementById('savedUpiId');
    if (!upiInput || !upiInput.value.trim()) {
        showAlert('Please enter a valid UPI ID');
        return;
    }

    try {
        const response = await fetch('/api/billing/upi-settings', {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({ upiId: upiInput.value.trim() })
        });

        const data = await response.json();

        if (data.success) {
            cachedUpiId = data.upiId;
            showAlert('UPI ID saved successfully!', 'success');
        } else {
            showAlert(data.message || 'Failed to save UPI ID');
        }
    } catch (error) {
        console.error('Save UPI ID error:', error);
        showAlert('Error saving UPI ID');
    }
}

// Load cart
async function loadCart() {
    try {
        const response = await fetch('/api/billing/cart', {
            headers: getAuthHeaders()
        });

        const data = await response.json();

        if (data.success) {
            currentCart = data.cart;
            displayCart(data.cart);
            updateSummary(data.cart);
        }
    } catch (error) {
        console.error('Load cart error:', error);
        showAlert('Error loading cart');
    }
}

// Display cart items
function displayCart(cart) {
    const container = document.getElementById('cartItems');

    if (!cart || cart.items.length === 0) {
        container.innerHTML = `
      <div style="text-align: center; padding: 2rem; color: var(--gray);">
        <p style="margin-bottom: 1rem;">Your cart is empty</p>
        <a href="/billing" class="btn btn-primary">Go to Billing</a>
      </div>
    `;
        document.getElementById('proceedBtn').disabled = true;
        return;
    }

    document.getElementById('proceedBtn').disabled = false;

    container.innerHTML = cart.items.map(item => `
    <div style="display: flex; justify-content: space-between; align-items: center; padding: 1rem; border-bottom: 1px solid var(--gray-lighter);">
      <div style="flex: 1;">
        <h4 style="margin-bottom: 0.25rem;">${item.name}</h4>
        <p style="color: var(--gray); font-size: 0.9rem;">${formatCurrency(item.price)} × ${item.quantity}</p>
      </div>
      <div style="display: flex; align-items: center; gap: 1rem;">
        <div style="display: flex; align-items: center; gap: 0.5rem;">
          <button onclick="updateQuantity('${item.itemId._id || item.itemId}', ${item.quantity - 1})" class="btn btn-outline" style="padding: 0.25rem 0.75rem;">-</button>
          <span style="font-weight: 600; min-width: 30px; text-align: center;">${item.quantity}</span>
          <button onclick="updateQuantity('${item.itemId._id || item.itemId}', ${item.quantity + 1})" class="btn btn-outline" style="padding: 0.25rem 0.75rem;">+</button>
        </div>
        <span style="font-weight: 700; min-width: 80px; text-align: right;">${formatCurrency(item.price * item.quantity)}</span>
        <button onclick="removeItem('${item.itemId._id || item.itemId}')" class="btn btn-danger" style="padding: 0.5rem 1rem;">
          Remove
        </button>
      </div>
    </div>
  `).join('');
}

// Update summary
let currentSubtotal = 0; // Store subtotal for discount calculations

// Update summary with discount support
function updateSummary(cart) {
    if (!cart || cart.items.length === 0) {
        document.getElementById('totalItems').textContent = '0';
        document.getElementById('totalQuantity').textContent = '0';
        document.getElementById('subtotalAmount').textContent = '₹0.00';
        document.getElementById('discountAmount').textContent = '-₹0.00';
        document.getElementById('totalAmount').textContent = '₹0.00';
        document.getElementById('discountPercent').value = '0';
        currentSubtotal = 0;
        return;
    }

    const totalItems = cart.items.length;
    const totalQuantity = cart.items.reduce((sum, item) => sum + item.quantity, 0);
    currentSubtotal = cart.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    document.getElementById('totalItems').textContent = totalItems;
    document.getElementById('totalQuantity').textContent = totalQuantity;
    document.getElementById('subtotalAmount').textContent = formatCurrency(currentSubtotal);

    // Apply any existing discount
    applyDiscount();
}

// Apply discount and update final amount
function applyDiscount() {
    const discountInput = document.getElementById('discountPercent');
    let discountPercent = parseFloat(discountInput.value) || 0;

    // Validate discount range
    if (discountPercent < 0) discountPercent = 0;
    if (discountPercent > 100) discountPercent = 100;
    discountInput.value = discountPercent;

    const discountAmount = (currentSubtotal * discountPercent) / 100;
    const finalAmount = currentSubtotal - discountAmount;

    document.getElementById('discountAmount').textContent = '-' + formatCurrency(discountAmount);
    document.getElementById('totalAmount').textContent = formatCurrency(finalAmount);
}

// Update quantity
async function updateQuantity(itemId, newQuantity) {
    if (newQuantity < 1) {
        removeItem(itemId);
        return;
    }

    try {
        const response = await fetch(`/api/billing/cart/update/${itemId}`, {
            method: 'PUT',
            headers: getAuthHeaders(),
            body: JSON.stringify({ quantity: newQuantity })
        });

        const data = await response.json();

        if (data.success) {
            loadCart();
        } else {
            showAlert(data.message || 'Failed to update quantity');
        }
    } catch (error) {
        console.error('Update quantity error:', error);
        showAlert('Error updating quantity');
    }
}

// Remove item
async function removeItem(itemId) {
    if (!confirm('Remove this item from cart?')) return;

    try {
        const response = await fetch(`/api/billing/cart/remove/${itemId}`, {
            method: 'DELETE',
            headers: getAuthHeaders()
        });

        const data = await response.json();

        if (data.success) {
            showAlert('Item removed from cart', 'success');
            loadCart();
        } else {
            showAlert(data.message || 'Failed to remove item');
        }
    } catch (error) {
        console.error('Remove item error:', error);
        showAlert('Error removing item');
    }
}

// Generate UPI QR Code using qrcodejs library
function generateUPIQR() {
    const upiId = cachedUpiId || 'merchant@upi';
    const totalAmount = currentCart.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    // Create UPI payment URL with proper format
    const upiUrl = `upi://pay?pa=${encodeURIComponent(upiId)}&pn=Maharaja%20Medical&am=${totalAmount}&cu=INR`;

    // Display UPI ID
    document.getElementById('displayUpiId').textContent = upiId;

    // Display amount in modal
    document.getElementById('modalTotalAmount').textContent = formatCurrency(totalAmount);

    // Clear previous QR code
    const qrContainer = document.getElementById('qrCode');
    qrContainer.innerHTML = '';

    // Generate new QR Code using qrcodejs
    try {
        qrCodeInstance = new QRCode(qrContainer, {
            text: upiUrl,
            width: 220,
            height: 220,
            colorDark: '#000000',
            colorLight: '#ffffff',
            correctLevel: QRCode.CorrectLevel.H
        });
        console.log('QR Code generated successfully for:', upiUrl);
    } catch (error) {
        console.error('QR Code generation error:', error);
        qrContainer.innerHTML = '<p style="color: red;">Error generating QR code. Please check console.</p>';
    }
}

// Proceed to payment - opens the modal with QR code
function proceedToPayment() {
    if (!currentCart || currentCart.items.length === 0) {
        showAlert('Your cart is empty');
        return;
    }

    // Check if UPI ID is configured
    if (!cachedUpiId) {
        if (isAdmin()) {
            showAlert('Please configure your UPI ID first');
            const upiInput = document.getElementById('savedUpiId');
            if (upiInput) upiInput.focus();
        } else {
            showAlert('UPI payment is not configured. Please contact admin.');
        }
        return;
    }

    // Show the payment modal
    document.getElementById('paymentModal').style.display = 'flex';

    // Generate QR code after a small delay to ensure modal is visible
    setTimeout(() => {
        generateUPIQR();
    }, 100);
}

// Close payment modal
function closePaymentModal() {
    document.getElementById('paymentModal').style.display = 'none';
    // Clear QR code
    const qrContainer = document.getElementById('qrCode');
    qrContainer.innerHTML = '';
    qrCodeInstance = null;

    // Clear phone input
    const phoneInput = document.getElementById('customerPhone');
    if (phoneInput) phoneInput.value = '';
}

// Confirm payment received and redirect to dashboard
async function confirmPayment(autoShare = false) {
    if (!currentCart || currentCart.items.length === 0) {
        showAlert('Cart is empty');
        return;
    }

    // Process payment directly without confirm dialog

    try {
        // Get discount info
        const discountPercent = parseFloat(document.getElementById('discountPercent').value) || 0;

        // Get customer phone
        const customerPhoneInput = document.getElementById('customerPhone');
        const customerPhone = customerPhoneInput ? customerPhoneInput.value.trim() : '';

        // Simple phone validation (if provided)
        if (customerPhone && !/^\d{10}$/.test(customerPhone)) {
            showAlert('Please enter a valid 10-digit mobile number');
            return;
        }

        const response = await fetch('/api/billing/payment/process', {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({
                status: 'success',
                discountPercent: discountPercent,
                customerPhone: customerPhone
            })
        });

        const data = await response.json();

        console.log('Payment API response:', data);

        if (data.success) {
            // Store invoice number and phone for success page
            if (data.invoiceNo) {
                console.log('Storing lastInvoice:', data.invoiceNo);
                localStorage.setItem('lastInvoice', data.invoiceNo);
            }
            if (data.customerPhone) {
                console.log('Storing customerPhone:', data.customerPhone);
                localStorage.setItem('customerPhone', data.customerPhone);
            } else {
                console.log('No customerPhone in response to store');
                localStorage.removeItem('customerPhone');
            }

            // Close modal
            closePaymentModal();

            // Show success message
            showAlert('Payment successful! Redirecting...', 'success');

            // Redirect to dashboard after a brief delay
            setTimeout(() => {
                if (autoShare) {
                    window.location.href = '/payment-success?autoshare=true';
                } else {
                    window.location.href = '/dashboard';
                }
            }, 1000);
        } else {
            showAlert(data.message || 'Payment processing failed');
        }
    } catch (error) {
        console.error('Process payment error:', error);
        showAlert('Error processing payment');
    }
}

// Close modal when clicking outside
document.addEventListener('click', function (event) {
    const modal = document.getElementById('paymentModal');
    if (event.target === modal) {
        closePaymentModal();
    }
});

// Close modal with Escape key
document.addEventListener('keydown', function (event) {
    if (event.key === 'Escape') {
        closePaymentModal();
    }
});

// Make functions globally accessible for onclick handlers
window.updateQuantity = updateQuantity;
window.removeItem = removeItem;
window.proceedToPayment = proceedToPayment;
window.saveUpiId = saveUpiId;
window.closePaymentModal = closePaymentModal;
window.confirmPayment = confirmPayment;

// Hide UPI Settings section for non-admin users
function hideUpiSettingsForUser() {
    if (!isAdmin()) {
        const upiSettingsSection = document.getElementById('upiSettingsSection');
        if (upiSettingsSection) {
            upiSettingsSection.style.display = 'none';
        }
    }
}

// Load cart and UPI settings on page load
document.addEventListener('DOMContentLoaded', () => {
    hideUpiSettingsForUser();
    loadCart();
    loadSavedUpiId();
});

