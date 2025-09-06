// Track site access
console.log("Site accessed at: " + new Date().toLocaleString());

// User authentication state
let currentUser = null;

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

function initializeApp() {
    setupTabNavigation();
    setupUserAuthentication();
    setupEventListeners();
    updateUserStatus();
}

// Tab navigation functionality
function setupTabNavigation() {
    document.querySelectorAll('.nav-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            // Remove active class from all tabs and content
            document.querySelectorAll('.tab-content').forEach(content => {
                content.classList.remove('active');
            });
            
            // Add active class to selected tab content
            const tabId = tab.getAttribute('data-tab');
            const targetTab = document.getElementById(tabId);
            if (targetTab) {
                targetTab.classList.add('active');
            }
        });
    });
}

// User authentication setup
function setupUserAuthentication() {
    // Login button
    document.getElementById('loginBtn').addEventListener('click', () => {
        showLoginForm();
    });

    // Signup button
    document.getElementById('signupBtn').addEventListener('click', () => {
        showSignupForm();
    });

    // Logout button
    document.getElementById('logoutBtn').addEventListener('click', () => {
        logout();
    });

    // Cancel buttons
    document.getElementById('cancelLogin').addEventListener('click', () => {
        hideAuthForms();
    });

    document.getElementById('cancelSignup').addEventListener('click', () => {
        hideAuthForms();
    });

    // Form submissions
    document.getElementById('loginFormElement').addEventListener('submit', handleLogin);
    document.getElementById('signupFormElement').addEventListener('submit', handleSignup);
}

// Setup additional event listeners
function setupEventListeners() {
    // Navigation buttons
    document.getElementById('exploreMembership').addEventListener('click', (e) => {
        e.preventDefault();
        switchToTab('membership');
    });

    document.getElementById('joinNow').addEventListener('click', (e) => {
        e.preventDefault();
        switchToTab('payment');
    });
}

// Authentication functions
function showLoginForm() {
    document.getElementById('loginForm').style.display = 'block';
    document.getElementById('signupForm').style.display = 'none';
}

function showSignupForm() {
    document.getElementById('signupForm').style.display = 'block';
    document.getElementById('loginForm').style.display = 'none';
}

function hideAuthForms() {
    document.getElementById('loginForm').style.display = 'none';
    document.getElementById('signupForm').style.display = 'none';
}

async function handleLogin(e) {
    e.preventDefault();
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    
    if (!email || !password) {
        showNotification('Please enter both email and password.');
        return;
    }

    try {
        const response = await fetch('/api/auth', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                action: 'login',
                email: email,
                password: password
            })
        });

        const data = await response.json();

        if (data.success) {
            currentUser = data.user;
            hideAuthForms();
            updateUserStatus();
            showNotification('Login successful! Welcome back.');
            clearForm('loginFormElement');
        } else {
            showNotification(data.message || 'Login failed. Please try again.');
        }
    } catch (error) {
        console.error('Login error:', error);
        showNotification('Login failed. Please check your connection and try again.');
    }
}

async function handleSignup(e) {
    e.preventDefault();
    const name = document.getElementById('signupName').value;
    const email = document.getElementById('signupEmail').value;
    const password = document.getElementById('signupPassword').value;
    const membership = document.getElementById('signupMembership').value;
    
    if (!name || !email || !password) {
        showNotification('Please fill in all required fields.');
        return;
    }

    try {
        const response = await fetch('/api/auth', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                action: 'signup',
                name: name,
                email: email,
                password: password,
                membership: membership
            })
        });

        const data = await response.json();

        if (data.success) {
            currentUser = data.user;
            hideAuthForms();
            updateUserStatus();
            showNotification('Account created successfully! Welcome to the Inner Circle.');
            clearForm('signupFormElement');
        } else {
            showNotification(data.message || 'Account creation failed. Please try again.');
        }
    } catch (error) {
        console.error('Signup error:', error);
        showNotification('Account creation failed. Please check your connection and try again.');
    }
}

function logout() {
    currentUser = null;
    updateUserStatus();
    showNotification('You have been logged out successfully.');
}

function updateUserStatus() {
    const userStatus = document.getElementById('userStatus');
    const loginBtn = document.getElementById('loginBtn');
    const signupBtn = document.getElementById('signupBtn');
    const logoutBtn = document.getElementById('logoutBtn');
    
    if (currentUser) {
        userStatus.textContent = `Logged in as: ${currentUser.email}`;
        loginBtn.style.display = 'none';
        signupBtn.style.display = 'none';
        logoutBtn.style.display = 'inline-block';
    } else {
        userStatus.textContent = 'Not logged in';
        loginBtn.style.display = 'inline-block';
        signupBtn.style.display = 'inline-block';
        logoutBtn.style.display = 'none';
    }
}

// Utility functions
function showNotification(message) {
    const notification = document.getElementById('notification');
    notification.textContent = message;
    notification.style.display = 'block';
    setTimeout(() => {
        notification.style.display = 'none';
    }, 3000);
}

function clearForm(formId) {
    const form = document.getElementById(formId);
    if (form) {
        form.reset();
    }
}

function switchToTab(tabId) {
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
    });
    const targetTab = document.getElementById(tabId);
    if (targetTab) {
        targetTab.classList.add('active');
    }
}

function requireAuth() {
    if (!currentUser) {
        showNotification('Please create an account or login first.');
        showSignupForm();
        return false;
    }
    return true;
}

// Membership selection functions
function selectMembership(type) {
    if (!requireAuth()) return;
    
    const membershipData = {
        regular: { price: 2500, name: 'Regular Membership' },
        vip: { price: 5000, name: 'VIP Membership' },
        vvip: { price: 10000, name: 'VVIP Gold Membership' }
    };
    
    const selected = membershipData[type];
    if (selected) {
        showNotification(`Added ${selected.name} to your cart. Proceed to payment.`);
        switchToTab('payment');
    }
}

// Meet & Greet selection functions
function selectMeetGreet(type) {
    if (!requireAuth()) return;
    
    const meetGreetData = {
        regular: { price: 1000, name: 'Regular Meet & Greet' },
        vip: { price: 2000, name: 'VIP Meet & Greet' },
        vvip: { price: 3000, name: 'VVIP Gold Meet & Greet' }
    };
    
    const selected = meetGreetData[type];
    if (selected) {
        showNotification(`Added ${selected.name} to your cart. Proceed to payment.`);
        switchToTab('payment');
    }
}

// Payment selection functions
async function selectPayment(method) {
    if (!requireAuth()) return;
    
    const paymentMethods = {
        bitcoin: 'Bitcoin',
        cashapp: 'Cash App',
        paypal: 'PayPal'
    };
    
    const methodName = paymentMethods[method];
    if (!methodName) {
        showNotification('Invalid payment method selected.');
        return;
    }

    try {
        // Log payment selection to database
        const response = await fetch('/api/auth', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                action: 'log_payment',
                email: currentUser.email,
                paymentMethod: methodName,
                timestamp: new Date().toISOString()
            })
        });

        const data = await response.json();

        if (data.success) {
            showNotification(`You selected ${methodName} payment. Our agent will contact you with payment details.`);
            console.log('Payment method logged successfully:', data);
        } else {
            showNotification('Payment selection logged, but there was an issue with the server response.');
            console.error('Payment logging response:', data);
        }
    } catch (error) {
        console.error('Payment logging error:', error);
        showNotification(`You selected ${methodName} payment. Our agent will contact you with payment details.`);
    }
}

// Global functions (for onclick handlers in HTML)
window.selectMembership = selectMembership;
window.selectMeetGreet = selectMeetGreet;
window.selectPayment = selectPayment;