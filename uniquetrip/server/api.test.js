// api.test.js - Automated API Tests for MakeMyTrip Clone
const request = require('supertest');
const express = require('express');

// Test configuration
const API_BASE_URL = 'http://localhost:3000';

describe('MakeMyTrip Clone API Tests', () => {
    let authToken = '';
    let testUserId = '';
    let testBookingId = '';

    // Test 1: Health Check
    describe('GET /api/health', () => {
        it('should return server health status', async () => {
            const response = await request(API_BASE_URL)
                .get('/api/health')
                .expect(200);

            expect(response.body).toHaveProperty('success', true);
            expect(response.body).toHaveProperty('message');
        });
    });

    // Test 2: User Signup
    describe('POST /api/auth/signup', () => {
        const testUser = {
            name: 'Test User',
            email: `test${Date.now()}@example.com`,
            password: 'test123456'
        };

        it('should register a new user', async () => {
            const response = await request(API_BASE_URL)
                .post('/api/auth/signup')
                .send(testUser)
                .expect(200);

            expect(response.body).toHaveProperty('success', true);
            expect(response.body).toHaveProperty('user');
            expect(response.body.user).toHaveProperty('email', testUser.email);
            testUserId = response.body.user.id;
        });

        it('should not allow duplicate email registration', async () => {
            const response = await request(API_BASE_URL)
                .post('/api/auth/signup')
                .send(testUser)
                .expect(409);

            expect(response.body).toHaveProperty('success', false);
            expect(response.body).toHaveProperty('error');
        });
    });

    // Test 3: User Login with JWT
    describe('POST /api/auth/login', () => {
        const loginCredentials = {
            email: 'test@example.com',
            password: 'password123'
        };

        beforeAll(async () => {
            // Create a test user first
            await request(API_BASE_URL)
                .post('/api/auth/signup')
                .send({
                    name: 'Login Test User',
                    email: loginCredentials.email,
                    password: loginCredentials.password
                });
        });

        it('should login user and return JWT token', async () => {
            const response = await request(API_BASE_URL)
                .post('/api/auth/login')
                .send(loginCredentials)
                .expect(200);

            expect(response.body).toHaveProperty('success', true);
            expect(response.body).toHaveProperty('token');
            expect(response.body).toHaveProperty('user');
            authToken = response.body.token;
        });

        it('should reject invalid credentials', async () => {
            const response = await request(API_BASE_URL)
                .post('/api/auth/login')
                .send({ email: loginCredentials.email, password: 'wrongpassword' })
                .expect(401);

            expect(response.body).toHaveProperty('success', false);
        });
    });

    // Test 4: Flight Search
    describe('GET /api/flights/search', () => {
        it('should search flights with valid parameters', async () => {
            const response = await request(API_BASE_URL)
                .get('/api/flights/search?from=Mumbai&to=Delhi&date=2025-10-20')
                .expect(200);

            expect(response.body).toHaveProperty('success', true);
            expect(response.body).toHaveProperty('flights');
            expect(Array.isArray(response.body.flights)).toBe(true);
        });

        it('should return empty array for invalid route', async () => {
            const response = await request(API_BASE_URL)
                .get('/api/flights/search?from=InvalidCity&to=NoCity&date=2025-10-20')
                .expect(200);

            expect(response.body).toHaveProperty('success', true);
            expect(response.body.flights).toHaveLength(0);
        });

        it('should reject missing parameters', async () => {
            const response = await request(API_BASE_URL)
                .get('/api/flights/search?from=Mumbai')
                .expect(400);

            expect(response.body).toHaveProperty('success', false);
        });
    });

    // Test 5: Hotels Search
    describe('GET /api/hotels/search', () => {
        it('should search hotels by city', async () => {
            const response = await request(API_BASE_URL)
                .get('/api/hotels/search?city=Mumbai')
                .expect(200);

            expect(response.body).toHaveProperty('success', true);
            expect(response.body).toHaveProperty('hotels');
            expect(Array.isArray(response.body.hotels)).toBe(true);
        });
    });

    // Test 6: Trains Search
    describe('GET /api/trains/search', () => {
        it('should search trains with valid parameters', async () => {
            const response = await request(API_BASE_URL)
                .get('/api/trains/search?from=Mumbai&to=Delhi&date=2025-10-20')
                .expect(200);

            expect(response.body).toHaveProperty('success', true);
            expect(response.body).toHaveProperty('trains');
        });
    });

    // Test 7: Buses Search
    describe('GET /api/buses/search', () => {
        it('should search buses with valid parameters', async () => {
            const response = await request(API_BASE_URL)
                .get('/api/buses/search?from=Mumbai&to=Pune&date=2025-10-20')
                .expect(200);

            expect(response.body).toHaveProperty('success', true);
            expect(response.body).toHaveProperty('buses');
        });
    });

    // Test 8: Cabs Search
    describe('GET /api/cabs/search', () => {
        it('should search cabs with valid parameters', async () => {
            const response = await request(API_BASE_URL)
                .get('/api/cabs/search?from=Mumbai%20Airport&to=Mumbai%20Central')
                .expect(200);

            expect(response.body).toHaveProperty('success', true);
            expect(response.body).toHaveProperty('cabs');
        });
    });

    // Test 9: Holidays Search
    describe('GET /api/holidays/search', () => {
        it('should search holiday packages', async () => {
            const response = await request(API_BASE_URL)
                .get('/api/holidays/search?destination=Goa')
                .expect(200);

            expect(response.body).toHaveProperty('success', true);
            expect(response.body).toHaveProperty('holidays');
        });
    });

    // Test 10: Create Booking (Protected - requires JWT)
    describe('POST /api/bookings', () => {
        it('should reject booking without JWT token', async () => {
            const bookingData = {
                flightId: 1,
                passengerName: 'Test Passenger',
                passengerEmail: 'passenger@test.com',
                passengerPhone: '+91-9876543210',
                numPassengers: 1
            };

            const response = await request(API_BASE_URL)
                .post('/api/bookings')
                .send(bookingData)
                .expect(401);

            expect(response.body).toHaveProperty('success', false);
            expect(response.body).toHaveProperty('error');
        });

        it('should create booking with valid JWT token', async () => {
            // First login to get token
            const loginResponse = await request(API_BASE_URL)
                .post('/api/auth/login')
                .send({ email: 'test@example.com', password: 'password123' });

            const token = loginResponse.body.token;

            const bookingData = {
                flightId: 1,
                passengerName: 'Test Passenger',
                passengerEmail: 'passenger@test.com',
                passengerPhone: '+91-9876543210',
                numPassengers: 2
            };

            const response = await request(API_BASE_URL)
                .post('/api/bookings')
                .set('Authorization', `Bearer ${token}`)
                .send(bookingData)
                .expect(200);

            expect(response.body).toHaveProperty('success', true);
            expect(response.body).toHaveProperty('booking');
            expect(response.body.booking).toHaveProperty('bookingReference');
            testBookingId = response.body.booking.id;
        });
    });

    // Test 11: Get Bookings (Protected - requires JWT)
    describe('GET /api/bookings', () => {
        it('should reject request without JWT token', async () => {
            const response = await request(API_BASE_URL)
                .get('/api/bookings')
                .expect(401);

            expect(response.body).toHaveProperty('success', false);
        });

        it('should retrieve bookings with valid JWT token', async () => {
            // Login first
            const loginResponse = await request(API_BASE_URL)
                .post('/api/auth/login')
                .send({ email: 'test@example.com', password: 'password123' });

            const token = loginResponse.body.token;

            const response = await request(API_BASE_URL)
                .get('/api/bookings')
                .set('Authorization', `Bearer ${token}`)
                .expect(200);

            expect(response.body).toHaveProperty('success', true);
            expect(response.body).toHaveProperty('bookings');
            expect(Array.isArray(response.body.bookings)).toBe(true);
        });
    });

    // Test 12: Newsletter Subscription
    describe('POST /api/newsletter', () => {
        it('should subscribe email to newsletter', async () => {
            const response = await request(API_BASE_URL)
                .post('/api/newsletter')
                .send({ email: `newsletter${Date.now()}@test.com` })
                .expect(200);

            expect(response.body).toHaveProperty('success', true);
        });

        it('should reject invalid email', async () => {
            const response = await request(API_BASE_URL)
                .post('/api/newsletter')
                .send({ email: '' })
                .expect(400);

            expect(response.body).toHaveProperty('success', false);
        });
    });

    // Test 13: Inquiry Submission
    describe('POST /api/inquiries', () => {
        it('should submit inquiry successfully', async () => {
            const inquiryData = {
                packageName: 'Goa Beach Paradise',
                name: 'Test Inquirer',
                email: 'inquirer@test.com',
                phone: '+91-9876543210',
                message: 'I want to book this package'
            };

            const response = await request(API_BASE_URL)
                .post('/api/inquiries')
                .send(inquiryData)
                .expect(200);

            expect(response.body).toHaveProperty('success', true);
        });

        it('should reject inquiry with missing required fields', async () => {
            const response = await request(API_BASE_URL)
                .post('/api/inquiries')
                .send({ packageName: 'Test Package' })
                .expect(400);

            expect(response.body).toHaveProperty('success', false);
        });
    });
});

// Summary
console.log('\n✅ Test suite configured for MakeMyTrip Clone API');
console.log('📋 Tests cover: Auth, Flights, Hotels, Trains, Buses, Cabs, Holidays, Bookings, Newsletter, Inquiries');
console.log('🔒 JWT authentication tests included');
console.log('🚀 Run: npm test\n');
