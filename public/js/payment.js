// Global variables
let currentUser = null;
let selectedEvents = [];
let totalAmount = 0;

// IMMEDIATE CHECK
console.log('=== PAYMENT.JS LOADING ===');

const immediateUserStr = localStorage.getItem('user');
console.log('Immediate check - user in localStorage:', immediateUserStr);

if (!immediateUserStr) {
    console.log('CRITICAL: No user found immediately, redirecting');
    alert('Session expired. Please login again.');
    window.location.href = '/login.html';
} else {
    try {
        currentUser = JSON.parse(immediateUserStr);
        console.log('User loaded immediately:', currentUser);
        
        if (!currentUser.user_id && !currentUser.id) {
            console.error('Invalid user object:', currentUser);
            throw new Error('Invalid user');
        }
        
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', initPaymentPage);
        } else {
            initPaymentPage();
        }
        
    } catch (error) {
        console.error('Error parsing user immediately:', error);
        alert('Session error. Please login again.');
        localStorage.removeItem('user');
        window.location.href = '/login.html';
    }
}

function initPaymentPage() {
    console.log('=== INITIALIZING PAYMENT PAGE ===');
    
    const freshUserStr = localStorage.getItem('user');
    if (!freshUserStr) {
        console.log('User lost during init, redirecting');
        alert('Session expired. Please login again.');
        window.location.href = '/login.html';
        return;
    }
    
    try {
        currentUser = JSON.parse(freshUserStr);
        console.log('Refreshed user:', currentUser);
        
        if (!currentUser.user_id && !currentUser.id) {
            throw new Error('Invalid user');
        }
    } catch (error) {
        console.error('Error refreshing user:', error);
        window.location.href = '/login.html';
        return;
    }
    
    loadSelectedEvents();
    loadAdminPaymentInfo();
    
    const paymentForm = document.getElementById('paymentForm');
    if (paymentForm) {
        paymentForm.addEventListener('submit', handlePaymentSubmit);
    }
    
    const tsidInput = document.getElementById('transaction_id');
    if (tsidInput) {
        tsidInput.addEventListener('input', function() {
            const tsidError = document.getElementById('tsidError');
            if (tsidError) {
                tsidError.style.display = 'none';
            }
        });
    }
    
    console.log('Payment page initialization complete');
}

function loadSelectedEvents() {
    console.log('Loading selected events...');
    
    const savedEvents = localStorage.getItem('selectedEvents');
    console.log('Saved events string:', savedEvents);
    
    if (savedEvents) {
        try {
            selectedEvents = JSON.parse(savedEvents);
            console.log('Selected events IDs:', selectedEvents);
        } catch (e) {
            console.error('Error parsing selected events:', e);
            selectedEvents = [];
        }
    }
    
    const savedTotal = localStorage.getItem('totalAmount');
    console.log('Saved total string:', savedTotal);
    
    if (savedTotal) {
        totalAmount = parseFloat(savedTotal);
        const totalAmountSpan = document.getElementById('totalAmount');
        if (totalAmountSpan) {
            totalAmountSpan.textContent = totalAmount;
        }
        console.log('Total amount:', totalAmount);
    }
    
    if (selectedEvents.length === 0) {
        console.log('No events selected');
        alert('No events selected. Please go back and select events.');
        window.location.href = '/events.html';
        return;
    }
    
    loadEventDetails();
}

async function loadEventDetails() {
    console.log('Loading event details...');
    
    try {
        const response = await fetch('/api/events');
        if (!response.ok) {
            throw new Error('Failed to load events');
        }
        
        const allEvents = await response.json();
        const selectedEventDetails = allEvents.filter(event => selectedEvents.includes(event.event_id));
        
        const container = document.getElementById('selectedEventsList');
        if (container) {
            if (selectedEventDetails.length > 0) {
                container.innerHTML = `
                    <ul style="list-style: none; padding: 0;">
                        ${selectedEventDetails.map(event => `
                            <li style="padding: 8px 0; border-bottom: 1px solid #eee;">
                                ${escapeHtml(event.event_name)} - ৳${event.event_price}
                            </li>
                        `).join('')}
                    </ul>
                `;
            } else {
                container.innerHTML = '<p>No events selected. <a href="/events.html">Go back to events</a></p>';
            }
        }
    } catch (error) {
        console.error('Error loading event details:', error);
        const container = document.getElementById('selectedEventsList');
        if (container) {
            container.innerHTML = '<p style="color: red;">Error loading events. Please try again.</p>';
        }
    }
}

async function loadAdminPaymentInfo() {
    console.log('Loading admin payment info...');
    
    try {
        const response = await fetch('/api/admin/payment-info');
        if (!response.ok) {
            throw new Error('Failed to load payment info');
        }
        
        const paymentInfo = await response.json();
        console.log('Admin payment info:', paymentInfo);
        
        const container = document.getElementById('adminPaymentInfo');
        if (container) {
            if (paymentInfo.length > 0) {
                container.innerHTML = `
                    <div style="background: #e8f4fd; padding: 12px; border-radius: 5px;">
                        <strong>📱 Send payment to:</strong><br>
                        ${paymentInfo.map(info => `
                            <div style="margin-top: 8px;">
                                <strong>${info.payment_method.toUpperCase()}:</strong> ${info.account_number}
                            </div>
                        `).join('')}
                        <hr style="margin: 10px 0;">
                        <small>After sending payment, submit the transaction ID below.</small>
                    </div>
                `;
            } else {
                container.innerHTML = '<div class="alert alert-info">Payment information will be updated soon.</div>';
            }
        }
    } catch (error) {
        console.error('Error loading payment info:', error);
        const container = document.getElementById('adminPaymentInfo');
        if (container) {
            container.innerHTML = '<div class="alert alert-error">Unable to load payment information. Please contact admin.</div>';
        }
    }
}

