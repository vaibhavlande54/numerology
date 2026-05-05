// Booking Page JavaScript

// Get URL parameters
const urlParams = new URLSearchParams(window.location.search);
const serviceType = urlParams.get('serviceType');
const serviceId = urlParams.get('id');
const serviceName = urlParams.get('name');
const flightId = urlParams.get('flightId');
const flightNumber = urlParams.get('flightNumber');
const basePrice = parseFloat(urlParams.get('price')) || 0;

// State management
let currentStep = 1;
let flightData = null;
let bookingData = {
    passengers: [],
    totalAmount: 0,
    paymentMethod: 'card'
};

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    // Check authentication
    checkAuthentication();
    
    const isFlight = (!!flightId || (serviceType || 'flight') === 'flight');
    
    // Load summary depending on service type
    if (isFlight) {
        if (flightId) {
            loadFlightData(flightId);
        } else {
            showNotification('No flight selected. Redirecting...', 'error');
            setTimeout(() => window.location.href = 'flights_new.html', 2000);
            return;
        }
    } else {
        // Show generic service summary
        displayServiceSummary({ type: serviceType, id: serviceId, name: serviceName, price: basePrice });
        calculateTotal(1);
    }

    // Setup event listeners
    setupEventListeners();
    
    // Initialize passenger count
    updatePassengerFields(1);
});

// Check if user is logged in
function checkAuthentication() {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const userName = document.getElementById('userName');
    
    if (user.name) {
        userName.textContent = user.name;
    }
}

// Load flight data from API
async function loadFlightData(id) {
    try {
        showSpinner();
        const response = await apiFetch(`/api/flights/${id}`);
        
        if (response.ok) {
            flightData = await response.json();
            displayFlightSummary(flightData);
            calculateTotal(1);
        } else {
            throw new Error('Flight not found');
        }
    } catch (error) {
        console.error('Error loading flight:', error);
        showNotification('Unable to load flight details', 'error');
        setTimeout(() => window.location.href = 'flights_new.html', 2000);
    } finally {
        hideSpinner();
    }
}

// Display flight summary in sidebar
function displayFlightSummary(flight) {
    document.getElementById('flightNumber').textContent = flight.flight_no || flightNumber;
    document.getElementById('fromCity').textContent = flight.from_city;
    document.getElementById('toCity').textContent = flight.to_city;
    document.getElementById('departureTime').textContent = formatTime(flight.departure);
    document.getElementById('arrivalTime').textContent = formatTime(flight.arrival);
    document.getElementById('duration').textContent = flight.duration;
    document.getElementById('travelDate').textContent = formatDate(flight.travel_date);
    document.getElementById('airline').textContent = flight.airline;
    document.getElementById('stops').textContent = flight.stops === 0 ? 'Non-stop' : `${flight.stops} stop(s)`;
    document.getElementById('baseFare').textContent = `₹${flight.price.toLocaleString()}`;
}

// Display generic service summary (non-flight)
function displayServiceSummary(svc) {
    // hide flight block, show service block
    const flightInfo = document.getElementById('flightInfo');
    const serviceInfo = document.getElementById('serviceInfo');
    if (flightInfo) flightInfo.style.display = 'none';
    if (serviceInfo) serviceInfo.style.display = 'block';

    const titleMap = {
        hotel: 'Hotel Booking',
        train: 'Train Booking',
        bus: 'Bus Booking',
        cab: 'Cab Booking',
        holiday: 'Holiday Package',
        default: 'Service Booking'
    };
    const iconMap = {
        hotel: 'fa-hotel',
        train: 'fa-train',
        bus: 'fa-bus',
        cab: 'fa-taxi',
        holiday: 'fa-umbrella-beach'
    };
    const label = titleMap[svc.type] || titleMap.default;
    const icon = iconMap[svc.type] || 'fa-concierge-bell';
    const serviceIcon = document.getElementById('serviceIcon');
    if (serviceIcon) {
        serviceIcon.className = `fas ${icon}`;
    }
    const serviceTitle = document.getElementById('serviceTitle');
    if (serviceTitle) serviceTitle.textContent = label;
    const nameEl = document.getElementById('serviceName');
    if (nameEl) nameEl.textContent = svc.name || 'Selected Service';
    const priceEl = document.getElementById('servicePrice');
    if (priceEl) priceEl.textContent = `₹${(svc.price || 0).toLocaleString('en-IN')}`;

    // Also reflect in price breakdown
    const baseFareEl = document.getElementById('baseFare');
    if (baseFareEl) baseFareEl.textContent = `₹${(svc.price || 0).toLocaleString('en-IN')}`;
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
        weekday: 'short', 
        day: 'numeric', 
        month: 'short', 
        year: 'numeric' 
    });
}

