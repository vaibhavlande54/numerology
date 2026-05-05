// My Bookings Page JavaScript

let allBookings = [];
let filteredBookings = [];
let currentFilter = 'all';

// Ensure Supabase client (if present) has had a chance to initialize
function ensureSupabaseReady(timeout = 2000) {
    return new Promise(resolve => {
        if (window.supabase) return resolve();
        const start = Date.now();
        const iv = setInterval(() => {
            if (window.supabase) {
                clearInterval(iv);
                return resolve();
            }
            if (Date.now() - start > timeout) {
                clearInterval(iv);
                return resolve();
            }
        }, 50);
    });
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', async () => {
    await ensureSupabaseReady();
    // Check authentication
    checkAuthentication();
    
    // Load bookings
    loadBookings();
    
    // Setup event listeners
    setupEventListeners();
});

// Check if user is logged in
function checkAuthentication() {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const userName = document.getElementById('userName');
    const token = localStorage.getItem('token');
    
    if (user.name) {
        userName.textContent = user.name;
    }
    
    if (!token) {
        showNotification('Please login to view your bookings', 'error');
        setTimeout(() => window.location.href = 'login_new.html', 2000);
    }
}

// Load bookings from API
async function loadBookings() {
    const token = localStorage.getItem('token');

    // If no token and no Supabase client available, show empty
    if (!token && !window.supabase) {
        displayEmptyState();
        return;
    }

    try {
        showSpinner();
        // If Supabase client is available, try to load from Supabase table `bookings`
        if (window.supabase) {
            // Try to determine user id
            let userId = null;
            try {
                const userLS = JSON.parse(localStorage.getItem('user') || '{}');
                if (userLS.id) userId = userLS.id;
                else {
                    const { data } = await window.supabase.auth.getUser();
                    userId = data?.user?.id || null;
                }
            } catch (e) {
                userId = null;
            }

            let query = window.supabase.from('bookings').select('*').order('booked_at', { ascending: false });
            if (userId) query = query.eq('user_id', userId);
            const { data, error } = await query;
            if (error) throw error;
            allBookings = data || [];
            filteredBookings = [...allBookings];
            displayBookings(filteredBookings);
            return;
        }

        const response = await apiFetch('/api/bookings', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (response.ok) {
            allBookings = await response.json();
            filteredBookings = [...allBookings];
            displayBookings(filteredBookings);
        } else if (response.status === 401) {
            // Token expired
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            showNotification('Session expired. Please login again', 'error');
            setTimeout(() => window.location.href = 'login_new.html', 2000);
        } else {
            throw new Error('Failed to load bookings');
        }
    } catch (error) {
        console.error('Error loading bookings:', error);
        showNotification('Unable to load bookings', 'error');
        displayEmptyState();
    } finally {
        hideSpinner();
    }
}

// Display bookings
function displayBookings(bookings) {
    const container = document.getElementById('bookingsList');
    const emptyState = document.getElementById('emptyState');
    
    // Hide loading state
    const loadingState = container.querySelector('.loading-state');
    if (loadingState) {
        loadingState.remove();
    }

    if (!bookings || bookings.length === 0) {
        displayEmptyState();
        return;
    }

    // Hide empty state
    emptyState.style.display = 'none';
    
    // Clear container
    container.innerHTML = '';

    // Display each booking
    bookings.forEach(booking => {
        const card = createBookingCard(booking);
        container.appendChild(card);
    });
}

// Create booking card HTML
function createBookingCard(booking) {
    const card = document.createElement('div');
    const serviceType = booking.serviceType || 'flight';
    card.className = `booking-card ${booking.status === 'cancelled' ? 'cancelled' : ''} service-${serviceType}`;
    card.setAttribute('data-booking-id', booking.id);
    
    // Get service-specific configuration
    const serviceConfig = getServiceConfig(serviceType);
    const serviceContent = getServiceContent(booking, serviceType);
    
    card.innerHTML = `
        <div class="booking-header">
            <div class="booking-ref">
                <span class="ref-label">Booking Reference</span>
                <span class="ref-code">${booking.booking_reference || booking.bookingReference}</span>
            </div>
            <div class="header-right">
                <span class="service-badge ${serviceType}">
                    <i class="${serviceConfig.icon}"></i> ${serviceConfig.label}
                </span>
                <span class="booking-status ${booking.status}">${booking.status}</span>
            </div>
        </div>

        <div class="booking-body">
            ${serviceContent}
        </div>

        <div class="booking-footer">
            <div class="booking-price">
                <span class="price-label">Total Amount</span>
                <span class="price-amount">₹${(booking.total_price || 0).toLocaleString()}</span>
            </div>
            <div class="booking-actions">
                <button class="btn-sm btn-outline view-details-btn" data-booking-id="${booking.id}">
                    <i class="fas fa-eye"></i> View Details
                </button>
                ${booking.status === 'confirmed' ? `
                <button class="btn-sm btn-danger cancel-btn" data-booking-id="${booking.id}">
                    <i class="fas fa-times"></i> Cancel
                </button>
                ` : ''}
            </div>
        </div>
    `;

    return card;
}

// Get service type configuration
function getServiceConfig(serviceType) {
    const configs = {
        flight: { icon: 'fas fa-plane', label: 'Flight', color: '#2563eb' },
        hotel: { icon: 'fas fa-hotel', label: 'Hotel', color: '#dc2626' },
        train: { icon: 'fas fa-train', label: 'Train', color: '#059669' },
        bus: { icon: 'fas fa-bus', label: 'Bus', color: '#d97706' },
        cab: { icon: 'fas fa-taxi', label: 'Cab', color: '#7c3aed' },
        holiday: { icon: 'fas fa-umbrella-beach', label: 'Holiday', color: '#ec4899' }
    };
    return configs[serviceType] || configs.flight;
}

// Get service-specific content
function getServiceContent(booking, serviceType) {
    const travelDate = booking.flight?.travel_date || booking.travel_date || booking.booked_at;
    
    switch(serviceType) {
        case 'flight':
            return getFlightContent(booking);
        case 'hotel':
            return getHotelContent(booking, travelDate);
        case 'train':
            return getTrainContent(booking, travelDate);
        case 'bus':
            return getBusContent(booking, travelDate);
        case 'cab':
            return getCabContent(booking, travelDate);
        case 'holiday':
            return getHolidayContent(booking, travelDate);
        default:
            return getFlightContent(booking);
    }
}

// Flight booking content
function getFlightContent(booking) {
    const departureTime = formatTime(booking.flight?.departure);
    const arrivalTime = formatTime(booking.flight?.arrival);
    
    return `
        <div class="flight-route">
            <div class="route-point">
                <h3>${booking.flight?.from_city || booking.from_city || 'N/A'}</h3>
                <p>${departureTime}</p>
            </div>
            <div class="route-connector">
                <i class="fas fa-plane"></i>
                <span>${booking.flight?.duration || '2h 30m'}</span>
            </div>
            <div class="route-point">
                <h3>${booking.flight?.to_city || booking.to_city || 'N/A'}</h3>
                <p>${arrivalTime}</p>
            </div>
        </div>
        <div class="booking-meta">
            <div class="meta-item">
                <i class="fas fa-plane"></i>
                <span>${booking.flight?.flight_no || 'Flight #' + booking.flight_id}</span>
            </div>
            <div class="meta-item">
                <i class="fas fa-calendar"></i>
                <span>${formatDate(booking.flight?.travel_date)}</span>
            </div>
            <div class="meta-item">
                <i class="fas fa-users"></i>
                <span>${booking.num_passengers} Passenger(s)</span>
            </div>
            <div class="meta-item">
                <i class="fas fa-building"></i>
                <span>${booking.flight?.airline || 'Airline'}</span>
            </div>
        </div>
    `;
}

// Hotel booking content
function getHotelContent(booking, travelDate) {
    return `
        <div class="service-info">
            <div class="service-main">
                <h3><i class="fas fa-hotel"></i> ${booking.serviceName || 'Hotel Booking'}</h3>
                <p class="service-desc">Hotel accommodation</p>
            </div>
        </div>
        <div class="booking-meta">
            <div class="meta-item">
                <i class="fas fa-user"></i>
                <span>${booking.passenger_name}</span>
            </div>
            <div class="meta-item">
                <i class="fas fa-calendar"></i>
                <span>${formatDate(travelDate)}</span>
            </div>
            <div class="meta-item">
                <i class="fas fa-users"></i>
                <span>${booking.num_passengers} Guest(s)</span>
            </div>
            <div class="meta-item">
                <i class="fas fa-envelope"></i>
                <span>${booking.passenger_email}</span>
            </div>
        </div>
    `;
}

// Train booking content
function getTrainContent(booking, travelDate) {
    return `
        <div class="service-info">
            <div class="service-main">
                <h3><i class="fas fa-train"></i> ${booking.serviceName || 'Train Booking'}</h3>
                <p class="service-desc">Railway journey</p>
            </div>
        </div>
        <div class="booking-meta">
            <div class="meta-item">
                <i class="fas fa-user"></i>
                <span>${booking.passenger_name}</span>
            </div>
            <div class="meta-item">
                <i class="fas fa-calendar"></i>
                <span>${formatDate(travelDate)}</span>
            </div>
            <div class="meta-item">
                <i class="fas fa-users"></i>
                <span>${booking.num_passengers} Passenger(s)</span>
            </div>
            <div class="meta-item">
                <i class="fas fa-ticket-alt"></i>
                <span>Booking ID: ${booking.serviceId}</span>
            </div>
        </div>
    `;
}

// Bus booking content
function getBusContent(booking, travelDate) {
    return `
        <div class="service-info">
            <div class="service-main">
                <h3><i class="fas fa-bus"></i> ${booking.serviceName || 'Bus Booking'}</h3>
                <p class="service-desc">Bus travel</p>
            </div>
        </div>
        <div class="booking-meta">
            <div class="meta-item">
                <i class="fas fa-user"></i>
                <span>${booking.passenger_name}</span>
            </div>
            <div class="meta-item">
                <i class="fas fa-calendar"></i>
                <span>${formatDate(travelDate)}</span>
            </div>
            <div class="meta-item">
                <i class="fas fa-users"></i>
                <span>${booking.num_passengers} Seat(s)</span>
            </div>
            <div class="meta-item">
                <i class="fas fa-phone"></i>
                <span>${booking.passenger_phone || 'N/A'}</span>
            </div>
        </div>
    `;
}

// Cab booking content
function getCabContent(booking, travelDate) {
    return `
        <div class="service-info">
            <div class="service-main">
                <h3><i class="fas fa-taxi"></i> ${booking.serviceName || 'Cab Booking'}</h3>
                <p class="service-desc">Cab service</p>
            </div>
        </div>
        <div class="booking-meta">
            <div class="meta-item">
                <i class="fas fa-user"></i>
                <span>${booking.passenger_name}</span>
            </div>
            <div class="meta-item">
                <i class="fas fa-calendar"></i>
                <span>${formatDate(travelDate)}</span>
            </div>
            <div class="meta-item">
                <i class="fas fa-users"></i>
                <span>${booking.num_passengers} Passenger(s)</span>
            </div>
            <div class="meta-item">
                <i class="fas fa-phone"></i>
                <span>${booking.passenger_phone || 'N/A'}</span>
            </div>
        </div>
    `;
}

// Holiday booking content
function getHolidayContent(booking, travelDate) {
    return `
        <div class="service-info holiday">
            <div class="service-main">
                <h3><i class="fas fa-umbrella-beach"></i> ${booking.serviceName || 'Holiday Package'}</h3>
                <p class="service-desc">Complete holiday package with accommodation and activities</p>
            </div>
        </div>
        <div class="booking-meta">
            <div class="meta-item">
                <i class="fas fa-user"></i>
                <span>${booking.passenger_name}</span>
            </div>
            <div class="meta-item">
                <i class="fas fa-calendar"></i>
                <span>${formatDate(travelDate)}</span>
            </div>
            <div class="meta-item">
                <i class="fas fa-users"></i>
                <span>${booking.num_passengers} Traveler(s)</span>
            </div>
            <div class="meta-item">
                <i class="fas fa-envelope"></i>
                <span>${booking.passenger_email}</span>
            </div>
        </div>
    `;
}

// Display empty state
function displayEmptyState() {
    const container = document.getElementById('bookingsList');
    const emptyState = document.getElementById('emptyState');
    
    container.innerHTML = '';
    emptyState.style.display = 'block';
}

// Setup event listeners
function setupEventListeners() {
    // Filter buttons
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const filter = e.currentTarget.getAttribute('data-filter');
            applyFilter(filter);
            
            // Update active state
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            e.currentTarget.classList.add('active');
        });
    });

    // Search
    const searchInput = document.getElementById('searchBookings');
    searchInput.addEventListener('input', (e) => {
        const query = e.target.value.toLowerCase();
        applySearch(query);
    });

    // View details (event delegation)
    document.getElementById('bookingsList').addEventListener('click', (e) => {
        const viewBtn = e.target.closest('.view-details-btn');
        const cancelBtn = e.target.closest('.cancel-btn');
        
        if (viewBtn) {
            const bookingId = parseInt(viewBtn.getAttribute('data-booking-id'));
            showBookingDetails(bookingId);
        }
        
        if (cancelBtn) {
            const bookingId = parseInt(cancelBtn.getAttribute('data-booking-id'));
            confirmCancelBooking(bookingId);
        }
    });

    // Close modal
    document.getElementById('closeDetailModal').addEventListener('click', closeModal);
    document.getElementById('detailModal').addEventListener('click', (e) => {
        if (e.target.id === 'detailModal') {
            closeModal();
        }
    });

    // Cancel booking from modal
    document.getElementById('cancelBookingBtn').addEventListener('click', () => {
        const bookingId = parseInt(document.getElementById('cancelBookingBtn').getAttribute('data-booking-id'));
        confirmCancelBooking(bookingId);
    });

    // Logout
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = 'login_new.html';
        });
    }
}

