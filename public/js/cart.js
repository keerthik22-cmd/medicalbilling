// Cart page JavaScript

let currentCart = null;

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

            // Show QR preview if exists
            if (data.cart.qrImage) {
                document.getElementById('qrPreview').innerHTML = `
          <img src="${data.cart.qrImage}" alt="QR Code" style="max-width: 200px; border-radius: var(--radius-sm); box-shadow: var(--shadow);">
        `;
            }
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
function updateSummary(cart) {
    if (!cart || cart.items.length === 0) {
        document.getElementById('totalItems').textContent = '0';
        document.getElementById('totalQuantity').textContent = '0';
        document.getElementById('totalAmount').textContent = '₹0.00';
        return;
    }

    const totalItems = cart.items.length;
    const totalQuantity = cart.items.reduce((sum, item) => sum + item.quantity, 0);
    const totalAmount = cart.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    document.getElementById('totalItems').textContent = totalItems;
    document.getElementById('totalQuantity').textContent = totalQuantity;
    document.getElementById('totalAmount').textContent = formatCurrency(totalAmount);
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

// Upload QR
document.getElementById('qrUploadForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const fileInput = document.getElementById('qrImage');
    const file = fileInput.files[0];

    if (!file) {
        showAlert('Please select an image');
        return;
    }

    const formData = new FormData();
    formData.append('qrImage', file);

    try {
        const response = await fetch('/api/billing/cart/upload-qr', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: formData
        });

        const data = await response.json();

        if (data.success) {
            showAlert('QR code uploaded successfully!', 'success');
            document.getElementById('qrPreview').innerHTML = `
        <img src="${data.qrImage}" alt="QR Code" style="max-width: 200px; border-radius: var(--radius-sm); box-shadow: var(--shadow);">
      `;
        } else {
            showAlert(data.message || 'Failed to upload QR code');
        }
    } catch (error) {
        console.error('Upload QR error:', error);
        showAlert('Error uploading QR code');
    }
});

// Proceed to payment
function proceedToPayment() {
    if (!currentCart || currentCart.items.length === 0) {
        showAlert('Your cart is empty');
        return;
    }

    window.location.href = '/payment';
}

// Make functions globally accessible for onclick handlers
window.updateQuantity = updateQuantity;
window.removeItem = removeItem;
window.proceedToPayment = proceedToPayment;

// Load cart on page load
document.addEventListener('DOMContentLoaded', () => {
    loadCart();
});