// Calculate total amount
function calculateTotal(numPassengers) {
    const baseFare = basePrice || (flightData ? flightData.price : 0);
    const subtotal = baseFare * numPassengers;
    const taxes = Math.round(subtotal * 0.12); // 12% taxes
    const total = subtotal + taxes;
    
    document.getElementById('passengerCount').textContent = `× ${numPassengers}`;
    document.getElementById('taxesFees').textContent = `₹${taxes.toLocaleString()}`;
    document.getElementById('totalAmount').textContent = `₹${total.toLocaleString()}`;
    document.getElementById('payAmount').textContent = total.toLocaleString();
    
    bookingData.totalAmount = total;
}

// Setup event listeners
function setupEventListeners() {
    // Number of passengers change
    document.getElementById('numPassengers').addEventListener('change', (e) => {
        const count = parseInt(e.target.value);
        updatePassengerFields(count);
        calculateTotal(count);
    });

    // Continue to payment
    document.getElementById('continueToPayment').addEventListener('click', validatePassengerDetails);

    // Back to details
    document.getElementById('backToDetails').addEventListener('click', () => goToStep(1));

    // Confirm booking
    document.getElementById('confirmBooking').addEventListener('click', processBooking);

    // Payment method change
    document.querySelectorAll('input[name="paymentMethod"]').forEach(radio => {
        radio.addEventListener('change', (e) => {
            bookingData.paymentMethod = e.target.value;
        });
    });

    // Card number formatting
    const cardNumber = document.getElementById('cardNumber');
    if (cardNumber) {
        cardNumber.addEventListener('input', (e) => {
            let value = e.target.value.replace(/\s/g, '');
            let formattedValue = value.match(/.{1,4}/g)?.join(' ') || value;
            e.target.value = formattedValue;
        });
    }

    // Expiry date formatting
    const expiryDate = document.getElementById('expiryDate');
    if (expiryDate) {
        expiryDate.addEventListener('input', (e) => {
            let value = e.target.value.replace(/\D/g, '');
            if (value.length >= 2) {
                value = value.slice(0, 2) + '/' + value.slice(2, 4);
            }
            e.target.value = value;
        });
    }

    // Logout
    const logoutBtn = document.getElementById('logoutBtn') || document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = 'login_new.html';
        });
    }
}

// Update passenger form fields
function updatePassengerFields(count) {
    const container = document.getElementById('passengersContainer');
    const existingCards = container.querySelectorAll('.passenger-card');
    
    // Remove excess cards
    if (existingCards.length > count) {
        for (let i = count; i < existingCards.length; i++) {
            existingCards[i].remove();
        }
    }
    
    // Add new cards
    for (let i = existingCards.length + 1; i <= count; i++) {
        const card = createPassengerCard(i, i === 1);
        container.appendChild(card);
    }
}

// Create passenger card HTML
function createPassengerCard(num, isPrimary) {
    const card = document.createElement('div');
    card.className = 'passenger-card';
    card.innerHTML = `
        <h3>Passenger ${num}${isPrimary ? ' (Primary Contact)' : ''}</h3>
        
        <div class="form-row">
            <div class="form-group">
                <label for="passenger${num}_title">Title</label>
                <select id="passenger${num}_title" name="passenger${num}_title" required>
                    <option value="">Select</option>
                    <option value="Mr">Mr</option>
                    <option value="Ms">Ms</option>
                    <option value="Mrs">Mrs</option>
                </select>
            </div>
            
            <div class="form-group flex-2">
                <label for="passenger${num}_firstName">First Name</label>
                <input type="text" id="passenger${num}_firstName" name="passenger${num}_firstName" required>
            </div>
            
            <div class="form-group flex-2">
                <label for="passenger${num}_lastName">Last Name</label>
                <input type="text" id="passenger${num}_lastName" name="passenger${num}_lastName" required>
            </div>
        </div>

        <div class="form-row">
            <div class="form-group">
                <label for="passenger${num}_age">Age</label>
                <input type="number" id="passenger${num}_age" name="passenger${num}_age" min="1" max="120" required>
            </div>
            
            ${isPrimary ? `
            <div class="form-group flex-2">
                <label for="passenger${num}_email">Email</label>
                <input type="email" id="passenger${num}_email" name="passenger${num}_email" required>
            </div>
            
            <div class="form-group flex-2">
                <label for="passenger${num}_phone">Phone</label>
                <input type="tel" id="passenger${num}_phone" name="passenger${num}_phone" pattern="[6-9]\\d{9}" placeholder="10-digit mobile" required>
            </div>
            ` : '<div class="form-group flex-2"></div><div class="form-group flex-2"></div>'}
        </div>
    `;
    return card;
}

