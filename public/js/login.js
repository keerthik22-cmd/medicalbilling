const loginForm = document.getElementById('loginForm');
const alertContainer = document.getElementById('alertContainer');
const loginBtnText = document.getElementById('loginBtnText');
const loginSpinner = document.getElementById('loginSpinner');

function showAlert(message, type = 'error') {
    alertContainer.innerHTML = `
    <div class="alert alert-${type}">
      ${message}
    </div>
  `;

    setTimeout(() => {
        alertContainer.innerHTML = '';
    }, 5000);
}

loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    // Show loading state
    loginBtnText.style.display = 'none';
    loginSpinner.style.display = 'block';

    try {
        const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();

        if (data.success) {
            // Store token in localStorage
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));

            showAlert('Login successful! Redirecting...', 'success');

            setTimeout(() => {
                window.location.href = '/dashboard';
            }, 1000);
        } else {
            showAlert(data.message || 'Login failed. Please try again.');
            loginBtnText.style.display = 'block';
            loginSpinner.style.display = 'none';
        }
    } catch (error) {
        console.error('Login error:', error);
        showAlert('An error occurred. Please try again.');
        loginBtnText.style.display = 'block';
        loginSpinner.style.display = 'none';
    }
});

// Check if already logged in
window.addEventListener('DOMContentLoaded', async () => {
    const token = localStorage.getItem('token');

    if (token) {
        try {
            const response = await fetch('/api/auth/status');
            const data = await response.json();

            if (data.authenticated) {
                window.location.href = '/dashboard';
            }
        } catch (error) {
            console.error('Auth check error:', error);
        }
    }
});
