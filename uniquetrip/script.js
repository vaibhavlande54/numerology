// Dark/Light Mode Toggle with localStorage
const themeToggle = document.getElementById('theme-toggle');
const html = document.documentElement;
const navToggle = document.querySelector('.nav-toggle');
const navLinks = document.getElementById('nav-links');

// Simulated network delay for demo (set to 0 for instant)
const FAKE_SEARCH_DELAY_MS = 400;

// Helper: API fetch with timeout and abort support (global)
async function apiFetch(path, options = {}, timeoutMs = 10000) {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeoutMs);
    try {
        return await fetch(path, { ...options, signal: controller.signal });
    } finally {
        clearTimeout(id);
    }
}

// Check for saved theme preference or default to 'light'
const currentTheme = localStorage.getItem('theme') || 'light';
html.setAttribute('data-theme', currentTheme);
if (themeToggle) {
    themeToggle.textContent = currentTheme === 'dark' ? '☀️' : '🌙';
    themeToggle.setAttribute('aria-pressed', currentTheme === 'dark');
}

// Toggle theme on button click
if (themeToggle) {
    themeToggle.addEventListener('click', function () {
        const cur = html.getAttribute('data-theme');
        const next = cur === 'dark' ? 'light' : 'dark';
        html.setAttribute('data-theme', next);
        localStorage.setItem('theme', next);
        // Animate icon: fade out, change, then fade in with rotation
        themeToggle.style.transition = 'transform 0.4s cubic-bezier(0.4,0,0.2,1), opacity 0.2s';
        themeToggle.style.opacity = '0';
        themeToggle.style.transform = 'rotate(180deg) scale(1.2)';
        setTimeout(() => {
            themeToggle.textContent = next === 'dark' ? '☀️' : '🌙';
            themeToggle.setAttribute('aria-pressed', next === 'dark');
            themeToggle.style.opacity = '1';
            themeToggle.style.transform = 'rotate(0deg) scale(1)';
        }, 200);
    });
}

// Hamburger menu toggle for mobile
if (navToggle && navLinks) {
    navToggle.addEventListener('click', function () {
        const expanded = navToggle.getAttribute('aria-expanded') === 'true';
        navToggle.setAttribute('aria-expanded', (!expanded).toString());
        navLinks.classList.toggle('open');
    });
}

