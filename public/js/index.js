        // Check if user is logged in
        function checkLoginStatus() {
            try {
                const user = localStorage.getItem('user');
                if (user) {
                    const userData = JSON.parse(user);
                    return { isLoggedIn: true, user: userData };
                }
            } catch (e) {
                console.error('Error checking login status:', e);
            }
            return { isLoggedIn: false, user: null };
        }

        // Update UI based on login status
        function updateUI() {
            const { isLoggedIn, user } = checkLoginStatus();
            const navLinks = document.getElementById('navLinks');
            const ctaButtons = document.getElementById('ctaButtons');
            
            if (isLoggedIn && user) {
                // Logged in user - show dashboard links
                if (navLinks) {
                    if (user.role === 'admin') {
                        navLinks.innerHTML = `
                            <li><a href="/admin/dashboard.html">Admin Dashboard</a></li>
                            <li><a href="/dashboard.html">My Dashboard</a></li>
                            <li><a href="/events.html">Events</a></li>
                            <li><a href="/history.html">Payment History</a></li>
                            <li><a href="#" id="logoutLink">Logout</a></li>
                        `;
                    } else {
                        navLinks.innerHTML = `
                            <li><a href="/dashboard.html">Dashboard</a></li>
                            <li><a href="/events.html">Events</a></li>
                            <li><a href="/history.html">Payment History</a></li>
                            <li><a href="#" id="logoutLink">Logout</a></li>
                        `;
                    }
                }
                
                // CTA buttons for logged in users
                if (ctaButtons) {
                    ctaButtons.innerHTML = `
                        <a href="/events.html" class="btn btn-primary">Browse Events</a>
                        <a href="/dashboard.html" class="btn btn-outline">My Dashboard</a>
                    `;
                }
                
                // Add logout functionality
                const logoutLink = document.getElementById('logoutLink');
                if (logoutLink) {
                    logoutLink.addEventListener('click', (e) => {
                        e.preventDefault();
                        localStorage.removeItem('user');
                        localStorage.removeItem('cart');
                        localStorage.removeItem('selectedEvents');
                        localStorage.removeItem('totalAmount');
                        window.location.href = '/index.html';
                    });
                }
            } else {
                // Guest user - show login/signup links
                if (navLinks) {
                    navLinks.innerHTML = `
                        <li><a href="/index.html">Home</a></li>
                        <li><a href="/login.html">Login</a></li>
                        <li><a href="/signup.html">Signup</a></li>
                    `;
                }
                
                // CTA buttons for guests
                if (ctaButtons) {
                    ctaButtons.innerHTML = `
                        <a href="/signup.html" class="btn btn-primary">Get Started</a>
                        <a href="/login.html" class="btn btn-outline">Login</a>
                    `;
                }
            }
        }

        // Load club information
        async function loadClubInfo() {
            try {
                const response = await fetch('/api/content/club-info');
                const data = await response.json();
                document.getElementById('clubInfo').innerHTML = data.content || '<p>Welcome to Science Fest 2026!</p>';
            } catch (err) {
                console.error('Error loading club info:', err);
                document.getElementById('clubInfo').innerHTML = '<p>Welcome to Science Fest 2026! Join us for an exciting journey into science and technology.</p>';
            }
        }

        // Load events preview
        async function loadEventsPreview() {
            try {
                const response = await fetch('/api/events');
                const events = await response.json();
                const preview = document.getElementById('eventsPreview');
                
                if (events.length === 0) {
                    preview.innerHTML = '<p>No events available yet. Check back soon!</p>';
                    return;
                }
                
                const { isLoggedIn } = checkLoginStatus();
                
                preview.innerHTML = `
                    <div class="event-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 20px;">
                        ${events.slice(0, 3).map(event => `
                            <div class="event-card">
                                <h3>${event.event_name}</h3>
                                <p><strong>Date:</strong> ${event.event_date}</p>
                                <p><strong>Time:</strong> ${event.event_time}</p>
                                <p><strong>Price:</strong> ৳${event.event_price}</p>
                                <p>${event.event_description ? event.event_description.substring(0, 100) + '...' : ''}</p>
                                ${isLoggedIn ? 
                                    `<a href="/events.html" class="btn btn-primary" style="display: inline-block; margin-top: 10px;">Register Now</a>` : 
                                    `<a href="/login.html" class="btn btn-primary" style="display: inline-block; margin-top: 10px;">Login to Register</a>`
                                }
                            </div>
                        `).join('')}
                    </div>
                    ${events.length > 3 ? `<p style="text-align: center; margin-top: 20px;"><a href="/events.html">View all events →</a></p>` : ''}
                `;
            } catch (err) {
                console.error('Error loading events:', err);
                document.getElementById('eventsPreview').innerHTML = '<p>Unable to load events at this time.</p>';
            }
        }

        // Initialize page
        function init() {
            updateUI();
            loadClubInfo();
            loadEventsPreview();
        }

        // Run when page loads
        document.addEventListener('DOMContentLoaded', init);
