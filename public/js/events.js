// Wait for DOM to load
document.addEventListener('DOMContentLoaded', function() {
    console.log('Events page loaded');
    
    // Check authentication
    const user = window.requireAuth();
    console.log('Events page - User:', user);
    
    if (!user) {
        console.log('No user found, redirecting to login');
        window.location.href = '/login.html';
        return;
    }
    
    // Load cart from localStorage
    loadCart();
    
    // Load events
    loadEvents();
    
    // Setup proceed button
    const proceedBtn = document.getElementById('proceedPayment');
    if (proceedBtn) {
        proceedBtn.addEventListener('click', proceedToPayment);
    }
});

let cart = [];
let events = [];

function loadCart() {
    const savedCart = localStorage.getItem('cart');
    if (savedCart) {
        try {
            cart = JSON.parse(savedCart);
            console.log('Cart loaded:', cart);
        } catch (e) {
            console.error('Error parsing cart:', e);
            cart = [];
        }
    }
    updateCartDisplay();
}

function saveCart() {
    localStorage.setItem('cart', JSON.stringify(cart));
    console.log('Cart saved:', cart);
}

async function loadEvents() {
    console.log('Loading events...');
    const container = document.getElementById('eventsList');
    
    if (!container) {
        console.error('eventsList element not found');
        return;
    }
    
    container.innerHTML = '<p>Loading events...</p>';
    
    try {
        const response = await fetch('/api/events');
        console.log('Events API response status:', response.status);
        
        if (!response.ok) {
            throw new Error(`Failed to load events: ${response.status}`);
        }
        
        events = await response.json();
        console.log('Events loaded:', events);
        
        if (events.length === 0) {
            container.innerHTML = '<p>No events available at the moment. Please check back later.</p>';
            return;
        }
        
        displayEvents(events);
    } catch (error) {
        console.error('Error loading events:', error);
        container.innerHTML = '<p style="color: red;">Error loading events. Please try again later.</p>';
    }
}

function displayEvents(eventsList) {
    const container = document.getElementById('eventsList');
    
    container.innerHTML = `
        <div class="event-grid">
            ${eventsList.map(event => `
                <div class="event-card">
                    <h3>${escapeHtml(event.event_name)}</h3>
                    <p><strong>Date:</strong> ${event.event_date}</p>
                    <p><strong>Time:</strong> ${event.event_time}</p>
                    <p><strong>Price:</strong> ৳${event.event_price}</p>
                    <p>${escapeHtml(event.event_description || 'No description available')}</p>
                    <button onclick="toggleCart(${event.event_id})" class="btn ${isInCart(event.event_id) ? 'btn-danger' : 'btn-primary'}" id="cartBtn${event.event_id}">
                        ${isInCart(event.event_id) ? 'Remove from Cart' : 'Add to Cart'}
                    </button>
                </div>
            `).join('')}
        </div>
    `;
}

// Helper function to prevent XSS
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function isInCart(eventId) {
    return cart.some(item => item.event_id === eventId);
}

window.toggleCart = function(eventId) {
    const event = events.find(e => e.event_id === eventId);
    
    if (!event) {
        console.error('Event not found:', eventId);
        return;
    }
    
    if (isInCart(eventId)) {
        cart = cart.filter(item => item.event_id !== eventId);
        console.log('Removed from cart:', event.event_name);
    } else {
        cart.push(event);
        console.log('Added to cart:', event.event_name);
    }
    
    saveCart();
    updateCartDisplay();
    
    // Update button text
    const btn = document.getElementById(`cartBtn${eventId}`);
    if (btn) {
        btn.textContent = isInCart(eventId) ? 'Remove from Cart' : 'Add to Cart';
        btn.className = `btn ${isInCart(eventId) ? 'btn-danger' : 'btn-primary'}`;
    }
};

function updateCartDisplay() {
    const cartContainer = document.getElementById('cartItems');
    const totalSpan = document.getElementById('totalAmount');
    
    if (!cartContainer || !totalSpan) return;
    
    if (cart.length === 0) {
        cartContainer.innerHTML = '<p>No items selected</p>';
        totalSpan.textContent = '0';
        return;
    }
    
    cartContainer.innerHTML = `
        ${cart.map(item => `
            <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                <span>${escapeHtml(item.event_name)}</span>
                <span>৳${item.event_price}</span>
            </div>
        `).join('')}
    `;
    
    const total = cart.reduce((sum, item) => sum + parseFloat(item.event_price), 0);
    totalSpan.textContent = total;
}

function proceedToPayment() {
    console.log('=== PROCEED TO PAYMENT STARTED ===');
    console.log('Current cart:', cart);
    
    if (cart.length === 0) {
        alert('Please select at least one event to proceed.');
        return;
    }
    
    // Get user from localStorage
    const userStr = localStorage.getItem('user');
    console.log('User string from localStorage:', userStr);
    
    if (!userStr) {
        console.log('No user found in localStorage');
        alert('Please login again to continue.');
        window.location.href = '/login.html';
        return;
    }
    
    let user;
    try {
        user = JSON.parse(userStr);
        console.log('Parsed user:', user);
        
        if (!user.user_id && !user.id) {
            throw new Error('Invalid user object');
        }
    } catch (error) {
        console.error('Error parsing user:', error);
        alert('Session error. Please login again.');
        localStorage.removeItem('user');
        window.location.href = '/login.html';
        return;
    }
    
    // Prepare data for payment
    const eventIds = cart.map(item => item.event_id);
    const totalAmount = cart.reduce((sum, item) => sum + parseFloat(item.event_price), 0);
    
    console.log('Preparing to save:', {
        selectedEvents: eventIds,
        totalAmount: totalAmount,
        user: user
    });
    
    // Clear any existing payment data first
    localStorage.removeItem('selectedEvents');
    localStorage.removeItem('totalAmount');
    
    // Save new data
    try {
        localStorage.setItem('selectedEvents', JSON.stringify(eventIds));
        localStorage.setItem('totalAmount', totalAmount);
        // Make sure user data is preserved
        localStorage.setItem('user', JSON.stringify(user));
        
        // Verify data was saved
        const verifyUser = localStorage.getItem('user');
        const verifyEvents = localStorage.getItem('selectedEvents');
        const verifyTotal = localStorage.getItem('totalAmount');
        
        console.log('Verification - User saved:', !!verifyUser);
        console.log('Verification - Events saved:', !!verifyEvents);
        console.log('Verification - Total saved:', !!verifyTotal);
        
        if (!verifyUser || !verifyEvents || !verifyTotal) {
            throw new Error('Failed to save data to localStorage');
        }
        
        // Small delay to ensure data is written
        setTimeout(() => {
            console.log('Navigating to payment page...');
            window.location.href = '/payment.html';
        }, 100);
        
    } catch (error) {
        console.error('Error saving to localStorage:', error);
        alert('An error occurred. Please try again.');
    }
}