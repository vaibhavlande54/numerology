const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

const API_URL = 'http://localhost:3000/api';
let authToken = '';
let testUserId = '';

// Test colors
const colors = {
    reset: '\x1b[0m',
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[36m'
};

async function testBookingSystem() {
    console.log('\n🧪 Testing Multi-Service Booking System\n');
    console.log('='.repeat(60) + '\n');

    let passedTests = 0;
    let totalTests = 0;

    try {
        // Setup: Create a test user and login
        const timestamp = Date.now();
        const testEmail = `bookingtest${timestamp}@test.com`;
        
        console.log('📝 Setup: Creating test user and logging in');
        
        // Signup
        const signupRes = await fetch(`${API_URL}/auth/signup`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'x-test-bypass': 'true'
            },
            body: JSON.stringify({
                name: 'Booking Test User',
                email: testEmail,
                password: 'Test@123'
            })
        });
        
        const signupData = await signupRes.json();
        if (!signupData.success) {
            throw new Error('Failed to create test user');
        }
        
        // Login
        const loginRes = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'x-test-bypass': 'true'
            },
            body: JSON.stringify({
                email: testEmail,
                password: 'Test@123'
            })
        });
        
        const loginData = await loginRes.json();
        if (!loginData.success) {
            throw new Error('Failed to login');
        }
        
        authToken = loginData.token;
        testUserId = loginData.user.id;
        console.log(`   ✅ Test user created and logged in (ID: ${testUserId})\n`);

        // Test 1: Book a Flight
        totalTests++;
        console.log('📝 Test 1: Book a Flight');
        const flightBooking = await fetch(`${API_URL}/bookings`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`,
                'x-test-bypass': 'true'
            },
            body: JSON.stringify({
                serviceType: 'flight',
                serviceId: 1,
                serviceName: 'Mumbai to Delhi - Air India AI-101',
                passengerName: 'John Doe',
                passengerEmail: 'john@test.com',
                passengerPhone: '9876543210',
                numPassengers: 1
            })
        });
        
        const flightData = await flightBooking.json();
        if (flightData.success && flightData.booking.bookingReference) {
            console.log(`   ${colors.green}✅ PASS${colors.reset} - Flight booked successfully`);
            console.log(`   Booking Reference: ${flightData.booking.bookingReference}`);
            passedTests++;
        } else {
            console.log(`   ${colors.red}❌ FAIL${colors.reset} - Flight booking failed`);
            console.log(`   Error: ${flightData.message || JSON.stringify(flightData)}`);
        }

        // Test 2: Book a Hotel
        totalTests++;
        console.log('\n📝 Test 2: Book a Hotel');
        const hotelBooking = await fetch(`${API_URL}/bookings`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`,
                'x-test-bypass': 'true'
            },
            body: JSON.stringify({
                serviceType: 'hotel',
                serviceId: 2,
                serviceName: 'The Oberoi Mumbai',
                passengerName: 'Jane Smith',
                passengerEmail: 'jane@test.com',
                passengerPhone: '9876543211',
                numPassengers: 2
            })
        });
        
        const hotelData = await hotelBooking.json();
        if (hotelData.success && hotelData.booking.bookingReference) {
            console.log(`   ${colors.green}✅ PASS${colors.reset} - Hotel booked successfully`);
            console.log(`   Booking Reference: ${hotelData.booking.bookingReference}`);
            passedTests++;
        } else {
            console.log(`   ${colors.red}❌ FAIL${colors.reset} - Hotel booking failed`);
            console.log(`   Error: ${hotelData.message || hotelData.error || JSON.stringify(hotelData)}`);
        }

        // Test 3: Book a Train
        totalTests++;
        console.log('\n📝 Test 3: Book a Train');
        const trainBooking = await fetch(`${API_URL}/bookings`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`,
                'x-test-bypass': 'true'
            },
            body: JSON.stringify({
                serviceType: 'train',
                serviceId: 3,
                serviceName: 'Rajdhani Express 12951',
                passengerName: 'Amit Kumar',
                passengerEmail: 'amit@test.com',
                passengerPhone: '9876543212',
                numPassengers: 1
            })
        });
        
        const trainData = await trainBooking.json();
        if (trainData.success && trainData.booking.bookingReference) {
            console.log(`   ${colors.green}✅ PASS${colors.reset} - Train booked successfully`);
            console.log(`   Booking Reference: ${trainData.booking.bookingReference}`);
            passedTests++;
        } else {
            console.log(`   ${colors.red}❌ FAIL${colors.reset} - Train booking failed`);
        }

        // Test 4: Book a Bus
        totalTests++;
        console.log('\n📝 Test 4: Book a Bus');
        const busBooking = await fetch(`${API_URL}/bookings`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`,
                'x-test-bypass': 'true'
            },
            body: JSON.stringify({
                serviceType: 'bus',
                serviceId: 4,
                serviceName: 'Mumbai to Pune - Volvo AC',
                passengerName: 'Priya Sharma',
                passengerEmail: 'priya@test.com',
                passengerPhone: '9876543213',
                numPassengers: 1
            })
        });
        
        const busData = await busBooking.json();
        if (busData.success && busData.booking.bookingReference) {
            console.log(`   ${colors.green}✅ PASS${colors.reset} - Bus booked successfully`);
            console.log(`   Booking Reference: ${busData.booking.bookingReference}`);
            passedTests++;
        } else {
            console.log(`   ${colors.red}❌ FAIL${colors.reset} - Bus booking failed`);
        }

        // Test 5: Book a Cab
        totalTests++;
        console.log('\n📝 Test 5: Book a Cab');
        const cabBooking = await fetch(`${API_URL}/bookings`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`,
                'x-test-bypass': 'true'
            },
            body: JSON.stringify({
                serviceType: 'cab',
                serviceId: 5,
                serviceName: 'Airport Pickup - Sedan',
                passengerName: 'Raj Patel',
                passengerEmail: 'raj@test.com',
                passengerPhone: '9876543214',
                numPassengers: 2
            })
        });
        
        const cabData = await cabBooking.json();
        if (cabData.success && cabData.booking.bookingReference) {
            console.log(`   ${colors.green}✅ PASS${colors.reset} - Cab booked successfully`);
            console.log(`   Booking Reference: ${cabData.booking.bookingReference}`);
            passedTests++;
        } else {
            console.log(`   ${colors.red}❌ FAIL${colors.reset} - Cab booking failed`);
        }

        // Test 6: Book a Holiday Package
        totalTests++;
        console.log('\n📝 Test 6: Book a Holiday Package');
        const holidayBooking = await fetch(`${API_URL}/bookings`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`,
                'x-test-bypass': 'true'
            },
            body: JSON.stringify({
                serviceType: 'holiday',
                serviceId: 1,
                serviceName: 'Goa Beach Paradise',
                passengerName: 'Neha Gupta',
                passengerEmail: 'neha@test.com',
                passengerPhone: '9876543215',
                numPassengers: 2
            })
        });
        
        const holidayData = await holidayBooking.json();
        if (holidayData.success && holidayData.booking.bookingReference) {
            console.log(`   ${colors.green}✅ PASS${colors.reset} - Holiday package booked successfully`);
            console.log(`   Booking Reference: ${holidayData.booking.bookingReference}`);
            passedTests++;
        } else {
            console.log(`   ${colors.red}❌ FAIL${colors.reset} - Holiday booking failed`);
        }

        // Test 7: Get All Bookings
        totalTests++;
        console.log('\n📝 Test 7: Get All Bookings');
        const getBookings = await fetch(`${API_URL}/bookings`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${authToken}`,
                'x-test-bypass': 'true'
            }
        });
        
        const bookingsData = await getBookings.json();
        if (bookingsData.success && Array.isArray(bookingsData.bookings)) {
            const bookingCount = bookingsData.bookings.length;
            console.log(`   ${colors.green}✅ PASS${colors.reset} - Retrieved ${bookingCount} bookings`);
            
            // Display booking summary
            const serviceTypes = {};
            bookingsData.bookings.forEach(booking => {
                const type = booking.serviceType || 'flight';
                serviceTypes[type] = (serviceTypes[type] || 0) + 1;
            });
            
            console.log('\n   📊 Booking Summary:');
            Object.entries(serviceTypes).forEach(([type, count]) => {
                console.log(`      ${type}: ${count} booking(s)`);
            });
            
            passedTests++;
        } else {
            console.log(`   ${colors.red}❌ FAIL${colors.reset} - Failed to retrieve bookings`);
        }

        // Test 8: Booking without Authentication (should fail)
        totalTests++;
        console.log('\n📝 Test 8: Booking without Authentication (should fail)');
        const noAuthBooking = await fetch(`${API_URL}/bookings`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-test-bypass': 'true'
            },
            body: JSON.stringify({
                serviceType: 'flight',
                serviceId: 1,
                serviceName: 'Test Flight',
                passengerName: 'Test User',
                passengerEmail: 'test@test.com',
                passengerPhone: '9999999999',
                numPassengers: 1
            })
        });
        
        if (noAuthBooking.status === 401) {
            console.log(`   ${colors.green}✅ PASS${colors.reset} - Unauthorized booking correctly rejected`);
            passedTests++;
        } else {
            console.log(`   ${colors.red}❌ FAIL${colors.reset} - Unauthorized booking should fail`);
        }

        // Test 9: Booking with Invalid Service Type (should fail)
        totalTests++;
        console.log('\n📝 Test 9: Booking with Invalid Service Type (should fail)');
        const invalidServiceBooking = await fetch(`${API_URL}/bookings`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`,
                'x-test-bypass': 'true'
            },
            body: JSON.stringify({
                serviceType: 'invalid_type',
                serviceId: 1,
                serviceName: 'Test Service',
                passengerName: 'Test User',
                passengerEmail: 'test@test.com',
                passengerPhone: '9999999999',
                numPassengers: 1
            })
        });
        
        const invalidData = await invalidServiceBooking.json();
        if (!invalidData.success) {
            console.log(`   ${colors.green}✅ PASS${colors.reset} - Invalid service type correctly rejected`);
            passedTests++;
        } else {
            console.log(`   ${colors.red}❌ FAIL${colors.reset} - Invalid service type should be rejected`);
        }

        // Test 10: Booking with Missing Passenger Details (should fail)
        totalTests++;
        console.log('\n📝 Test 10: Booking with Missing Passenger Details (should fail)');
        const missingDataBooking = await fetch(`${API_URL}/bookings`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`,
                'x-test-bypass': 'true'
            },
            body: JSON.stringify({
                serviceType: 'flight',
                serviceId: 1,
                serviceName: 'Test Flight'
                // Missing passenger details
            })
        });
        
        const missingData = await missingDataBooking.json();
        if (!missingData.success) {
            console.log(`   ${colors.green}✅ PASS${colors.reset} - Missing passenger details correctly rejected`);
            passedTests++;
        } else {
            console.log(`   ${colors.red}❌ FAIL${colors.reset} - Missing passenger details should be rejected`);
        }

        // Print summary
        console.log('\n' + '='.repeat(60));
        console.log('\n📊 Test Summary:');
        console.log(`   Total Tests: ${totalTests}`);
        console.log(`   ${colors.green}✅ Passed: ${passedTests}${colors.reset}`);
        console.log(`   ${colors.red}❌ Failed: ${totalTests - passedTests}${colors.reset}`);
        console.log(`   Success Rate: ${((passedTests / totalTests) * 100).toFixed(1)}%`);

        if (passedTests === totalTests) {
            console.log(`\n🎉 All booking tests passed! Multi-service booking system works perfectly!\n`);
        } else {
            console.log(`\n⚠️  Some tests failed. Please review the errors above.\n`);
        }

    } catch (error) {
        console.error(`\n${colors.red}❌ Test execution failed:${colors.reset}`, error.message);
        process.exit(1);
    }
}

// Run the tests
testBookingSystem();