// Hero Search Form Functionality
const searchForm = document.querySelector('.search-form');
if (searchForm) {
    console.log('✅ Hero search form handler attached to:', searchForm);
    searchForm.addEventListener('submit', function (e) {
        e.preventDefault();

        const from = document.getElementById('from').value;
        const to = document.getElementById('to').value;
        const date = document.getElementById('date').value;

        console.log('🔍 Hero search triggered:', { from, to, date });

        const spinner = document.getElementById('spinner-overlay');

        if (from && to && date) {
            const button = searchForm.querySelector('button[type="submit"]');
            const originalText = button.innerHTML;
            button.innerHTML = '<span>🔍 Searching...</span>';
            button.disabled = true;
            if (spinner) spinner.style.display = 'flex';

            setTimeout(() => {
                // Render results after a small delay to simulate search
                displaySearchResults(from, to, date);
                button.innerHTML = originalText;
                button.disabled = false;
                if (spinner) spinner.style.display = 'none';
                // Smooth scroll to results
                const section = document.getElementById('search-results');
                if (section) {
                    section.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
            }, FAKE_SEARCH_DELAY_MS);
        } else {
            showNotification('⚠️ Please fill in all fields!', 'warning');
        }
    });
} else {
    console.log('⚠️ No .search-form found on this page');
}

// Display Search Results on Page
async function displaySearchResults(from, to, date) {
    const resultsSection = document.getElementById('search-results');
    const resultsContent = document.getElementById('results-content');
    if (!resultsSection || !resultsContent) return;

    try {
        // Call the backend API (relative path)
        const response = await apiFetch(`/api/flights/search?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}&date=${encodeURIComponent(date)}`);
        const data = await response.json();
        
        if (!data.success) {
            throw new Error(data.error || 'Failed to fetch flights');
        }

        const flightResults = data.flights || [];

        // Build results HTML
        let resultsHTML = `
            <div class="search-summary">
                <div class="summary-card">
                    <h3>✈️ Flight Search</h3>
                    <p><strong>From:</strong> ${from}</p>
                    <p><strong>To:</strong> ${to}</p>
                    <p><strong>Date:</strong> ${new Date(date).toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                    <p class="results-count">📊 Found ${flightResults.length} available flights</p>
                </div>
            </div>
        `;

        if (flightResults.length > 0) {
            resultsHTML += '<div class="flights-grid">';
            flightResults.forEach((flight) => {
                resultsHTML += `
                    <div class="flight-card">
                        <div class="flight-header">
                            <h4>✈️ ${flight.airline}</h4>
                            <span class="flight-number">${flight.flight}</span>
                        </div>
                        <div class="flight-details">
                            <div class="flight-time">
                                <div class="time-box">
                                    <span class="time">${flight.departure}</span>
                                    <span class="city">${from}</span>
                                </div>
                                <div class="flight-duration">
                                    <span class="duration">${flight.duration}</span>
                                    <div class="flight-line"><span class="plane-icon">✈️</span></div>
                                    <span class="stops">${flight.stops}</span>
                                </div>
                                <div class="time-box">
                                    <span class="time">${flight.arrival}</span>
                                    <span class="city">${to}</span>
                                </div>
                            </div>
                        </div>
                        <div class="flight-footer">
                            <div class="price-section">
                                <span class="price-label">Price per person</span>
                                <span class="price">₹${flight.price.toLocaleString('en-IN')}</span>
                            </div>
                            <button class="btn btn-primary book-flight" onclick="bookFlight(${flight.id}, '${flight.flight}', ${flight.price})">Book Now</button>
                        </div>
                    </div>`;
            });
            resultsHTML += '</div>';
            showNotification('✅ Search completed successfully!', 'success');
        } else {
            // No results UI with suggestions
            resultsHTML += `
                <div class="no-results-card">
                    <div class="no-results-icon">🕵️‍♂️</div>
                    <h3>No flights found</h3>
                    <p>We couldn't find flights for your search. Try these popular routes:</p>
                    <div class="suggestions">
                        <button class="btn" onclick="quickSearchPreset('Mumbai','Delhi',1)">Mumbai → Delhi</button>
                        <button class="btn" onclick="quickSearchPreset('Delhi','Goa',2)">Delhi → Goa</button>
                        <button class="btn" onclick="quickSearchPreset('Mumbai','Goa',3)">Mumbai → Goa</button>
                        <button class="btn" onclick="quickSearchPreset('Bengaluru','Delhi',4)">Bengaluru → Delhi</button>
                    </div>
                    <ul class="tips">
                        <li>Check spellings of cities</li>
                        <li>Try nearby airports</li>
                        <li>Select a different date</li>
                    </ul>
                </div>`;
            showNotification('ℹ️ No flights found. Showing suggestions.', 'info');
        }

        resultsContent.innerHTML = resultsHTML;
        resultsSection.style.display = 'block';
    } catch (error) {
        console.error('Error fetching flights:', error);
        showNotification('❌ Error searching flights. Please try again.', 'warning');
        
        // Show error UI
        resultsContent.innerHTML = `
            <div class="no-results-card">
                <div class="no-results-icon">⚠️</div>
                <h3>Connection Error</h3>
                <p>Unable to connect to the server. Please make sure the backend is running.</p>
                <button class="btn btn-primary" onclick="location.reload()">Retry</button>
            </div>`;
        resultsSection.style.display = 'block';
    }
}

// Prefill form and rerun search
function quickSearchPreset(from, to, addDays = 1) {
    const fromEl = document.getElementById('from');
    const toEl = document.getElementById('to');
    const dateEl = document.getElementById('date');
    if (!fromEl || !toEl || !dateEl) return;
    fromEl.value = from;
    toEl.value = to;
    const d = new Date();
    d.setDate(d.getDate() + addDays);
    dateEl.valueAsDate = d;
    document.querySelector('.search-form').dispatchEvent(new Event('submit', { bubbles: true }));
}

// Book Flight Function
async function bookFlight(flightId, flightNumber, price) {
    console.log('🎫 bookFlight function called with:', { flightId, flightNumber, price });
    
    // Redirect to dedicated booking page with flight details
    window.location.href = `booking.html?flightId=${flightId}&flightNumber=${encodeURIComponent(flightNumber)}&price=${price}`;
}

// Start service booking on details page (generic for holidays/hotels/etc.)
function startServiceBooking(service, id, name, price) {
    try {
        const params = new URLSearchParams({
            serviceType: service,
            id: String(id),
            name: name,
            price: String(price)
        });
        window.location.href = `booking.html?${params.toString()}`;
    } catch (e) {
        console.error('Redirect error:', e);
        showNotification('Unable to open booking details. Please try again.', 'warning');
    }
}

// Old function removed - now using modal
async function bookFlightOld(flightId, flightNumber, price) {
    const passengerName = prompt('Enter passenger name:');
    const passengerEmail = prompt('Enter email address:');
    if (!passengerName || !passengerEmail) {
        showNotification('❌ Booking cancelled', 'warning');
        return;
    }
    try {
        const response = await apiFetch('/api/bookings', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                flightId: flightId,
                passengerName: passengerName,
                passengerEmail: passengerEmail,
                numPassengers: 1
            })
        });
        const data = await response.json();
        if (data.success) {
            showNotification(`🎉 Flight ${flightNumber} booked successfully! Booking Ref: ${data.booking.bookingReference}`, 'success');
            console.log('Booking details:', data.booking);
        } else {
            showNotification(`❌ Booking failed: ${data.error}`, 'warning');
        }
    } catch (error) {
        console.error('Booking error:', error);
        showNotification('❌ Error creating booking. Please try again.', 'warning');
    }
}

