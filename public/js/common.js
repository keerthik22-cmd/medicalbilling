// Common functions for all pages

// Check authentication
function checkAuth() {
    const token = localStorage.getItem('token');

    if (!token) {
        window.location.href = '/';
        return false;
    }

    return token;
}

// Get auth headers
function getAuthHeaders() {
    const token = localStorage.getItem('token');
    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
    };
}

// Logout function
async function logout() {
    try {
        await fetch('/api/auth/logout', {
            method: 'POST',
            headers: getAuthHeaders()
        });
    } catch (error) {
        console.error('Logout error:', error);
    } finally {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/';
    }
}

// Show alert
function showAlert(message, type = 'error', containerId = 'alertContainer') {
    const container = document.getElementById(containerId);
    if (!container) return;

    container.innerHTML = `
    <div class="alert alert-${type}">
      ${message}
    </div>
  `;

    setTimeout(() => {
        container.innerHTML = '';
    }, 5000);
}

// Format currency
function formatCurrency(amount) {
    return `₹${parseFloat(amount).toFixed(2)}`;
}

// Format date
function formatDate(date) {
    return new Date(date).toLocaleDateString('en-IN');
}

// Initialize common elements
document.addEventListener('DOMContentLoaded', () => {
    // Check auth on protected pages
    if (!window.location.pathname.includes('login') && window.location.pathname !== '/') {
        checkAuth();

        // Display user email
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        const userEmailEl = document.getElementById('userEmail');
        if (userEmailEl && user.email) {
            userEmailEl.textContent = user.email;
        }
    }

    // Logout button
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            if (confirm('Are you sure you want to logout?')) {
                logout();
            }
        });
    }

    // Set active nav link
    const currentPath = window.location.pathname;
    document.querySelectorAll('.sidebar-nav a').forEach(link => {
        if (link.getAttribute('href') === currentPath) {
            link.classList.add('active');
        } else {
            link.classList.remove('active');
        }
    });
});
