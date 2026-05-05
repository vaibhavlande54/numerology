// Login Page JavaScript
// Theme toggle, form handling, and authentication

// Theme toggle
const themeToggle = document.getElementById('theme-toggle');
const html = document.documentElement;

function setTheme(theme) {
    html.setAttribute('data-theme', theme);
    document.body.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
    if (themeToggle) {
        themeToggle.textContent = theme === 'dark' ? '☀️' : '🌙';
        themeToggle.setAttribute('aria-label', theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode');
    }
}

const savedTheme = localStorage.getItem('theme') || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
setTheme(savedTheme);

if (themeToggle) {
    themeToggle.addEventListener('click', () => {
        setTheme(html.getAttribute('data-theme') === 'dark' ? 'light' : 'dark');
    });
}

// Mobile nav toggle
const navToggle = document.querySelector('.nav-toggle');
const navLinks = document.getElementById('nav-links');

if (navToggle && navLinks) {
    navToggle.addEventListener('click', function() {
        const expanded = navToggle.getAttribute('aria-expanded') === 'true';
        navToggle.setAttribute('aria-expanded', !expanded);
        navLinks.classList.toggle('open');
    });
}

// Form toggle logic
const loginTab = document.getElementById('loginTab');
const registerTab = document.getElementById('registerTab');
const toggleTabs = document.getElementById('toggleTabs');
const loginForm = document.getElementById('loginForm');
const registerForm = document.getElementById('registerForm');
const toRegister = document.getElementById('toRegister');
const toLogin = document.getElementById('toLogin');

function showLogin() {
    toggleTabs.classList.add('login');
    toggleTabs.classList.remove('register');
    loginTab.classList.add('active');
    registerTab.classList.remove('active');
    loginForm.style.display = '';
    registerForm.style.display = 'none';
}

function showRegister() {
    toggleTabs.classList.add('register');
    toggleTabs.classList.remove('login');
    loginTab.classList.remove('active');
    registerTab.classList.add('active');
    loginForm.style.display = 'none';
    registerForm.style.display = '';
}

loginTab.addEventListener('click', showLogin);
registerTab.addEventListener('click', showRegister);
toRegister.addEventListener('click', (e) => { e.preventDefault(); showRegister(); });
toLogin.addEventListener('click', (e) => { e.preventDefault(); showLogin(); });

// Check URL parameter to show register tab on page load
window.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const tab = urlParams.get('tab');
    
    if (tab === 'register' || tab === 'signup') {
        showRegister();
    } else {
        showLogin();
    }
});

// Backend API URL (relative so it works on any host/port)
const API_URL = '/api';

// Show notification
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#3b82f6'};
        color: white;
        padding: 1rem 1.5rem;
        border-radius: 0.5rem;
        box-shadow: 0 10px 25px rgba(0,0,0,0.2);
        z-index: 10000;
        animation: slideIn 0.3s ease;
        max-width: 300px;
    `;
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Add CSS for animations
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from { transform: translateX(400px); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(400px); opacity: 0; }
    }
`;
document.head.appendChild(style);

// Login form submission
loginForm.addEventListener('submit', async function(e) {
    e.preventDefault();
    // clear inline errors
    const le = document.getElementById('loginEmailError');
    const lp = document.getElementById('loginPasswordError');
    if (le) le.textContent = '';
    if (lp) lp.textContent = '';
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    const submitBtn = loginForm.querySelector('.submit-btn');
    
    submitBtn.disabled = true;
    submitBtn.textContent = 'Logging in...';
    
    try {
        const response = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email, password })
        });
        
        const data = await response.json();
        
        if (data.success) {
            localStorage.setItem('user', JSON.stringify(data.user));
            localStorage.setItem('isLoggedIn', 'true');
            if (data.token) {
                localStorage.setItem('token', data.token);
            }
            showNotification('✅ Login successful! Redirecting...', 'success');
            setTimeout(() => {
                window.location.href = 'index_new.html';
            }, 1000);
        } else {
            // show inline errors if available
            if (data.error && typeof data.error === 'string') {
                if (data.error.toLowerCase().includes('email')) {
                    if (le) le.textContent = data.error;
                } else if (data.error.toLowerCase().includes('password')) {
                    if (lp) lp.textContent = data.error;
                } else {
                    showNotification(`❌ ${data.error}`, 'error');
                }
            } else {
                showNotification('❌ Login failed. Please check your details.', 'error');
            }
        }
    } catch (error) {
        console.error('Login error:', error);
        showNotification('❌ Login failed. Please check if backend is running.', 'error');
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Login';
    }
});