// View Details Buttons Functionality
document.addEventListener('DOMContentLoaded', function () {
    const viewDetailsButtons = document.querySelectorAll('.card .btn');
    viewDetailsButtons.forEach((button) => {
        button.addEventListener('click', function () {
            const card = this.closest('.card');
            const packageName = card.querySelector('h3')?.textContent || 'Package';
            const packageDetails = card.querySelector('p')?.textContent || '';
            showPackageModal(packageName, packageDetails);
        });
    });
});

// Package Details Modal
function showPackageModal(packageName, details) {
    const modalOverlay = document.createElement('div');
    modalOverlay.className = 'package-modal-overlay';
    modalOverlay.innerHTML = `
        <div class="package-modal">
            <button class="package-modal-close" aria-label="Close">&times;</button>
            <h2>${packageName}</h2>
            <p class="package-details">${details}</p>
            <div class="package-info">
                <h3>📦 Package Includes:</h3>
                <ul>
                    <li>✈️ Round-trip flights</li>
                    <li>🏨 Accommodation with breakfast</li>
                    <li>🚗 Airport transfers</li>
                    <li>🗺️ Guided tours</li>
                    <li>📸 Travel insurance</li>
                </ul>
                <h3>📞 Contact Information:</h3>
                <p>📧 Email: bookings@uniquetrip.com</p>
                <p>📱 Phone: +91 98765 43210</p>
            </div>
            <div class="modal-actions">
                <button class="btn btn-primary" onclick="bookPackage('${packageName}')">Book Now</button>
                <button class="btn btn-secondary" onclick="sendInquiry('${packageName}')">Send Inquiry</button>
            </div>
        </div>`;
    document.body.appendChild(modalOverlay);
    const closeBtn = modalOverlay.querySelector('.package-modal-close');
    closeBtn.addEventListener('click', () => modalOverlay.remove());
    modalOverlay.addEventListener('click', (e) => {
        if (e.target === modalOverlay) modalOverlay.remove();
    });
    document.addEventListener('keydown', function escHandler(e) {
        if (e.key === 'Escape') {
            modalOverlay.remove();
            document.removeEventListener('keydown', escHandler);
        }
    });
}

// Book/Inquiry actions for package modal
async function bookPackage(packageName) {
    document.querySelector('.package-modal-overlay')?.remove();
    showNotification(`🎉 Booking ${packageName}! Redirecting to checkout...`, 'success');
    // In production, redirect to booking page or show booking form
}

async function sendInquiry(packageName) {
    const name = prompt('Enter your name:');
    const email = prompt('Enter your email:');
    
    if (!name || !email) {
        showNotification('❌ Inquiry cancelled', 'warning');
        return;
    }
    
    try {
        const response = await apiFetch('/api/inquiries', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                packageName,
                name,
                email,
                message: `Interested in ${packageName}`
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            showNotification(`📧 Inquiry sent for ${packageName}! We'll contact you soon.`, 'success');
        } else {
            showNotification(`❌ ${data.error}`, 'warning');
        }
    } catch (error) {
        console.error('Inquiry error:', error);
        showNotification('❌ Failed to send inquiry. Please try again.', 'warning');
    } finally {
        document.querySelector('.package-modal-overlay')?.remove();
    }
}

