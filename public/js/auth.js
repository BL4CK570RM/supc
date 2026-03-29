// Make sure requireAuth is globally available
window.requireAuth = function() {
    try {
        const user = localStorage.getItem('user');
        if (!user) {
            console.log('No user found in localStorage');
            return null;
        }
        const parsedUser = JSON.parse(user);
        console.log('requireAuth - User found:', parsedUser);
        return parsedUser;
    } catch (error) {
        console.error('Error parsing user:', error);
        return null;
    }
};

// Also add checkAuth function
window.checkAuth = function() {
    const user = window.requireAuth();
    return user !== null;
};

console.log('auth.js loaded, requireAuth available');

window.checkAuth = function() {
    const user = window.requireAuth();
    return user !== null;
};

window.getCurrentUser = function() {
    return window.requireAuth();
};

// Handle login form
if (document.getElementById('loginForm')) {
    document.getElementById('loginForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const student_id = document.getElementById('student_id').value;
        const password = document.getElementById('password').value;
        
        console.log('Attempting login with:', student_id);
        
        try {
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ student_id, password })
            });
            
            const data = await response.json();
            console.log('Login response:', data);
            
            if (response.ok) {
                // Store user in localStorage
                localStorage.setItem('user', JSON.stringify(data.user));
                console.log('User stored in localStorage:', data.user);
                
                // Redirect based on role
                if (data.user.role === 'admin') {
                    window.location.href = '/admin/dashboard.html';
                } else {
                    window.location.href = '/dashboard.html';
                }
            } else {
                showAlert(data.error, 'error');
            }
        } catch (error) {
            console.error('Login error:', error);
            showAlert('An error occurred. Please try again.', 'error');
        }
    });
}

// Handle signup form
if (document.getElementById('signupForm')) {
    const form = document.getElementById('signupForm');
    let idTimeout, phoneTimeout, emailTimeout;
    
    // Real-time validation for student ID
    const studentIdInput = document.getElementById('student_id');
    if (studentIdInput) {
        studentIdInput.addEventListener('input', function() {
            clearTimeout(idTimeout);
            const id = this.value;
            const idError = document.getElementById('idError');
            
            if (id.length >= 3) {
                idTimeout = setTimeout(async () => {
                    try {
                        const response = await fetch(`/api/auth/check-id/${id}`);
                        const data = await response.json();
                        if (data.exists) {
                            idError.style.display = 'block';
                            this.setCustomValidity('ID already exists');
                        } else {
                            idError.style.display = 'none';
                            this.setCustomValidity('');
                        }
                    } catch (error) {
                        console.error('Error checking ID:', error);
                    }
                }, 500);
            }
        });
    }
    
    // Real-time validation for phone
    const phoneInput = document.getElementById('phone');
    if (phoneInput) {
        phoneInput.addEventListener('input', function() {
            clearTimeout(phoneTimeout);
            const phone = this.value;
            const phoneError = document.getElementById('phoneError');
            
            if (phone.length >= 10) {
                phoneTimeout = setTimeout(async () => {
                    try {
                        const response = await fetch(`/api/auth/check-phone/${phone}`);
                        const data = await response.json();
                        if (data.exists) {
                            phoneError.style.display = 'block';
                            this.setCustomValidity('Phone number already registered');
                        } else {
                            phoneError.style.display = 'none';
                            this.setCustomValidity('');
                        }
                    } catch (error) {
                        console.error('Error checking phone:', error);
                    }
                }, 500);
            }
        });
    }
    
    // Real-time validation for email
    const emailInput = document.getElementById('email');
    if (emailInput) {
        emailInput.addEventListener('input', function() {
            clearTimeout(emailTimeout);
            const email = this.value;
            const emailError = document.getElementById('emailError');
            
            if (email.includes('@')) {
                emailTimeout = setTimeout(async () => {
                    try {
                        const response = await fetch(`/api/auth/check-email/${email}`);
                        const data = await response.json();
                        if (data.exists) {
                            emailError.style.display = 'block';
                            this.setCustomValidity('Email already registered');
                        } else {
                            emailError.style.display = 'none';
                            this.setCustomValidity('');
                        }
                    } catch (error) {
                        console.error('Error checking email:', error);
                    }
                }, 500);
            }
        });
    }
    
    // Password confirmation validation
    const password = document.getElementById('password');
    const confirmPassword = document.getElementById('confirm_password');
    const passwordError = document.getElementById('passwordError');
    
    function validatePasswordMatch() {
        if (password && confirmPassword) {
            if (password.value !== confirmPassword.value) {
                if (passwordError) passwordError.style.display = 'block';
                if (confirmPassword) confirmPassword.setCustomValidity('Passwords do not match');
                return false;
            } else {
                if (passwordError) passwordError.style.display = 'none';
                if (confirmPassword) confirmPassword.setCustomValidity('');
                return true;
            }
        }
        return true;
    }
    
    if (password && confirmPassword) {
        password.addEventListener('input', validatePasswordMatch);
        confirmPassword.addEventListener('input', validatePasswordMatch);
    }
    
    // Form submission
    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            if (!validatePasswordMatch()) {
                return;
            }
            
            const formData = {
                student_id: document.getElementById('student_id').value,
                name: document.getElementById('name').value,
                department: document.getElementById('department').value,
                phone: document.getElementById('phone').value,
                email: document.getElementById('email').value,
                password: document.getElementById('password').value
            };
            
            console.log('Submitting signup:', formData);
            
            try {
                const response = await fetch('/api/auth/signup', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(formData)
                });
                
                const data = await response.json();
                console.log('Signup response:', data);
                
                if (response.ok) {
                    showAlert('Account created successfully! Please login.', 'success');
                    setTimeout(() => {
                        window.location.href = '/login.html';
                    }, 2000);
                } else {
                    if (data.errors && data.errors.length > 0) {
                        const errorMsg = data.errors.map(err => err.msg).join(', ');
                        showAlert(errorMsg, 'error');
                    } else if (data.error) {
                        showAlert(data.error, 'error');
                    } else {
                        showAlert('Signup failed. Please check your information.', 'error');
                    }
                }
            } catch (error) {
                console.error('Signup error:', error);
                showAlert('An error occurred. Please try again.', 'error');
            }
        });
    }
}

// Helper function to show alerts
function showAlert(message, type) {
    const alertDiv = document.getElementById('alertMessage');
    if (alertDiv) {
        alertDiv.style.display = 'block';
        alertDiv.className = `alert alert-${type}`;
        alertDiv.innerHTML = message;
        
        setTimeout(() => {
            alertDiv.style.display = 'none';
        }, 5000);
    } else {
        alert(message);
    }
}

// Handle logout
const logoutBtn = document.getElementById('logoutBtn');
if (logoutBtn) {
    logoutBtn.addEventListener('click', (e) => {
        e.preventDefault();
        localStorage.removeItem('user');
        localStorage.removeItem('cart');
        localStorage.removeItem('selectedEvents');
        localStorage.removeItem('totalAmount');
        console.log('Logged out, clearing localStorage');
        window.location.href = '/login.html';
    });
}

console.log('auth.js loaded successfully');