// Validate passenger details
function validatePassengerDetails() {
    const form = document.getElementById('bookingForm');
    
    if (!form.checkValidity()) {
        form.reportValidity();
        return;
    }

    // Collect passenger data
    const numPassengers = parseInt(document.getElementById('numPassengers').value);
    bookingData.passengers = [];
    
    for (let i = 1; i <= numPassengers; i++) {
        const passenger = {
            title: document.getElementById(`passenger${i}_title`).value,
            firstName: document.getElementById(`passenger${i}_firstName`).value,
            lastName: document.getElementById(`passenger${i}_lastName`).value,
            age: parseInt(document.getElementById(`passenger${i}_age`).value)
        };
        
        // Primary passenger includes contact info
        if (i === 1) {
            passenger.email = document.getElementById('passenger1_email').value;
            passenger.phone = document.getElementById('passenger1_phone').value;
            
            // Validate email
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(passenger.email)) {
                showNotification('Please enter a valid email address', 'error');
                return;
            }
            
            // Validate phone
            const phoneRegex = /^[6-9]\d{9}$/;
            if (!phoneRegex.test(passenger.phone)) {
                showNotification('Please enter a valid 10-digit mobile number', 'error');
                return;
            }
        }
        
        bookingData.passengers.push(passenger);
    }
    
    // Go to payment step
    goToStep(2);
}

// Process booking
async function processBooking() {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const token = localStorage.getItem('token');
    
    if (!token) {
        showNotification('Please login to complete booking', 'error');
        setTimeout(() => window.location.href = 'login_new.html', 1500);
        return;
    }

    try {
        showSpinner();
        
        // Prepare booking payload
        const primaryPassenger = bookingData.passengers[0];
        const isFlight = (!!flightId || (serviceType || 'flight') === 'flight');
        let payload;
        if (isFlight) {
            payload = {
                flight_id: parseInt(flightId),
                passenger_name: `${primaryPassenger.title} ${primaryPassenger.firstName} ${primaryPassenger.lastName}`,
                passenger_email: primaryPassenger.email,
                passenger_phone: primaryPassenger.phone,
                num_passengers: bookingData.passengers.length,
                total_price: bookingData.totalAmount,
                passengers: bookingData.passengers
            };
        } else {
            payload = {
                serviceType: serviceType,
                serviceId: parseInt(serviceId),
                serviceName: serviceName,
                passengerName: `${primaryPassenger.title} ${primaryPassenger.firstName} ${primaryPassenger.lastName}`,
                passengerEmail: primaryPassenger.email,
                passengerPhone: primaryPassenger.phone,
                numPassengers: bookingData.passengers.length,
                totalPrice: bookingData.totalAmount,
                passengers: bookingData.passengers
            };
        }

        const response = await apiFetch('/api/bookings', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(payload)
        });

        if (response.ok) {
            const result = await response.json();
            displayConfirmation(result, isFlight);
            goToStep(3);
        } else {
            const error = await response.json();
            throw new Error(error.error || 'Booking failed');
        }
    } catch (error) {
        console.error('Booking error:', error);
        showNotification(error.message || 'Unable to complete booking. Please try again.', 'error');
    } finally {
        hideSpinner();
    }
}

// Display confirmation
function displayConfirmation(booking, isFlight = true) {
    document.getElementById('bookingReference').textContent = booking.booking_reference || booking.bookingReference || booking.ref || '-';
    if (isFlight && flightData) {
        document.getElementById('confFlightNumber').textContent = flightData.flight_no;
        document.getElementById('confRoute').textContent = `${flightData.from_city} → ${flightData.to_city}`;
        document.getElementById('confDate').textContent = formatDate(flightData.travel_date);
    } else {
        document.getElementById('confFlightNumber').textContent = serviceName || 'Selected Service';
        document.getElementById('confRoute').textContent = (serviceType || 'service').toUpperCase();
        document.getElementById('confDate').textContent = new Date().toLocaleDateString('en-IN');
        // Swap confirmation message for non-flight
        const msg = document.querySelector('.confirmation-section .confirmation-message');
        if (msg) msg.textContent = 'Your booking has been successfully confirmed';
    }
    document.getElementById('confPassengers').textContent = `${bookingData.passengers.length} Passenger(s)`;
    document.getElementById('confAmount').textContent = `₹${bookingData.totalAmount.toLocaleString('en-IN')}`;
}

// Go to specific step
function goToStep(step) {
    // Update progress bar
    document.querySelectorAll('.progress-step').forEach((stepEl, index) => {
        if (index + 1 < step) {
            stepEl.classList.add('completed');
            stepEl.classList.remove('active');
        } else if (index + 1 === step) {
            stepEl.classList.add('active');
            stepEl.classList.remove('completed');
        } else {
            stepEl.classList.remove('active', 'completed');
        }
    });

    // Show corresponding form
    document.querySelectorAll('.booking-form').forEach(form => form.classList.remove('active'));
    document.querySelector(`.step-${step}`).classList.add('active');
    
    currentStep = step;
    
    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
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

// Show notification (reuse from script.js if available, or define here)
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
