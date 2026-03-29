// Wait for DOM to load
document.addEventListener('DOMContentLoaded', function() {
    console.log('Admin dashboard page loaded');
    
    // Check authentication - direct localStorage check
    let user = null;
    try {
        const userStr = localStorage.getItem('user');
        console.log('Admin dashboard - User from localStorage:', userStr);
        
        if (userStr) {
            user = JSON.parse(userStr);
            console.log('Admin dashboard - Parsed user:', user);
        }
    } catch (error) {
        console.error('Error parsing user:', error);
    }
    
    if (!user || user.role !== 'admin') {
        console.log('Not admin, redirecting to login');
        window.location.href = '/login.html';
        return;
    }
    
    // Load dashboard stats
    loadDashboardStats();
});

async function loadDashboardStats() {
    console.log('Loading dashboard stats...');
    
    try {
        const response = await fetch('/api/admin/dashboard/stats');
        console.log('Dashboard stats response status:', response.status);
        
        if (!response.ok) {
            throw new Error('Failed to load stats');
        }
        
        const stats = await response.json();
        console.log('Dashboard stats:', stats);
        
        const totalUsersEl = document.getElementById('totalUsers');
        const totalPaymentsEl = document.getElementById('totalPayments');
        const totalRevenueEl = document.getElementById('totalRevenue');
        const pendingPaymentsEl = document.getElementById('pendingPayments');
        
        if (totalUsersEl) totalUsersEl.textContent = stats.totalUsers || 0;
        if (totalPaymentsEl) totalPaymentsEl.textContent = stats.totalPayments || 0;
        if (totalRevenueEl) totalRevenueEl.textContent = `৳${stats.totalAmount || 0}`;
        if (pendingPaymentsEl) pendingPaymentsEl.textContent = stats.pendingPayments || 0;
        
        // Display event stats
        const eventStatsContainer = document.getElementById('eventStats');
        if (eventStatsContainer) {
            if (stats.eventStats && stats.eventStats.length > 0) {
                eventStatsContainer.innerHTML = `
                    <table style="width: 100%; border-collapse: collapse;">
                        <thead>
                            <tr style="background-color: #f3f4f6;">
                                <th style="padding: 10px; text-align: left;">Event Name</th>
                                <th style="padding: 10px; text-align: center;">Registrations</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${stats.eventStats.map(event => `
                                <tr>
                                    <td style="padding: 10px; border-top: 1px solid #ddd;">${event.event_name}</td>
                                    <td style="padding: 10px; border-top: 1px solid #ddd; text-align: center;">${event.registrations}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                `;
            } else {
                eventStatsContainer.innerHTML = '<p>No events found.</p>';
            }
        }
    } catch (error) {
        console.error('Error loading dashboard stats:', error);
        const eventStatsContainer = document.getElementById('eventStats');
        if (eventStatsContainer) {
            eventStatsContainer.innerHTML = '<p style="color: red;">Error loading statistics. Please try again.</p>';
        }
    }
}