// Newsletter Form Functionality
const newsletterForm = document.querySelector('.newsletter-form');
if (newsletterForm) {
    newsletterForm.addEventListener('submit', async function (e) {
        e.preventDefault();
        const emailInput = document.getElementById('newsletter-email');
        const email = emailInput.value;
        if (email) {
            const button = this.querySelector('button[type="submit"]');
            const originalText = button.innerHTML;
            button.innerHTML = '📧 Subscribing...';
            button.disabled = true;
            
            try {
                const response = await apiFetch('/api/newsletter', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ email })
                });
                
                const data = await response.json();
                
                if (data.success) {
                    showNotification(`🎉 Subscribed! Confirmation sent to ${email}`, 'success');
                    emailInput.value = '';
                } else {
                    showNotification(`❌ ${data.error}`, 'warning');
                }
            } catch (error) {
                console.error('Newsletter error:', error);
                showNotification('❌ Subscription failed. Please try again.', 'warning');
            } finally {
                button.innerHTML = originalText;
                button.disabled = false;
            }
        }
    });
}

// Clear Results button
document.addEventListener('DOMContentLoaded', function () {
    const clearBtn = document.getElementById('clear-results');
    if (clearBtn) {
        clearBtn.addEventListener('click', function () {
            const resultsSection = document.getElementById('search-results');
            const resultsContent = document.getElementById('results-content');
            if (resultsContent) resultsContent.innerHTML = '';
            if (resultsSection) resultsSection.style.display = 'none';
            const form = document.querySelector('.search-form');
            form && form.reset();
            showNotification('Results cleared', 'success');
        });
    }
});

// Smooth scroll for anchor links
document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
});

// Card hover effect
document.querySelectorAll('.card').forEach((card) => {
    card.addEventListener('mouseenter', function () {
        this.style.transform = 'translateY(-8px) scale(1.02)';
    });
    card.addEventListener('mouseleave', function () {
        this.style.transform = 'translateY(0) scale(1)';
    });
});

// Notification Toast
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.setAttribute('role', type === 'warning' ? 'alert' : 'status');
    notification.setAttribute('aria-live', type === 'warning' ? 'assertive' : 'polite');
    let icon = '';
    if (type === 'success') icon = '✅';
    else if (type === 'warning') icon = '⚠️';
    else icon = 'ℹ️';
    notification.innerHTML = `<span style="font-size:1.5rem;">${icon}</span> <span>${message}</span>`;
    document.body.appendChild(notification);
    setTimeout(() => notification.classList.add('show'), 50);
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}


// ===================== SERVICE SEARCH & BOOKING =====================

// Generic search handler for all services
function handleServiceSearch(service) {
    const form = document.querySelector(`.${service}-search-form`);
    if (!form) {
        console.log(`⚠️ No form found for ${service}-search-form`);
        return;
    }
    console.log(`✅ Attached search handler for ${service}`);
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        const from = form.querySelector('.from')?.value || '';
        const to = form.querySelector('.to')?.value || '';
        const date = form.querySelector('.date')?.value || '';
        
        console.log(`🔍 ${service} search:`, { from, to, date });
        
        if (from && to && date) {
            const button = form.querySelector('button[type="submit"]');
            const originalText = button.innerHTML;
            button.innerHTML = '<span>🔍 Searching...</span>';
            button.disabled = true;
            setTimeout(() => {
                displayServiceResults(service, from, to, date);
                button.innerHTML = originalText;
                button.disabled = false;
            }, FAKE_SEARCH_DELAY_MS);
        } else {
            showNotification('⚠️ Please fill in all fields!', 'warning');
        }
    });
}

