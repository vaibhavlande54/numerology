// Manual Test Runner - Tests backend endpoints while server is running
const http = require('http');

const API_BASE_URL = 'http://localhost:3000';
let testResults = [];
let passedTests = 0;
let failedTests = 0;

// Helper function to make HTTP requests
function makeRequest(method, path, data = null, headers = {}) {
    return new Promise((resolve, reject) => {
        const url = new URL(path, API_BASE_URL);
        const options = {
            method: method,
            hostname: url.hostname,
            port: url.port,
            path: url.pathname + url.search,
            headers: {
                'Content-Type': 'application/json',
                ...headers
            }
        };

        const req = http.request(options, (res) => {
            let body = '';
            res.on('data', (chunk) => body += chunk);
            res.on('end', () => {
                try {
                    resolve({
                        status: res.statusCode,
                        body: JSON.parse(body)
                    });
                } catch (e) {
                    resolve({
                        status: res.statusCode,
                        body: body
                    });
                }
            });
        });

        req.on('error', reject);
        if (data) req.write(JSON.stringify(data));
        req.end();
    });
}

// Test runner
async function runTests() {
    console.log('\n🧪 Starting API Tests...\n');
    console.log('📍 Testing:', API_BASE_URL);
    console.log('─'.repeat(60));

    let authToken = '';

    // Test 1: Health Check
    try {
        const res = await makeRequest('GET', '/api/health');
        if (res.status === 200 && res.body.success) {
            console.log('✅ Health Check: PASSED');
            passedTests++;
        } else {
            console.log('❌ Health Check: FAILED');
            failedTests++;
        }
    } catch (err) {
        console.log('❌ Health Check: ERROR -', err.message);
        failedTests++;
    }

    // Test 2: User Signup
    try {
        const testUser = {
            name: 'Test User',
            email: `test${Date.now()}@example.com`,
            password: 'test123456'
        };
        const res = await makeRequest('POST', '/api/auth/signup', testUser);
        if (res.status === 200 && res.body.success) {
            console.log('✅ User Signup: PASSED');
            passedTests++;
        } else {
            console.log('❌ User Signup: FAILED');
            failedTests++;
        }
    } catch (err) {
        console.log('❌ User Signup: ERROR -', err.message);
        failedTests++;
    }

    // Test 3: User Login (get JWT)
    try {
        // First create a user
        const loginUser = {
            name: 'Login Test',
            email: `login${Date.now()}@example.com`,
            password: 'password123'
        };
        await makeRequest('POST', '/api/auth/signup', loginUser);

        // Now login
        const res = await makeRequest('POST', '/api/auth/login', {
            email: loginUser.email,
            password: loginUser.password
        });
        if (res.status === 200 && res.body.token) {
            authToken = res.body.token;
            console.log('✅ User Login (JWT): PASSED');
            passedTests++;
        } else {
            console.log('❌ User Login (JWT): FAILED');
            failedTests++;
        }
    } catch (err) {
        console.log('❌ User Login (JWT): ERROR -', err.message);
        failedTests++;
    }

    // Test 4: Flight Search
    try {
        const res = await makeRequest('GET', '/api/flights/search?from=Mumbai&to=Delhi&date=2025-10-20');
        if (res.status === 200 && res.body.success && Array.isArray(res.body.flights)) {
            console.log('✅ Flight Search: PASSED');
            passedTests++;
        } else {
            console.log('❌ Flight Search: FAILED');
            failedTests++;
        }
    } catch (err) {
        console.log('❌ Flight Search: ERROR -', err.message);
        failedTests++;
    }

    // Test 5: Hotels Search
    try {
        const res = await makeRequest('GET', '/api/hotels/search?city=Mumbai');
        if (res.status === 200 && res.body.success) {
            console.log('✅ Hotels Search: PASSED');
            passedTests++;
        } else {
            console.log('❌ Hotels Search: FAILED');
            failedTests++;
        }
    } catch (err) {
        console.log('❌ Hotels Search: ERROR -', err.message);
        failedTests++;
    }

    // Test 6: Trains Search
    try {
        const res = await makeRequest('GET', '/api/trains/search?from=Mumbai&to=Delhi&date=2025-10-20');
        if (res.status === 200 && res.body.success) {
            console.log('✅ Trains Search: PASSED');
            passedTests++;
        } else {
            console.log('❌ Trains Search: FAILED');
            failedTests++;
        }
    } catch (err) {
        console.log('❌ Trains Search: ERROR -', err.message);
        failedTests++;
    }

    // Test 7: Buses Search
    try {
        const res = await makeRequest('GET', '/api/buses/search?from=Mumbai&to=Pune&date=2025-10-20');
        if (res.status === 200 && res.body.success) {
            console.log('✅ Buses Search: PASSED');
            passedTests++;
        } else {
            console.log('❌ Buses Search: FAILED');
            failedTests++;
        }
    } catch (err) {
        console.log('❌ Buses Search: ERROR -', err.message);
        failedTests++;
    }

    // Test 8: Cabs Search
    try {
        const res = await makeRequest('GET', '/api/cabs/search?from=Mumbai%20Airport&to=Mumbai%20Central');
        if (res.status === 200 && res.body.success) {
            console.log('✅ Cabs Search: PASSED');
            passedTests++;
        } else {
            console.log('❌ Cabs Search: FAILED');
            failedTests++;
        }
    } catch (err) {
        console.log('❌ Cabs Search: ERROR -', err.message);
        failedTests++;
    }

    // Test 9: Holidays Search
    try {
        const res = await makeRequest('GET', '/api/holidays/search?from=Mumbai&to=Goa');
        if (res.status === 200 && res.body.success) {
            console.log('✅ Holidays Search: PASSED');
            passedTests++;
        } else {
            console.log('❌ Holidays Search: FAILED');
            failedTests++;
        }
    } catch (err) {
        console.log('❌ Holidays Search: ERROR -', err.message);
        failedTests++;
    }

    // Test 10: Booking without JWT (should fail)
    try {
        const res = await makeRequest('POST', '/api/bookings', {
            flightId: 1,
            passengerName: 'Test',
            passengerEmail: 'test@test.com',
            numPassengers: 1
        });
        if (res.status === 401) {
            console.log('✅ Booking without JWT (Protected): PASSED');
            passedTests++;
        } else {
            console.log('❌ Booking without JWT (Protected): FAILED');
            failedTests++;
        }
    } catch (err) {
        console.log('❌ Booking without JWT (Protected): ERROR -', err.message);
        failedTests++;
    }

    // Test 11: Booking with JWT (should succeed)
    if (authToken) {
        try {
            // First get a valid flight ID
            const flightsRes = await makeRequest('GET', '/api/flights');
            const flightId = flightsRes.body.flights && flightsRes.body.flights.length > 0 
                ? flightsRes.body.flights[0].id 
                : 10; // fallback to ID 10
            
            const res = await makeRequest('POST', '/api/bookings', {
                flightId: flightId,
                passengerName: 'Test Passenger',
                passengerEmail: 'passenger@test.com',
                passengerPhone: '+919876543210',
                numPassengers: 1
            }, { 'Authorization': `Bearer ${authToken}` });
            if (res.status === 200 && res.body.success) {
                console.log('✅ Booking with JWT: PASSED');
                passedTests++;
            } else {
                console.log(`❌ Booking with JWT: FAILED (Status: ${res.status}, Response: ${JSON.stringify(res.body)})`);
                failedTests++;
            }
        } catch (err) {
            console.log('❌ Booking with JWT: ERROR -', err.message);
            failedTests++;
        }
    }

    // Test 12: Newsletter Subscription
    try {
        const res = await makeRequest('POST', '/api/newsletter', {
            email: `newsletter${Date.now()}@test.com`
        });
        if (res.status === 200 && res.body.success) {
            console.log('✅ Newsletter Subscription: PASSED');
            passedTests++;
        } else {
            console.log('❌ Newsletter Subscription: FAILED');
            failedTests++;
        }
    } catch (err) {
        console.log('❌ Newsletter Subscription: ERROR -', err.message);
        failedTests++;
    }

    // Test 13: Inquiry Submission
    try {
        const res = await makeRequest('POST', '/api/inquiries', {
            packageName: 'Test Package',
            name: 'Test User',
            email: 'inquiry@test.com',
            phone: '+91-1234567890',
            message: 'Test inquiry'
        });
        if (res.status === 200 && res.body.success) {
            console.log('✅ Inquiry Submission: PASSED');
            passedTests++;
        } else {
            console.log('❌ Inquiry Submission: FAILED');
            failedTests++;
        }
    } catch (err) {
        console.log('❌ Inquiry Submission: ERROR -', err.message);
        failedTests++;
    }

    // Print summary
    console.log('─'.repeat(60));
    console.log('\n📊 Test Results:');
    console.log(`   ✅ Passed: ${passedTests}`);
    console.log(`   ❌ Failed: ${failedTests}`);
    console.log(`   📈 Success Rate: ${((passedTests / (passedTests + failedTests)) * 100).toFixed(1)}%`);
    console.log('\n✅ All tests completed!\n');
}

// Run tests
runTests().catch(err => {
    console.error('\n❌ Test suite error:', err.message);
    console.log('\n⚠️  Make sure the backend server is running on http://localhost:3000');
    process.exit(1);
});
