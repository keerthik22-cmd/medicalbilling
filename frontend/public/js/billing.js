// Billing page JavaScript

let allItems = [];
let searchTimeout;

// Load all items
async function loadItems() {
    try {
        const response = await fetch('/api/stock/items', {
            headers: getAuthHeaders()
        });

        const data = await response.json();

        if (data.success) {
            allItems = data.items.filter(item => item.quantity > 0);
            displayItems(allItems);
        }
    } catch (error) {
        console.error('Load items error:', error);
        showAlert('Error loading items');
    }
}

// Display items
function displayItems(items) {
    const grid = document.getElementById('itemsGrid');

    if (items.length === 0) {
        grid.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; padding: 2rem; color: var(--gray);">
        No items available in stock.
      </div>
    `;
        return;
    }

    grid.innerHTML = items.map(item => `
    <div class="card">
      <h3 style="margin-bottom: 0.5rem; font-size: 1.1rem;">${item.name}</h3>
      <p style="color: var(--gray); font-size: 0.85rem; margin-bottom: 1rem;">Batch: ${item.batchNo}</p>
      <div style="margin-bottom: 1rem;">
        <p style="font-size: 1.5rem; font-weight: 700; color: var(--primary);">${formatCurrency(item.price)}</p>
        <p style="color: var(--gray); font-size: 0.9rem;">Available: ${item.quantity}</p>
      </div>
      <div style="display: flex; gap: 0.5rem; align-items: center; margin-bottom: 1rem;">
        <input type="number" id="qty-${item._id}" value="1" min="1" max="${item.quantity}" 
               style="width: 70px; padding: 0.5rem; border: 2px solid var(--gray-light); border-radius: var(--radius-sm);">
        <span style="color: var(--gray); font-size: 0.9rem;">Qty</span>
      </div>
      <button onclick="addToCart('${item._id}')" class="btn btn-primary" style="width: 100%;">
        Add to Cart
      </button>
    </div>
  `).join('');
}

// Search items
document.getElementById('searchInput').addEventListener('input', (e) => {
    const query = e.target.value.toLowerCase().trim();

    clearTimeout(searchTimeout);

    if (query.length === 0) {
        document.getElementById('searchResults').innerHTML = '';
        displayItems(allItems);
        return;
    }

    searchTimeout = setTimeout(() => {
        const filtered = allItems.filter(item =>
            item.name.toLowerCase().includes(query) ||
            item.batchNo.toLowerCase().includes(query)
        );

        displayItems(filtered);

        // Show search results count
        document.getElementById('searchResults').innerHTML = `
      <p style="color: var(--gray);">Found ${filtered.length} item(s) matching "${query}"</p>
    `;
    }, 300);
});

// Add to cart
async function addToCart(itemId) {
    const qtyInput = document.getElementById(`qty-${itemId}`);
    const quantity = parseInt(qtyInput.value);

    if (quantity < 1) {
        showAlert('Please enter a valid quantity');
        return;
    }

    try {
        const response = await fetch('/api/billing/cart/add', {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({ itemId, quantity })
        });

        const data = await response.json();

        if (data.success) {
            showAlert('Item added to cart!', 'success');
            qtyInput.value = 1;
        } else {
            showAlert(data.message || 'Failed to add item to cart');
        }
    } catch (error) {
        console.error('Add to cart error:', error);
        showAlert('Error adding item to cart');
    }
}

// Load items on page load
document.addEventListener('DOMContentLoaded', () => {
    loadItems();
});