// Show confirmation modal
function showConfirmation(status, title, message) {
    const modal = document.getElementById('confirmationModal');
    const icon = document.getElementById('confirmationIcon');
    const titleEl = document.getElementById('confirmationTitle');
    const messageEl = document.getElementById('confirmationMessage');
    const spinner = document.getElementById('loadingSpinner');
    const btn = document.getElementById('confirmationBtn');
    
    if (status === 'loading') {
        icon.className = 'confirmation-pending';
        icon.innerHTML = '';
        titleEl.textContent = title;
        messageEl.textContent = message;
        spinner.style.display = 'block';
        btn.style.display = 'none';
    } else if (status === 'success') {
        icon.className = 'confirmation-success';
        icon.innerHTML = '';
        titleEl.textContent = title;
        messageEl.textContent = message;
        spinner.style.display = 'none';
        btn.style.display = 'block';
        btn.textContent = 'View Payment History';
        btn.onclick = () => {
            modal.style.display = 'none';
            window.location.href = '/history.html';
        };
    } else if (status === 'error') {
        icon.className = 'confirmation-error';
        icon.innerHTML = '';
        titleEl.textContent = title;
        messageEl.textContent = message;
        spinner.style.display = 'none';
        btn.style.display = 'block';
        btn.textContent = 'Try Again';
        btn.onclick = () => {
            modal.style.display = 'none';
        };
    }
    
    modal.style.display = 'flex';
}

// Hide confirmation modal
function hideConfirmation() {
    const modal = document.getElementById('confirmationModal');
    modal.style.display = 'none';
}

async function handlePaymentSubmit(e) {
    e.preventDefault();
    
    console.log('=== PAYMENT SUBMIT STARTED ===');
    
    // Show loading confirmation
    showConfirmation('loading', 'Processing Payment...', 'Please wait while we process your payment...');
    
    const userStr = localStorage.getItem('user');
    if (!userStr) {
        hideConfirmation();
        showAlert('Session expired. Please login again.', 'error');
        setTimeout(() => {
            window.location.href = '/login.html';
        }, 2000);
        return;
    }
    
    let user;
    try {
        user = JSON.parse(userStr);
    } catch (error) {
        hideConfirmation();
        showAlert('Session error. Please login again.', 'error');
        setTimeout(() => {
            window.location.href = '/login.html';
        }, 2000);
        return;
    }
    
    const payment_method = document.getElementById('payment_method').value;
    const account_number = document.getElementById('account_number').value;
    const transaction_id = document.getElementById('transaction_id').value;
    
    // Validate
    if (!payment_method || !account_number || !transaction_id) {
        hideConfirmation();
        showAlert('Please fill in all fields', 'error');
        return;
    }
    
    const phoneRegex = /^\+8801[3-9]\d{8}$/;
    if (!phoneRegex.test(account_number)) {
        hideConfirmation();
        showAlert('Please enter a valid phone number in format +8801XXXXXXXXX', 'error');
        return;
    }
    
    if (transaction_id.length < 8 || transaction_id.length > 20) {
        hideConfirmation();
        showAlert('Transaction ID must be 8-20 characters long', 'error');
        return;
    }
    
    // Check if transaction ID exists
    try {
        const tsidCheck = await fetch(`/api/payments/verify-tsid/${transaction_id}`);
        const tsidData = await tsidCheck.json();
        
        if (tsidData.exists) {
            hideConfirmation();
            const tsidError = document.getElementById('tsidError');
            if (tsidError) tsidError.style.display = 'block';
            showAlert('Transaction ID already exists. Please check and try again.', 'error');
            return;
        }
    } catch (error) {
        console.error('Error checking transaction ID:', error);
    }
    
    // Disable submit button
    const submitBtn = document.getElementById('submitBtn');
    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Submitting...';
    }
    
    // Submit payment
    const paymentData = {
        user_id: user.user_id,
        payment_method: payment_method,
        account_number: account_number,
        transaction_id: transaction_id,
        total_amount: totalAmount,
        event_ids: selectedEvents
    };
    
    console.log('Sending payment data to server:', paymentData);
    
    try {
        const response = await fetch('/api/payments/submit', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(paymentData)
        });
        
        const data = await response.json();
        console.log('Response data:', data);
        
        if (response.ok) {
            // Clear cart and selected events
            localStorage.removeItem('cart');
            localStorage.removeItem('selectedEvents');
            localStorage.removeItem('totalAmount');
            
            // Show success confirmation
            showConfirmation(
                'success',
                'Payment Submitted Successfully!',
                `Your payment of ৳${totalAmount} has been submitted.\n\nTransaction ID: ${transaction_id}\n\nStatus: Pending Verification\n\nYou will receive confirmation within 24 hours.`
            );
            
            // Re-enable submit button after delay
            setTimeout(() => {
                if (submitBtn) {
                    submitBtn.disabled = false;
                    submitBtn.textContent = 'Submit Payment';
                }
            }, 3000);
        } else {
            // Show error confirmation
            let errorMessage = 'Payment submission failed. ';
            if (data.error) {
                errorMessage += data.error;
            } else if (data.errors) {
                errorMessage += data.errors.map(err => err.msg).join(', ');
            } else {
                errorMessage += 'Please try again.';
            }
            
            showConfirmation('error', 'Payment Failed', errorMessage);
            
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.textContent = 'Submit Payment';
            }
        }
    } catch (error) {
        console.error('Payment error:', error);
        showConfirmation('error', 'Network Error', 'An error occurred. Please check your connection and try again.');
        
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Submit Payment';
        }
    }
}

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

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}