// Display results for each service (calls backend API)
async function displayServiceResults(service, from, to, date) {
    const resultsSection = document.getElementById(`${service}-results`);
    const resultsContent = document.getElementById(`${service}-results-content`);
    if (!resultsSection || !resultsContent) return;
    
    try {
        // Map service names to API endpoints
        const apiEndpoints = {
            'hotels': `/api/hotels/search?city=${encodeURIComponent(from)}&checkin=${encodeURIComponent(date)}`,
            'trains': `/api/trains/search?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}&date=${encodeURIComponent(date)}`,
            'buses': `/api/buses/search?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}&date=${encodeURIComponent(date)}`,
            'cabs': `/api/cabs/search?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}&date=${encodeURIComponent(date)}`,
            'holidays': `/api/holidays/search?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}&date=${encodeURIComponent(date)}`
        };
        
    const response = await apiFetch(`${apiEndpoints[service]}`);
        const data = await response.json();
        
        if (!data.success) {
            throw new Error(data.error || `Failed to fetch ${service}`);
        }
        
        const items = data[service] || data.hotels || data.trains || data.buses || data.cabs || data.holidays || [];
        
        let resultsHTML = `<div class="search-summary"><div class="summary-card"><h3>🔎 ${service.charAt(0).toUpperCase() + service.slice(1)} Search</h3><p><strong>From:</strong> ${from}</p><p><strong>To:</strong> ${to}</p><p><strong>Date:</strong> ${new Date(date).toLocaleDateString('en-IN')}</p><p class="results-count">📊 Found ${items.length} options</p></div></div>`;
        
        if (items.length > 0) {
            resultsHTML += `<div class="flights-grid">`;
            items.forEach(item => {
                const icon = service === 'hotels' ? '🏨' : service === 'trains' ? '🚂' : service === 'buses' ? '🚌' : service === 'cabs' ? '🚕' : '🏖️';
                const name = item.name || item.operator || item.cabType || item.destination || 'Service';
                const price = item.price || 0;
                const details = service === 'hotels' ? `${item.rating}⭐ • ${item.amenities}` :
                               service === 'trains' ? `${item.trainNo} • ${item.departure} - ${item.arrival} • ${item.duration}` :
                               service === 'buses' ? `${item.busType} • ${item.departure} - ${item.arrival} • ${item.duration}` :
                               service === 'cabs' ? `${item.duration} • ${item.distance}` :
                               `${item.durationDays} days • ${item.inclusions}`;
                
                resultsHTML += `<div class="flight-card"><div class="flight-header"><h4>${icon} ${name}</h4></div><div class="flight-details"><div class="flight-time"><div class="time-box"><span class="city">${item.from || from}</span></div><div class="flight-duration"><span class="duration">${details}</span></div><div class="time-box"><span class="city">${item.to || item.city || item.destination || to}</span></div></div></div><div class="flight-footer"><div class="price-section"><span class="price-label">Price</span><span class="price">₹${price.toLocaleString('en-IN')}</span></div><button class="btn btn-primary book-service" onclick="bookService('${service}', ${item.id}, '${name}', ${price})">Book Now</button></div></div>`;
            });
            resultsHTML += `</div>`;
            showNotification(`✅ ${service.charAt(0).toUpperCase() + service.slice(1)} search completed!`, 'success');
        } else {
            resultsHTML += `<div class="no-results-card"><div class="no-results-icon">🕵️‍♂️</div><h3>No ${service} found</h3><p>Try different search criteria or dates.</p></div>`;
            showNotification(`ℹ️ No ${service} found.`, 'info');
        }
        
        resultsContent.innerHTML = resultsHTML;
        resultsSection.style.display = 'block';
        resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } catch (error) {
        console.error(`Error fetching ${service}:`, error);
        showNotification(`❌ Error searching ${service}. Please try again.`, 'warning');
    resultsContent.innerHTML = `<div class="no-results-card"><div class="no-results-icon">⚠️</div><h3>Connection Error</h3><p>Unable to connect to the server. Please make sure the backend is running.</p><button class="btn btn-primary" onclick="location.reload()">Retry</button></div>`;
        resultsSection.style.display = 'block';
    }
}

