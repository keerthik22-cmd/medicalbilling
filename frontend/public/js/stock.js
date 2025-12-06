// Stock management JavaScript

let currentItems = [];

// Load all items
async function loadItems() {
    // Check role and update UI
    if (!isAdmin()) {
        // Hide upload and add forms
        const uploadCard = document.querySelector('#uploadForm').closest('.card');
        const addCard = document.querySelector('#addItemForm').closest('.card');

        if (uploadCard) uploadCard.style.display = 'none';
        if (addCard) addCard.style.display = 'none';

        // Update page header
        const pageHeader = document.querySelector('.page-header p');
        if (pageHeader) pageHeader.textContent = 'View current stock levels';
    }

    try {
        const response = await fetch('/api/stock/items', {
            headers: getAuthHeaders()
        });

        const data = await response.json();

        if (data.success) {
            currentItems = data.items;
            displayItems(data.items);
        } else {
            showAlert(data.message || 'Failed to load items');
        }
    } catch (error) {
        console.error('Load items error:', error);
        showAlert('Error loading items');
    }
}

// Display items in table
function displayItems(items) {
    const tbody = document.getElementById('stockTableBody');
    const isUserAdmin = isAdmin();

    if (items.length === 0) {
        tbody.innerHTML = `
      <tr>
        <td colspan="6" style="text-align: center; padding: 2rem; color: var(--gray);">
          No items in stock. ${isUserAdmin ? 'Add items using the form above.' : ''}
        </td>
      </tr>
    `;
        return;
    }

    // Update table header if not admin
    const tableHead = document.querySelector('table thead tr');
    if (!isUserAdmin && tableHead && tableHead.children.length === 6) {
        tableHead.lastElementChild.style.display = 'none';
    }

    tbody.innerHTML = items.map(item => `
    <tr>
      <td>${item.name}</td>
      <td>${item.batchNo}</td>
      <td>
        ${item.quantity < 10 ? `<span class="badge badge-warning">${item.quantity}</span>` : item.quantity}
      </td>
      <td>${formatCurrency(item.price)}</td>
      <td>${formatDate(item.expiryDate)}</td>
      ${isUserAdmin ? `
      <td>
        <button onclick="window.editItem('${item._id}')" class="btn btn-primary" style="padding: 0.5rem 1rem; margin-right: 0.5rem;">
          Edit
        </button>
        <button onclick="window.deleteItem('${item._id}')" class="btn btn-danger" style="padding: 0.5rem 1rem;">
          Delete
        </button>
      </td>` : ''}
    </tr>
  `).join('');
}

// Upload Excel
document.getElementById('uploadForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const fileInput = document.getElementById('excelFile');
    const file = fileInput.files[0];

    if (!file) {
        showAlert('Please select a file');
        return;
    }

    // Validate file type
    const validExtensions = ['.xlsx', '.xls'];
    const fileName = file.name.toLowerCase();
    const isValidType = validExtensions.some(ext => fileName.endsWith(ext));

    if (!isValidType) {
        showAlert('Please select a valid Excel file (.xlsx or .xls)');
        return;
    }

    const formData = new FormData();
    formData.append('excelFile', file);

    // Show loading state
    const submitBtn = e.target.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    submitBtn.disabled = true;
    submitBtn.innerHTML = 'Uploading...';

    try {
        const response = await fetch('/api/stock/upload-excel', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: formData
        });

        const data = await response.json();

        if (data.success) {
            showAlert(`Successfully processed! ${data.successCount} items added/updated.`, 'success');
            fileInput.value = '';
            loadItems();
        } else {
            showAlert(data.message || 'Upload failed');
        }
    } catch (error) {
        console.error('Upload error:', error);
        showAlert('Error uploading file. Please check the file format and try again.');
    } finally {
        // Restore button state
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalText;
    }
});

// Add item manually
document.getElementById('addItemForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const itemData = {
        name: document.getElementById('itemName').value,
        batchNo: document.getElementById('batchNo').value,
        quantity: parseInt(document.getElementById('quantity').value),
        price: parseFloat(document.getElementById('price').value),
        expiryDate: document.getElementById('expiryDate').value
    };

    try {
        const response = await fetch('/api/stock/items', {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify(itemData)
        });

        const data = await response.json();

        if (data.success) {
            showAlert('Item added successfully!', 'success');
            document.getElementById('addItemForm').reset();
            loadItems();
        } else {
            showAlert(data.message || 'Failed to add item');
        }
    } catch (error) {
        console.error('Add item error:', error);
        showAlert('Error adding item');
    }
});

// Edit item
function editItem(itemId) {
    const item = currentItems.find(i => i._id === itemId);
    if (!item) return;

    document.getElementById('editItemId').value = item._id;
    document.getElementById('editItemName').value = item.name;
    document.getElementById('editBatchNo').value = item.batchNo;
    document.getElementById('editQuantity').value = item.quantity;
    document.getElementById('editPrice').value = item.price;
    document.getElementById('editExpiryDate').value = item.expiryDate.split('T')[0];

    document.getElementById('editModal').classList.add('active');
}

function closeEditModal() {
    document.getElementById('editModal').classList.remove('active');
}

// Update item
document.getElementById('editItemForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const itemId = document.getElementById('editItemId').value;
    const itemData = {
        name: document.getElementById('editItemName').value,
        batchNo: document.getElementById('editBatchNo').value,
        quantity: parseInt(document.getElementById('editQuantity').value),
        price: parseFloat(document.getElementById('editPrice').value),
        expiryDate: document.getElementById('editExpiryDate').value
    };

    try {
        const response = await fetch(`/api/stock/items/${itemId}`, {
            method: 'PUT',
            headers: getAuthHeaders(),
            body: JSON.stringify(itemData)
        });

        const data = await response.json();

        if (data.success) {
            showAlert('Item updated successfully!', 'success');
            closeEditModal();
            loadItems();
        } else {
            showAlert(data.message || 'Failed to update item');
        }
    } catch (error) {
        console.error('Update item error:', error);
        showAlert('Error updating item');
    }
});

// Delete item - NO CONFIRMATION
async function deleteItem(itemId) {
    console.log('Deleting item with ID:', itemId);

    try {
        const response = await fetch(`/api/stock/items/${itemId}`, {
            method: 'DELETE',
            headers: getAuthHeaders()
        });

        console.log('Delete response status:', response.status);
        const data = await response.json();
        console.log('Delete response data:', data);

        if (data.success) {
            showAlert('Item deleted successfully!', 'success');
            loadItems();
        } else {
            showAlert(data.message || 'Failed to delete item');
        }
    } catch (error) {
        console.error('Delete item error:', error);
        showAlert('Error deleting item');
    }
}

// Make functions globally accessible for onclick handlers
window.editItem = editItem;
window.deleteItem = deleteItem;
window.closeEditModal = closeEditModal;

// Load items on page load
document.addEventListener('DOMContentLoaded', () => {
    loadItems();
});
