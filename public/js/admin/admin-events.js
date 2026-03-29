// Wait for DOM to load
document.addEventListener('DOMContentLoaded', function() {
    console.log('Admin events page loaded');
    
    // Check authentication - direct localStorage check
    let user = null;
    try {
        const userStr = localStorage.getItem('user');
        console.log('Admin events - User from localStorage:', userStr);
        
        if (userStr) {
            user = JSON.parse(userStr);
            console.log('Admin events - Parsed user:', user);
        }
    } catch (error) {
        console.error('Error parsing user:', error);
    }
    
    if (!user || user.role !== 'admin') {
        console.log('Not admin, redirecting to login');
        window.location.href = '/login.html';
        return;
    }
    
    // Load existing events
    loadEvents();
    
    // Setup event form
    const createEventForm = document.getElementById('createEventForm');
    if (createEventForm) {
        createEventForm.addEventListener('submit', createEvent);
    }
});

async function loadEvents() {
    console.log('Loading events...');
    
    const container = document.getElementById('eventsList');
    if (!container) return;
    
    container.innerHTML = '<p>Loading events...</p>';
    
    try {
        const response = await fetch('/api/admin/events');
        
        if (!response.ok) {
            throw new Error('Failed to load events');
        }
        
        const events = await response.json();
        console.log('Events loaded:', events);
        
        if (events.length === 0) {
            container.innerHTML = '<p>No events found. Create your first event above!</p>';
            return;
        }
        
        container.innerHTML = `
            <table style="width: 100%; border-collapse: collapse;">
                <thead>
                    <tr style="background-color: #f3f4f6;">
                        <th style="padding: 10px; text-align: left;">ID</th>
                        <th style="padding: 10px; text-align: left;">Event Name</th>
                        <th style="padding: 10px; text-align: left;">Price</th>
                        <th style="padding: 10px; text-align: left;">Date</th>
                        <th style="padding: 10px; text-align: left;">Time</th>
                        <th style="padding: 10px; text-align: center;">Actions</th>
                    </tr>
                </thead>
                <tbody>
                    ${events.map(event => `
                        <tr>
                            <td style="padding: 10px; border-top: 1px solid #ddd;">${event.event_id}</td>
                            <td style="padding: 10px; border-top: 1px solid #ddd;">${event.event_name}</td>
                            <td style="padding: 10px; border-top: 1px solid #ddd;">৳${event.event_price}</td>
                            <td style="padding: 10px; border-top: 1px solid #ddd;">${event.event_date}</td>
                            <td style="padding: 10px; border-top: 1px solid #ddd;">${event.event_time}</td>
                            <td style="padding: 10px; border-top: 1px solid #ddd; text-align: center;">
                                <button onclick="editEvent(${event.event_id})" class="btn btn-primary" style="padding: 5px 10px; margin-right: 5px; font-size: 12px;">Edit</button>
                                <button onclick="deleteEvent(${event.event_id})" class="btn btn-danger" style="padding: 5px 10px; font-size: 12px;">Delete</button>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
    } catch (error) {
        console.error('Error loading events:', error);
        container.innerHTML = '<p style="color: red;">Error loading events. Please try again.</p>';
    }
}

// Create event
async function createEvent(e) {
    e.preventDefault();
    
    const eventData = {
        event_name: document.getElementById('event_name').value,
        event_price: parseFloat(document.getElementById('event_price').value),
        event_date: document.getElementById('event_date').value,
        event_time: document.getElementById('event_time').value,
        event_description: document.getElementById('event_description').value || ''
    };
    
    console.log('Creating event:', eventData);
    
    try {
        const response = await fetch('/api/admin/events', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(eventData)
        });
        
        const data = await response.json();
        console.log('Create event response:', data);
        
        if (response.ok) {
            alert('Event created successfully!');
            document.getElementById('createEventForm').reset();
            loadEvents();
        } else {
            alert(data.error || 'Failed to create event');
        }
    } catch (error) {
        console.error('Error creating event:', error);
        alert('An error occurred. Please try again.');
    }
}

// Make functions global
window.editEvent = async function(eventId) {
    try {
        const response = await fetch(`/api/events/${eventId}`);
        const event = await response.json();
        
        const newName = prompt('Enter new event name:', event.event_name);
        if (!newName) return;
        
        const newPrice = prompt('Enter new event price:', event.event_price);
        if (!newPrice) return;
        
        const newDate = prompt('Enter new event date (YYYY-MM-DD):', event.event_date);
        if (!newDate) return;
        
        const newTime = prompt('Enter new event time (HH:MM):', event.event_time);
        if (!newTime) return;
        
        const updateData = {
            event_name: newName,
            event_price: parseFloat(newPrice),
            event_date: newDate,
            event_time: newTime,
            event_description: event.event_description
        };
        
        const updateResponse = await fetch(`/api/admin/events/${eventId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updateData)
        });
        
        const data = await updateResponse.json();
        
        if (updateResponse.ok) {
            alert('Event updated successfully!');
            loadEvents();
        } else {
            alert(data.error || 'Failed to update event');
        }
    } catch (error) {
        console.error('Error updating event:', error);
        alert('An error occurred. Please try again.');
    }
}

window.deleteEvent = async function(eventId) {
    if (!confirm('Are you sure you want to delete this event? This action cannot be undone.')) {
        return;
    }
    
    try {
        const response = await fetch(`/api/admin/events/${eventId}`, {
            method: 'DELETE'
        });
        
        const data = await response.json();
        
        if (response.ok) {
            alert('Event deleted successfully!');
            loadEvents();
        } else {
            alert(data.error || 'Failed to delete event');
        }
    } catch (error) {
        console.error('Error deleting event:', error);
        alert('An error occurred. Please try again.');
    }
}