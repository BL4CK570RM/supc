// Wait for DOM to load
document.addEventListener('DOMContentLoaded', function() {
    console.log('Dashboard page loaded');
    
    // Check authentication
    const user = window.requireAuth();
    console.log('Dashboard - User from requireAuth:', user);
    
    if (!user) {
        console.log('No user found, redirecting to login');
        window.location.href = '/login.html';
        return;
    }
    
    // Display user info
    displayUserInfo(user);
    
    // Load registered events
    loadRegisteredEvents(user.user_id);
});

function displayUserInfo(user) {
    console.log('Displaying user info:', user);
    
    const userNameElement = document.getElementById('userName');
    const studentIdElement = document.getElementById('studentId');
    const departmentElement = document.getElementById('department');
    const userEmailElement = document.getElementById('userEmail');
    const userPhoneElement = document.getElementById('userPhone');
    
    if (userNameElement) {
        userNameElement.textContent = user.name || 'N/A';
        console.log('Set userName to:', user.name);
    }
    
    if (studentIdElement) {
        studentIdElement.textContent = user.student_id || 'N/A';
        console.log('Set studentId to:', user.student_id);
    }
    
    if (departmentElement) {
        departmentElement.textContent = user.department || 'N/A';
        console.log('Set department to:', user.department);
    }
    
    if (userEmailElement) {
        userEmailElement.textContent = user.email || 'N/A';
        console.log('Set email to:', user.email);
    }
    
    if (userPhoneElement) {
        userPhoneElement.textContent = user.phone || 'N/A';
        console.log('Set phone to:', user.phone);
    }
}

async function loadRegisteredEvents(userId) {
    console.log('Loading registered events for user ID:', userId);
    
    const container = document.getElementById('registeredEvents');
    if (!container) {
        console.error('registeredEvents element not found');
        return;
    }
    
    try {
        const response = await fetch(`/api/user/events/${userId}`);
        console.log('Events response status:', response.status);
        
        if (!response.ok) {
            throw new Error(`Failed to load events: ${response.status}`);
        }
        
        const events = await response.json();
        console.log('Loaded events:', events);
        
        if (events.length === 0) {
            container.innerHTML = '<p>You haven\'t registered for any events yet. <a href="/events.html">Browse events</a></p>';
            return;
        }
        
        container.innerHTML = `
            <div class="event-grid">
                ${events.map(event => `
                    <div class="event-card">
                        <h3>${event.event_name}</h3>
                        <p><strong>Date:</strong> ${event.event_date}</p>
                        <p><strong>Time:</strong> ${event.event_time}</p>
                        <p><strong>Price:</strong> ৳${event.event_price}</p>
                        <small>Registered on: ${new Date(event.registration_date).toLocaleDateString()}</small>
                    </div>
                `).join('')}
            </div>
        `;
    } catch (error) {
        console.error('Error loading registered events:', error);
        container.innerHTML = '<p style="color: red;">Error loading events. Please try again later.</p>';
    }
}