// Book Now for service (shows modal)
function bookService(service, id, name, price) {
    const modalOverlay = document.createElement('div');
    modalOverlay.className = 'package-modal-overlay';
    modalOverlay.innerHTML = `
        <div class="package-modal">
            <button class="package-modal-close" aria-label="Close">&times;</button>
            <h2>Book ${name}</h2>
            <form id="service-booking-form">
                <div style="margin: 1rem 0;">
                    <label style="display: block; margin-bottom: 0.5rem; font-weight: 600;">Name *</label>
                    <input type="text" id="service-booking-name" required style="width: 100%; padding: 0.75rem; border: 2px solid var(--bg-secondary); border-radius: 8px; font-size: 1rem;">
                </div>
                <div style="margin: 1rem 0;">
                    <label style="display: block; margin-bottom: 0.5rem; font-weight: 600;">Email *</label>
                    <input type="email" id="service-booking-email" required style="width: 100%; padding: 0.75rem; border: 2px solid var(--bg-secondary); border-radius: 8px; font-size: 1rem;">
                </div>
                <div style="margin: 1rem 0;">
                    <label style="display: block; margin-bottom: 0.5rem; font-weight: 600;">Phone *</label>
                    <input type="tel" id="service-booking-phone" required style="width: 100%; padding: 0.75rem; border: 2px solid var(--bg-secondary); border-radius: 8px; font-size: 1rem;">
                </div>
                <div style="margin: 1.5rem 0; padding: 1rem; background: var(--bg-secondary); border-radius: 8px;">
                    <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
                        <span>Price:</span>
                        <strong>₹${price.toLocaleString('en-IN')}</strong>
                    </div>
                </div>
                <div class="modal-actions">
                    <button type="submit" class="btn btn-primary" style="flex: 1;">Confirm Booking</button>
                    <button type="button" class="btn btn-secondary" onclick="this.closest('.package-modal-overlay').remove()">Cancel</button>
                </div>
            </form>
        </div>`;
    document.body.appendChild(modalOverlay);
    // Close modal
    const closeBtn = modalOverlay.querySelector('.package-modal-close');
    closeBtn.addEventListener('click', () => modalOverlay.remove());
    modalOverlay.addEventListener('click', (e) => { if (e.target === modalOverlay) modalOverlay.remove(); });
    // Handle booking form
    const bookingForm = document.getElementById('service-booking-form');
    bookingForm.addEventListener('submit', function(e) {
        e.preventDefault();
        const spinner = document.getElementById('spinner-overlay');
        if (spinner) spinner.style.display = 'flex';

        const name = document.getElementById('service-booking-name').value;
        const email = document.getElementById('service-booking-email').value;
        const phone = document.getElementById('service-booking-phone').value;

        // Validate email format
        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailPattern.test(email)) {
            showNotification('⚠️ Please enter a valid email address.', 'warning');
            if (spinner) spinner.style.display = 'none';
            return;
        }
        // Validate phone format (10 digits, starts with 6-9)
        const phonePattern = /^[6-9]\d{9}$/;
        if (!phonePattern.test(phone)) {
            showNotification('⚠️ Please enter a valid 10-digit phone number starting with 6-9.', 'warning');
            if (spinner) spinner.style.display = 'none';
            return;
        }

        // Call API to create booking
        (async () => {
            try {
                const token = localStorage.getItem('token');
                const response = await apiFetch('/api/bookings', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': token ? `Bearer ${token}` : ''
                    },
                    body: JSON.stringify({
                        serviceType: service,
                        serviceId: id,
                        serviceName: name,
                        passengerName: name,
                        passengerEmail: email,
                        passengerPhone: phone,
                        numPassengers: 1
                    })
                });

                const data = await response.json();
                
                if (data.success) {
                    showNotification(`🎉 ${service.charAt(0).toUpperCase() + service.slice(1)} booked successfully! Ref: ${data.booking.bookingReference}`, 'success');
                    modalOverlay.remove();
                } else {
                    showNotification(`❌ Booking failed: ${data.error}`, 'warning');
                }
            } catch (error) {
                console.error('Booking error:', error);
                showNotification('❌ Error creating booking. Please try again.', 'warning');
            } finally {
                if (spinner) spinner.style.display = 'none';
            }
        })();
    });
}

