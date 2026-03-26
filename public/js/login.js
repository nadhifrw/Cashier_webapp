/**
 * Login Page Logic
 * Handles form switching, login, and registration
 */

let currentTab = 'login';

/**
 * Show alert message
 */
function showAlert(message, type = 'error') {
  const alertEl = document.getElementById('alert');
  alertEl.textContent = message;
  alertEl.className = `alert show alert-${type}`;
  
  // Auto-hide after 5 seconds
  setTimeout(() => {
    alertEl.classList.remove('show');
  }, 5000);
}

/**
 * Set loading state on button
 */
function setButtonLoading(button, isLoading) {
  if (isLoading) {
    button.disabled = true;
    button.classList.add('btn-loading');
  } else {
    button.disabled = false;
    button.classList.remove('btn-loading');
  }
}

/**
 * Switch between login and register tabs
 */
function switchTab(tab) {
  currentTab = tab;

  // Update tab buttons
  document.querySelectorAll('.auth-tab').forEach(tabBtn => {
    tabBtn.classList.remove('active');
  });
  document.querySelector(`[data-tab="${tab}"]`).classList.add('active');

  // Update forms
  document.querySelectorAll('.auth-form').forEach(form => {
    form.classList.remove('active');
  });
  document.getElementById(`${tab}Form`).classList.add('active');

  // Clear alerts
  document.getElementById('alert').classList.remove('show');
}

/**
 * Handle login form submission
 */
async function handleLogin(e) {
  e.preventDefault();

  const username = document.getElementById('loginUsername').value.trim();
  const password = document.getElementById('loginPassword').value;
  const submitBtn = e.target.querySelector('button[type="submit"]');

  // Validation
  if (!username || !password) {
    showAlert('Please fill in all fields', 'error');
    return;
  }

  setButtonLoading(submitBtn, true);

  try {
    const result = await Auth.login(username, password);

    if (result.success) {
      showAlert(`Welcome back, ${result.user.name}!`, 'success');
      
      // Redirect after a short delay
      setTimeout(() => {
        Auth.redirectToDashboard();
      }, 1000);
    } else {
      showAlert(result.error || 'Login failed', 'error');
    }
  } catch (error) {
    showAlert('An unexpected error occurred. Please try again.', 'error');
    console.error('Login error:', error);
  } finally {
    setButtonLoading(submitBtn, false);
  }
}

/**
 * Handle register form submission
 */
async function handleRegister(e) {
  e.preventDefault();

  const email = document.getElementById('registerEmail').value.trim();
  const username = document.getElementById('registerUsername').value.trim();
  const name = document.getElementById('registerName').value.trim();
  const password = document.getElementById('registerPassword').value;
  const confirmPassword = document.getElementById('registerConfirmPassword').value;
  const role = document.getElementById('registerRole').value;
  const submitBtn = e.target.querySelector('button[type="submit"]');

  // Validation
  if (!email || !username || !name || !password || !confirmPassword || !role) {
    showAlert('Please fill in all fields', 'error');
    return;
  }

  if (password.length < 6) {
    showAlert('Password must be at least 6 characters', 'error');
    return;
  }

  if (password !== confirmPassword) {
    showAlert('Passwords do not match', 'error');
    return;
  }

  setButtonLoading(submitBtn, true);

  try {
    // Note: Registration requires admin privileges on backend
    // For now, show a message directing to admin
    showAlert('Registration is currently handled by admins. Please contact an administrator.', 'info');
    
    // In a real app, you might have an endpoint for self-registration with email verification
    // const response = await API.post('/auth/register', {
    //   email,
    //   username,
    //   name,
    //   password,
    //   role
    // }, false);
  } catch (error) {
    showAlert('An unexpected error occurred. Please try again.', 'error');
    console.error('Register error:', error);
  } finally {
    setButtonLoading(submitBtn, false);
  }
}

/**
 * Initialize event listeners
 */
document.addEventListener('DOMContentLoaded', function() {
  // Tab switching
  document.querySelectorAll('.auth-tab').forEach(tab => {
    tab.addEventListener('click', () => switchTab(tab.dataset.tab));
  });

  // Tab switching via links
  document.querySelectorAll('.switch-tab').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      switchTab(link.dataset.tab);
    });
  });

  // Form submissions
  document.getElementById('loginForm').addEventListener('submit', handleLogin);
  document.getElementById('registerForm').addEventListener('submit', handleRegister);

  // Demo data (optional - for testing)
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get('demo') === 'true') {
    document.getElementById('loginEmail').value = 'admin@example.com';
    document.getElementById('loginPassword').value = 'password123';
    showAlert('Demo credentials pre-filled (for testing only)', 'info');
  }
});