// Apply filter
function applyFilter(filter) {
    currentFilter = filter;
    
    if (filter === 'all') {
        filteredBookings = [...allBookings];
    } else {
        filteredBookings = allBookings.filter(b => b.status === filter);
    }
    
    displayBookings(filteredBookings);
}

// Apply search
function applySearch(query) {
    if (!query) {
        applyFilter(currentFilter);
        return;
    }
    
    filteredBookings = allBookings.filter(booking => {
        const ref = (booking.booking_reference || booking.bookingReference || '').toLowerCase();
        const flightNo = (booking.flight?.flight_no || '').toLowerCase();
        const fromCity = (booking.flight?.from_city || booking.from_city || '').toLowerCase();
        const toCity = (booking.flight?.to_city || booking.to_city || '').toLowerCase();
        
        return ref.includes(query) || 
               flightNo.includes(query) || 
               fromCity.includes(query) || 
               toCity.includes(query);
    });
    
    displayBookings(filteredBookings);
}

// Show booking details modal
async function showBookingDetails(bookingId) {
    const booking = allBookings.find(b => b.id === bookingId);
    
    if (!booking) {
        showNotification('Booking not found', 'error');
        return;
    }

    // Populate modal with booking details
    const modal = document.getElementById('detailModal');
    
    document.getElementById('modalBookingRef').textContent = booking.booking_reference || booking.bookingReference;
    document.getElementById('modalStatus').textContent = booking.status;
    document.getElementById('modalStatus').className = `booking-status ${booking.status}`;
    
    // Flight details
    document.getElementById('modalFromCity').textContent = booking.flight?.from_city || booking.from_city || 'N/A';
    document.getElementById('modalToCity').textContent = booking.flight?.to_city || booking.to_city || 'N/A';
    document.getElementById('modalDepartureTime').textContent = formatTime(booking.flight?.departure);
    document.getElementById('modalArrivalTime').textContent = formatTime(booking.flight?.arrival);
    document.getElementById('modalDuration').textContent = booking.flight?.duration || '-';
    document.getElementById('modalFlightNumber').textContent = booking.flight?.flight_no || 'Flight #' + booking.flight_id;
    document.getElementById('modalAirline').textContent = booking.flight?.airline || '-';
    document.getElementById('modalTravelDate').textContent = formatDate(booking.flight?.travel_date || booking.travel_date);
    document.getElementById('modalStops').textContent = booking.flight?.stops === 0 ? 'Non-stop' : `${booking.flight?.stops || 0} stop(s)`;
    
    // Passenger details
    document.getElementById('modalPassengerName').textContent = booking.passenger_name;
    document.getElementById('modalEmail').textContent = booking.passenger_email;
    document.getElementById('modalPhone').textContent = booking.passenger_phone;
    document.getElementById('modalNumPassengers').textContent = booking.num_passengers;
    
    // Payment details
    document.getElementById('modalTotalPrice').textContent = `₹${(booking.total_price || 0).toLocaleString()}`;
    document.getElementById('modalBookedAt').textContent = formatDateTime(booking.booked_at);
    
    // Set booking ID for cancel button
    const cancelBtn = document.getElementById('cancelBookingBtn');
    cancelBtn.setAttribute('data-booking-id', bookingId);
    
    // Hide cancel button if already cancelled
    if (booking.status === 'cancelled') {
        cancelBtn.style.display = 'none';
    } else {
        cancelBtn.style.display = 'inline-flex';
    }
    
    // Show modal
    modal.classList.add('active');
}