// Attach handlers for all service pages on DOM load
document.addEventListener('DOMContentLoaded', function() {
    ['hotels','trains','buses','cabs','holidays'].forEach(service => handleServiceSearch(service));
    
    // Add clear results handlers for all services
    ['hotels','trains','buses','cabs','holidays'].forEach(service => {
        const clearBtn = document.getElementById(`clear-${service}-results`);
        if (clearBtn) {
            clearBtn.addEventListener('click', function () {
                const resultsSection = document.getElementById(`${service}-results`);
                const resultsContent = document.getElementById(`${service}-results-content`);
                if (resultsContent) resultsContent.innerHTML = '';
                if (resultsSection) resultsSection.style.display = 'none';
                const form = document.querySelector(`.${service}-search-form`);
                if (form) form.reset();
                showNotification('Results cleared', 'success');
            });
        }
    });
    
    // Handle "Book Now" buttons on featured items (static cards on page load)
    const bookButtons = document.querySelectorAll('.btn');
    console.log(`🔘 Found ${bookButtons.length} .btn elements on page`);
    
    let attachedCount = 0;
    bookButtons.forEach(btn => {
        // Only attach if it's a "Book Now" button and doesn't already have onclick
        if (btn.textContent.trim() === 'Book Now' && !btn.hasAttribute('onclick')) {
            console.log('📌 Attaching handler to "Book Now" button:', btn);
            attachedCount++;
            
            btn.addEventListener('click', function(e) {
                e.preventDefault();
                console.log('🖱️ Book Now button clicked!');
                
                const card = this.closest('.flight-card') || this.closest('.card');
                if (card) {
                    const title = card.querySelector('.airline, h3')?.textContent || 'Service';
                    const priceText = card.querySelector('.price')?.textContent || '₹0';
                    const price = parseInt(priceText.replace(/[₹,]/g, '')) || 0;
                    
                    console.log('📦 Card data:', { title, priceText, price });
                    
                    // Determine service type from page URL or form class
                    let serviceType = 'flights'; // Default to flights
                    
                    // Check for service-specific forms
                    if (document.querySelector('.hotels-search-form')) serviceType = 'hotels';
                    else if (document.querySelector('.trains-search-form')) serviceType = 'trains';
                    else if (document.querySelector('.buses-search-form')) serviceType = 'buses';
                    else if (document.querySelector('.cabs-search-form')) serviceType = 'cabs';
                    else if (document.querySelector('.holidays-search-form')) serviceType = 'holidays';
                    
                    console.log('🎯 Detected service type:', serviceType);
                    
                    // Use bookFlight for flights page, bookService for others
                    if (serviceType === 'flights') {
                        console.log('✈️ Calling bookFlight with:', Date.now(), title, price);
                        bookFlight(Date.now(), title, price);
                    } else {
                        console.log('🚌 Calling bookService with:', serviceType, Date.now(), title, price);
                        bookService(serviceType, Date.now(), title, price);
                    }
                } else {
                    console.log('❌ No card found for button');
                }
            });
        }
    });
    
    console.log(`✅ Attached handlers to ${attachedCount} "Book Now" buttons`);
    
    console.log('✅ All service search handlers attached.');
});

// =====================================================
// USER SESSION MANAGEMENT
// Show logout button if logged in
document.addEventListener('DOMContentLoaded', function() {
    const logoutBtn = document.getElementById('logout-btn');
    const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
    if (logoutBtn) {
        logoutBtn.style.display = isLoggedIn ? '' : 'none';
        logoutBtn.onclick = function() {
            localStorage.removeItem('user');
            localStorage.removeItem('isLoggedIn');
            localStorage.removeItem('token');
            showNotification('👋 Logged out successfully!', 'success');
            setTimeout(() => window.location.reload(), 1000);
        };
    }
});
// Intercept login to store JWT
async function loginUser(email, password) {
    try {
        const response = await apiFetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        const data = await response.json();
        if (data.success && data.token) {
            localStorage.setItem('user', JSON.stringify(data.user));
            localStorage.setItem('isLoggedIn', 'true');
            localStorage.setItem('token', data.token);
            showNotification('✅ Login successful!', 'success');
            setTimeout(() => window.location.reload(), 1000);
        } else {
            showNotification(`❌ Login failed: ${data.error || 'Unknown error'}`, 'warning');
        }
    } catch (err) {
        showNotification('❌ Login error. Please try again.', 'warning');
    }
}
// =====================================================

document.addEventListener('DOMContentLoaded', function() {
    const profileBtn = document.getElementById('profile-btn');
    const registerBtn = document.getElementById('register-btn');
    const user = JSON.parse(localStorage.getItem('user') || 'null');
    const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
    
    if (isLoggedIn && user) {
        // User is logged in - show profile with name
        profileBtn.innerHTML = `<span title="${user.name} (${user.email})">${user.name.split(' ')[0]} 👤</span>`;
        profileBtn.style.color = 'var(--accent)';
        profileBtn.style.fontWeight = '600';
        
        // Hide register button when logged in
        if (registerBtn) registerBtn.style.display = 'none';
        
        // Add dropdown menu for profile
        profileBtn.addEventListener('click', function(e) {
            e.preventDefault();
            showProfileMenu();
        });
    } else {
        // User is NOT logged in - show Login text and Register button
        profileBtn.innerHTML = `🔐 Login`;
        profileBtn.classList.add('login-btn');
        profileBtn.setAttribute('title', 'Click to login to your account');
        
        // Show register button when not logged in
        if (registerBtn) registerBtn.style.display = 'inline-block';
    }
});

