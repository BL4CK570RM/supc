document.addEventListener('DOMContentLoaded', function() {
    console.log('History page loaded');
    
    let user = null;
    try {
        const userStr = localStorage.getItem('user');
        if (userStr) {
            user = JSON.parse(userStr);
        }
    } catch (error) {
        console.error('Error parsing user:', error);
    }
    
    if (!user) {
        console.log('No user found, redirecting to login');
        window.location.href = '/login.html';
        return;
    }
    
    loadPaymentHistory(user.user_id);
});

let currentPage = 1;
let totalPages = 1;

async function loadPaymentHistory(userId, page = 1) {
    console.log(`Loading payment history for user ${userId}, page ${page}`);
    
    const container = document.getElementById('historyList');
    const paginationContainer = document.getElementById('pagination');
    
    if (!container) return;
    
    container.innerHTML = '<p>Loading payment history...</p>';
    
    try {
        const response = await fetch(`/api/user/payment-history/${userId}?page=${page}&limit=10`);
        
        if (!response.ok) {
            throw new Error(`Failed to load history: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('Payment history data:', data);
        
        totalPages = data.pagination.totalPages;
        currentPage = page;
        
        displayPayments(data.payments);
        displayPagination();
        
    } catch (error) {
        console.error('Error loading payment history:', error);
        container.innerHTML = '<p style="color: red;">Error loading payment history. Please try again later.</p>';
    }
}

function displayPayments(payments) {
    const container = document.getElementById('historyList');
    
    if (!container) return;
    
    if (payments.length === 0) {
        container.innerHTML = '<p>No payment records found. <a href="/events.html">Browse events</a> to make a payment.</p>';
        return;
    }
    
    container.innerHTML = `
        <div class="payment-grid">
            ${payments.map((payment, index) => `
                <div class="payment-card">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                        <span class="status-badge status-${payment.status}">
                            ${payment.status === 'pending' ? 'PENDING' : payment.status === 'confirmed' ? 'CONFIRMED' : 'ERROR'}
                        </span>
                        <span style="font-size: 14px; color: #666;">#${(currentPage-1)*10 + index + 1}</span>
                    </div>
                    <p><strong>📱 Method:</strong> ${payment.payment_method ? payment.payment_method.toUpperCase() : 'N/A'}</p>
                    <p><strong>🆔 Transaction ID:</strong> ${payment.transaction_id || 'N/A'}</p>
                    <p><strong>🎯 Events:</strong> ${payment.event_names || 'N/A'}</p>
                    <p><strong>💰 Amount:</strong> ৳${payment.total_amount || 0}</p>
                    <p><strong>📅 Date:</strong> ${payment.payment_date ? new Date(payment.payment_date).toLocaleString() : 'N/A'}</p>
                    ${payment.admin_feedback ? `<p><strong>Feedback:</strong> ${payment.admin_feedback}</p>` : ''}
                    ${payment.status === 'pending' ? '<p style="color: #d97706; margin-top: 10px;"><small>Your payment is pending admin verification. You will be notified once confirmed.</small></p>' : ''}
                    ${payment.status === 'confirmed' ? '<p style="color: #059669; margin-top: 10px;"><small>Your payment has been confirmed! You are registered for the events.</small></p>' : ''}
                    ${payment.status === 'error' ? '<p style="color: #dc2626; margin-top: 10px;"><small>Your payment was not accepted. Please contact admin for details.</small></p>' : ''}
                </div>
            `).join('')}
        </div>
    `;
}

function displayPagination() {
    const container = document.getElementById('pagination');
    
    if (!container) return;
    
    if (totalPages <= 1) {
        container.innerHTML = '';
        return;
    }
    
    container.innerHTML = `
        <button onclick="previousPage()" ${currentPage === 1 ? 'disabled' : ''}>← Previous</button>
        <span>Page ${currentPage} of ${totalPages}</span>
        <button onclick="nextPage()" ${currentPage === totalPages ? 'disabled' : ''}>Next →</button>
    `;
}

function previousPage() {
    if (currentPage > 1) {
        let user = null;
        try {
            const userStr = localStorage.getItem('user');
            if (userStr) {
                user = JSON.parse(userStr);
            }
        } catch (error) {
            console.error('Error parsing user:', error);
        }
        if (user) {
            loadPaymentHistory(user.user_id, currentPage - 1);
        }
    }
}

function nextPage() {
    if (currentPage < totalPages) {
        let user = null;
        try {
            const userStr = localStorage.getItem('user');
            if (userStr) {
                user = JSON.parse(userStr);
            }
        } catch (error) {
            console.error('Error parsing user:', error);
        }
        if (user) {
            loadPaymentHistory(user.user_id, currentPage + 1);
        }
    }
}