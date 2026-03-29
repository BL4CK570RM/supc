// Wait for DOM to load
document.addEventListener('DOMContentLoaded', function() {
    console.log('Admin payments page loaded');
    
    // Check authentication - direct localStorage check
    let user = null;
    try {
        const userStr = localStorage.getItem('user');
        console.log('Admin payments - User from localStorage:', userStr);
        
        if (userStr) {
            user = JSON.parse(userStr);
            console.log('Admin payments - Parsed user:', user);
        }
    } catch (error) {
        console.error('Error parsing user:', error);
    }
    
    if (!user || user.role !== 'admin') {
        console.log('Not admin, redirecting to login');
        window.location.href = '/login.html';
        return;
    }
    
    const applyFilterBtn = document.getElementById('applyFilterBtn');
    if (applyFilterBtn) {
        applyFilterBtn.addEventListener('click', loadPayments);
    }

    const submitFeedbackBtn = document.getElementById('submitFeedbackBtn');
    if (submitFeedbackBtn) {
        submitFeedbackBtn.addEventListener('click', window.submitFeedback);
    }

    const closeFeedbackModalBtn = document.getElementById('closeFeedbackModalBtn');
    if (closeFeedbackModalBtn) {
        closeFeedbackModalBtn.addEventListener('click', window.closeFeedbackModal);
    }

    // Load payments
    loadPayments();
});

let currentPaymentId = null;

async function loadPayments() {
    const statusFilter = document.getElementById('statusFilter');
    const status = statusFilter ? statusFilter.value : '';
    let url = '/api/admin/payments';
    if (status) {
        url += `?status=${status}`;
    }
    
    console.log('Loading payments from URL:', url);
    
    const container = document.getElementById('paymentsList');
    if (!container) {
        console.error('paymentsList element not found');
        return;
    }
    
    container.innerHTML = '<p>Loading payments...</p>';
    
    try {
        const response = await fetch(url);
        console.log('Payments API response status:', response.status);
        
        if (!response.ok) {
            throw new Error(`Failed to load payments: ${response.status}`);
        }
        
        const payments = await response.json();
        console.log('Payments loaded:', payments);
        console.log('Number of payments:', payments.length);
        
        if (payments.length === 0) {
            container.innerHTML = '<p>No payments found. When users submit payments, they will appear here.</p>';
            return;
        }
        
        container.innerHTML = `
            <div class="payment-grid">
                ${payments.map(payment => `
                    <div class="payment-card">
                        <div class="status-badge status-${payment.status}">
                            ${payment.status ? payment.status.toUpperCase() : 'PENDING'}
                        </div>
                        <h3>${payment.name || 'Unknown User'}</h3>
                        <p><strong>Student ID:</strong> ${payment.student_id || 'N/A'}</p>
                        <p><strong>Phone:</strong> ${payment.phone || 'N/A'}</p>
                        <p><strong>Email:</strong> ${payment.email || 'N/A'}</p>
                        <p><strong>Method:</strong> ${payment.payment_method ? payment.payment_method.toUpperCase() : 'N/A'}</p>
                        <p><strong>Account:</strong> ${payment.account_number || 'N/A'}</p>
                        <p><strong>Transaction ID:</strong> ${payment.transaction_id || 'N/A'}</p>
                        <p><strong>Events:</strong> ${payment.event_names || 'N/A'}</p>
                        <p><strong>Amount:</strong> ৳${payment.total_amount || 0}</p>
                        <p><strong>Date:</strong> ${payment.payment_date ? new Date(payment.payment_date).toLocaleString() : 'N/A'}</p>
                        ${payment.admin_feedback ? `<p><strong>Feedback:</strong> ${payment.admin_feedback}</p>` : ''}
                        
                        ${payment.status === 'pending' ? `
                            <div style="margin-top: 15px;">
                                <button onclick="acceptPayment(${payment.payment_id})" class="btn btn-success" style="margin-right: 10px;">Accept</button>
                                <button onclick="showFeedbackModal(${payment.payment_id})" class="btn btn-warning">Reject with Feedback</button>
                            </div>
                        ` : ''}
                    </div>
                `).join('')}
            </div>
        `;
    } catch (error) {
        console.error('Error loading payments:', error);
        container.innerHTML = '<p style="color: red;">Error loading payments: ' + error.message + '</p>';
    }
}

// Make functions global
window.acceptPayment = async function(paymentId) {
    console.log('Accepting payment:', paymentId);
    
    if (!confirm('Are you sure you want to accept this payment? This will register the user for the selected events.')) {
        return;
    }
    
    try {
        const response = await fetch(`/api/admin/payments/${paymentId}/verify`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: 'confirmed' })
        });
        
        const data = await response.json();
        console.log('Accept payment response:', data);
        
        if (response.ok) {
            alert('Payment accepted successfully!');
            loadPayments();
        } else {
            alert(data.error || 'Failed to accept payment');
        }
    } catch (error) {
        console.error('Error accepting payment:', error);
        alert('An error occurred. Please try again.');
    }
}

window.showFeedbackModal = function(paymentId) {
    console.log('Showing feedback modal for payment:', paymentId);
    currentPaymentId = paymentId;
    const modal = document.getElementById('feedbackModal');
    if (modal) {
        modal.style.display = 'block';
    }
    const feedbackText = document.getElementById('feedbackText');
    if (feedbackText) {
        feedbackText.value = '';
    }
}

window.submitFeedback = async function() {
    const feedback = document.getElementById('feedbackText').value;
    
    if (!feedback) {
        alert('Please provide feedback for the rejection.');
        return;
    }
    
    try {
        const response = await fetch(`/api/admin/payments/${currentPaymentId}/verify`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                status: 'error',
                feedback: feedback
            })
        });
        
        const data = await response.json();
        console.log('Reject payment response:', data);
        
        if (response.ok) {
            alert('Payment rejected with feedback.');
            window.closeFeedbackModal();
            loadPayments();
        } else {
            alert(data.error || 'Failed to reject payment');
        }
    } catch (error) {
        console.error('Error rejecting payment:', error);
        alert('An error occurred. Please try again.');
    }
}

window.closeFeedbackModal = function() {
    const modal = document.getElementById('feedbackModal');
    if (modal) {
        modal.style.display = 'none';
    }
    currentPaymentId = null;
}
