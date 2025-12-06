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

// Get user role from localStorage
function getUserRole() {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    return user.role || 'user';
}

// Check if current user is admin
function isAdmin() {
    return getUserRole() === 'admin';
}

// Check if user has access to current page
function checkUserAccess() {
    const role = getUserRole();
    const currentPath = window.location.pathname;

    // Admin has access to all pages
    if (role === 'admin') {
        return true;
    }

    // Pages allowed for 'user' role
    const userAllowedPages = ['/dashboard', '/billing', '/cart', '/reports', '/payment', '/payment-success', '/payment-failed', '/stock'];

    if (!userAllowedPages.includes(currentPath)) {
        // Redirect to dashboard if user tries to access restricted page
        window.location.href = '/dashboard';
        return false;
    }

    return true;
}

// Hide sidebar items based on role
function updateSidebarForRole() {
    const role = getUserRole();

    // if (role !== 'admin') {
    //     // Hide Stock Maintain link for non-admin users
    //     document.querySelectorAll('.sidebar-nav a').forEach(link => {
    //         if (link.getAttribute('href') === '/stock') {
    //             link.style.display = 'none';
    //         }
    //     });
    // }
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

// Handle logout click (for inline onclick handler)
function handleLogout(event) {
    if (event) {
        event.preventDefault();
        event.stopPropagation();
    }

    // Add confirmation
    if (confirm('Are you sure you want to logout?')) {
        logout();
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
        if (!checkAuth()) {
            return; // Stop if not authenticated
        }

        // Check if user has access to this page
        if (!checkUserAccess()) {
            return; // Stop if redirecting
        }

        // Update sidebar based on role
        updateSidebarForRole();

        // Display user email
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        const userEmailEl = document.getElementById('userEmail');
        if (userEmailEl && user.email) {
            userEmailEl.textContent = user.email;
        }
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