// Close modal
function closeModal() {
    const modal = document.getElementById('detailModal');
    modal.classList.remove('active');
}

// Confirm cancel booking
function confirmCancelBooking(bookingId) {
    if (confirm('Are you sure you want to cancel this booking? This action cannot be undone.')) {
        cancelBooking(bookingId);
    }
}

// Cancel booking
async function cancelBooking(bookingId) {
    const token = localStorage.getItem('token');
    
    if (!token) {
        showNotification('Please login to cancel booking', 'error');
        return;
    }

    try {
        showSpinner();
        // If Supabase client available, update booking status in Supabase
        if (window.supabase) {
            const { error } = await window.supabase.from('bookings').update({ status: 'cancelled' }).eq('id', bookingId);
            if (error) throw error;
            showNotification('Booking cancelled successfully', 'success');
            const booking = allBookings.find(b => b.id === bookingId);
            if (booking) booking.status = 'cancelled';
            applyFilter(currentFilter);
            closeModal();
            return;
        }

        const response = await apiFetch(`/api/bookings/${bookingId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (response.ok) {
            showNotification('Booking cancelled successfully', 'success');
            
            // Update local data
            const booking = allBookings.find(b => b.id === bookingId);
            if (booking) {
                booking.status = 'cancelled';
            }
            
            // Refresh display
            applyFilter(currentFilter);
            closeModal();
        } else {
            const error = await response.json();
            throw new Error(error.error || 'Failed to cancel booking');
        }
    } catch (error) {
        console.error('Cancel booking error:', error);
        showNotification(error.message || 'Unable to cancel booking', 'error');
    } finally {
        hideSpinner();
    }
}

// Format time from HH:MM:SS to HH:MM
function formatTime(timeStr) {
    if (!timeStr) return '-';
    const parts = timeStr.split(':');
    return `${parts[0]}:${parts[1]}`;
}

// Format date
function formatDate(dateStr) {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-IN', { 
        day: 'numeric', 
        month: 'short', 
        year: 'numeric' 
    });
}

// Format date and time
function formatDateTime(dateStr) {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-IN', { 
        day: 'numeric', 
        month: 'short', 
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// Spinner functions
function showSpinner() {
    const spinner = document.getElementById('spinnerOverlay');
    if (spinner) spinner.style.display = 'flex';
}

function hideSpinner() {
    const spinner = document.getElementById('spinnerOverlay');
    if (spinner) spinner.style.display = 'none';
}

// Show notification (reuse from script.js if available)
function showNotification(message, type = 'info') {
    // Check if global showNotification exists
    if (window.showNotification && typeof window.showNotification === 'function') {
        window.showNotification(message, type);
        return;
    }

    // Fallback notification
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 100px;
        right: 20px;
        padding: 1rem 1.5rem;
        background: ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#3b82f6'};
        color: white;
        border-radius: 8px;
        box-shadow: 0 4px 15px rgba(0,0,0,0.2);
        z-index: 10000;
        animation: slideIn 0.3s ease;
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}