function showProfileMenu() {
    const user = JSON.parse(localStorage.getItem('user'));
    const menu = document.createElement('div');
    menu.style.cssText = `
        position: fixed;
        top: 80px;
        right: 20px;
        background: var(--card-bg);
        padding: 1.5rem;
        border-radius: var(--radius-xl);
        box-shadow: var(--shadow-lg);
        z-index: 10000;
        min-width: 250px;
        animation: fadeInDown 0.3s ease;
    `;
    menu.innerHTML = `
        <div style="margin-bottom: 1rem; padding-bottom: 1rem; border-bottom: 2px solid var(--bg-secondary);">
            <h3 style="margin: 0 0 0.5rem 0; color: var(--text-primary);">👤 ${user.name}</h3>
            <p style="margin: 0; color: var(--text-secondary); font-size: 0.9rem;">${user.email}</p>
        </div>
        <button class="btn btn-secondary" style="width: 100%; margin-bottom: 0.5rem;" onclick="window.location.href='#bookings'">📋 My Bookings</button>
        <button class="btn btn-secondary" style="width: 100%; margin-bottom: 0.5rem;" onclick="window.location.href='#favorites'">❤️ Favorites</button>
        <button class="btn btn-primary" style="width: 100%; background: #ef4444;" onclick="logout()">🚪 Logout</button>
    `;
    document.body.appendChild(menu);
    
    // Close menu when clicking outside
    setTimeout(() => {
        document.addEventListener('click', function closeMenu(e) {
            if (!menu.contains(e.target) && e.target.id !== 'profile-btn') {
                menu.remove();
                document.removeEventListener('click', closeMenu);
            }
        });
    }, 100);
}

function logout() {
    localStorage.removeItem('user');
    localStorage.removeItem('isLoggedIn');
    showNotification('👋 Logged out successfully!', 'success');
    setTimeout(() => {
        window.location.reload();
    }, 1000);
}

// =====================================================
// SCROLL REVEAL ANIMATIONS
// =====================================================
document.addEventListener('DOMContentLoaded', () => {
    // Respect reduced motion preference
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced || !('IntersectionObserver' in window)) return;

    // Elements to reveal on scroll
    const revealTargets = document.querySelectorAll(
        '.section, .summary-card, .weather-card, .ai-card, .flight-card, .cards-grid .card, .team-member'
    );
    revealTargets.forEach(el => el.classList.add('reveal'));

    // Grids to stagger (children animate with delay)
    const staggerContainers = document.querySelectorAll('.cards-grid, .flights-grid, .team-grid');
    staggerContainers.forEach(el => el.classList.add('stagger'));

    // Intersection Observer to trigger animations
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (!entry.isIntersecting) return;
            entry.target.classList.add('in-view');
            observer.unobserve(entry.target); // Only animate once
        });
    }, {
        threshold: 0.15,
        rootMargin: '0px 0px -10% 0px'
    });

    // Observe all reveal and stagger elements
    document.querySelectorAll('.reveal, .stagger').forEach(el => observer.observe(el));
    
    console.log('✨ Scroll reveal animations initialized');
});

// =====================================================
// AI RECOMMENDATIONS CLOSE/SHOW BUTTON
// =====================================================
document.addEventListener('DOMContentLoaded', () => {
    const closeBtn = document.getElementById('close-ai-section');
    const showBtn = document.getElementById('show-ai-section');
    const aiSection = document.getElementById('ai-recommendations-section');
    const showContainer = document.getElementById('show-ai-container');
    
    if (closeBtn && showBtn && aiSection && showContainer) {
        // Close button handler
        closeBtn.addEventListener('click', () => {
            aiSection.classList.add('hidden');
            showContainer.classList.remove('hidden');
            showContainer.classList.add('visible');
            showNotification('AI Recommendations section closed', 'info');
            
            // Save preference to localStorage
            localStorage.setItem('aiRecommendationsHidden', 'true');
            
            // Smooth scroll to show button
            setTimeout(() => {
                showContainer.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }, 100);
        });
        
        // Show button handler
        showBtn.addEventListener('click', () => {
            aiSection.classList.remove('hidden');
            showContainer.classList.remove('visible');
            showContainer.classList.add('hidden');
            showNotification('🤖 AI Recommendations restored!', 'success');
            
            // Remove preference from localStorage
            localStorage.removeItem('aiRecommendationsHidden');
            
            // Smooth scroll to AI section
            setTimeout(() => {
                aiSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }, 100);
        });
        
        // Check if user previously closed the section
        const wasHidden = localStorage.getItem('aiRecommendationsHidden');
        if (wasHidden === 'true') {
            aiSection.classList.add('hidden');
            showContainer.classList.remove('hidden');
            showContainer.classList.add('visible');
        }
    }
});