// Register form submission
registerForm.addEventListener('submit', async function(e) {
    e.preventDefault();
    const name = document.getElementById('registerName').value;
    const email = document.getElementById('registerEmail').value;
    const password = document.getElementById('registerPassword').value;
    const confirmPassword = document.getElementById('registerConfirm').value;
    // clear inline errors
    const rn = document.getElementById('registerNameError');
    const re = document.getElementById('registerEmailError');
    const rp = document.getElementById('registerPasswordError');
    const rc = document.getElementById('registerConfirmError');
    if (rn) rn.textContent = '';
    if (re) re.textContent = '';
    if (rp) rp.textContent = '';
    if (rc) rc.textContent = '';
    
    if (password !== confirmPassword) {
        if (rc) rc.textContent = 'Passwords do not match';
        return;
    } else {
        if (rc) rc.textContent = '';
    }
    
    const submitBtn = registerForm.querySelector('.submit-btn');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Registering...';
    
    try {
        const response = await fetch(`${API_URL}/auth/signup`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ name, email, password })
        });
        
        const data = await response.json();
        
        if (data.success) {
            showNotification('✅ Registration successful! Please login.', 'success');
            setTimeout(() => {
                document.getElementById('loginEmail').value = email;
                document.getElementById('loginPassword').value = password;
                showLogin();
            }, 1500);
        } else {
            if (data.error && typeof data.error === 'string') {
                const err = data.error.toLowerCase();
                if (err.includes('name')) {
                    if (rn) rn.textContent = data.error;
                } else if (err.includes('email')) {
                    if (re) re.textContent = data.error;
                } else if (err.includes('password')) {
                    if (rp) rp.textContent = data.error;
                } else {
                    showNotification(`❌ ${data.error}`, 'error');
                }
            } else {
                showNotification('❌ Registration failed. Please check your details.', 'error');
            }
        }
    } catch (error) {
        console.error('Registration error:', error);
        showNotification('❌ Registration failed. Please check if backend is running.', 'error');
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Register';
    }
});

// Remove custom validity on input
registerForm.registerConfirm.addEventListener('input', function() {
    registerForm.registerConfirm.setCustomValidity('');
    const rc = document.getElementById('registerConfirmError');
    if (rc) rc.textContent = '';
});

console.log('✅ Login page scripts loaded successfully');

// Password strength meter logic
const pwd = document.getElementById('registerPassword');
const bar = document.getElementById('passwordStrengthBar');
const label = document.getElementById('passwordStrengthText');
if (pwd && bar && label) {
    pwd.addEventListener('input', () => {
        const val = pwd.value || '';
        let score = 0;
        if (val.length >= 6) score++;
        if (/[A-Z]/.test(val)) score++;
        if (/[a-z]/.test(val)) score++;
        if (/[0-9]/.test(val)) score++;
        if (/[^A-Za-z0-9]/.test(val)) score++;
        // normalize score to 0..4
        score = Math.min(score, 4);
        const widths = ['0%','25%','50%','75%','100%'];
        const colors = ['#ef4444','#f59e0b','#10b981','#14b8a6','#0ea5e9'];
        const texts = ['Too short','Weak','Fair','Good','Strong'];
        bar.style.width = widths[score];
        bar.style.background = colors[score];
        label.textContent = `Password strength: ${texts[score]}`;
    });
}
