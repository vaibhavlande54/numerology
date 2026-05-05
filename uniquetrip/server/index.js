// index.js - MakeMy Trip Clone Backend
const express = require('express');
const cors = require('cors');
const path = require('path');
const mysql = require('mysql2/promise');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const rateLimit = require('express-rate-limit');
const { body, validationResult } = require('express-validator');

// Load environment variables
require('dotenv').config();

const app = express();

// Security: Rate limiting
// Helper to skip rate limiting during automated tests
const shouldBypassRateLimit = (req) => {
    // Skip if NODE_ENV is test or explicit header is present
    const header = (req.headers['x-test-bypass'] || '').toString().toLowerCase();
    return process.env.NODE_ENV === 'test' || header === 'true' || header === '1';
};

const generalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: { success: false, error: 'Too many requests, please try again later.' },
    standardHeaders: true,
    legacyHeaders: false,
    skip: shouldBypassRateLimit,
});

const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // limit each IP to 5 auth attempts per windowMs
    message: { success: false, error: 'Too many login attempts, please try again later.' },
    skipSuccessfulRequests: true,
    skip: shouldBypassRateLimit,
});

// Apply rate limiting
app.use('/api/', generalLimiter);

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from parent directory
app.use(express.static(path.join(__dirname, '..')));

console.log('✅ Backend server starting...');

// =====================================================
// MYSQL CONNECTION
// =====================================================

const DB_CONFIG = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASS || 'user123',
    database: process.env.DB_NAME || 'makemytrip',
    port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 3306,
    multipleStatements: true
};

let pool;
let FALLBACK_MEMORY_MODE = false;

const JWT_SECRET = process.env.JWT_SECRET || 'supersecretkey';
function generateToken(user) {
    return jwt.sign({ id: user.id, email: user.email, name: user.name }, JWT_SECRET, { expiresIn: '2h' });
}
function authMiddleware(req, res, next) {
    const authHeader = req.headers['authorization'];
    if (!authHeader) return res.status(401).json({ success: false, error: 'Missing Authorization header' });
    const token = authHeader.split(' ')[1];
    if (!token) return res.status(401).json({ success: false, error: 'Missing token' });
    try {
        req.user = jwt.verify(token, JWT_SECRET);
        next();
    } catch (err) {
        return res.status(401).json({ success: false, error: 'Invalid or expired token' });
    }
}

async function initDatabase() {
    // Create connection without database to ensure DB exists
    const connection = await mysql.createConnection({
        host: DB_CONFIG.host,
        user: DB_CONFIG.user,
        password: DB_CONFIG.password
    });
    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${DB_CONFIG.database}\``);
    await connection.end();

    // Create pool for queries
    pool = mysql.createPool(DB_CONFIG);

    // Define today for all seeding operations
    const today = new Date();

    // Create tables
    await pool.query(`
        CREATE TABLE IF NOT EXISTS users (
            id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(100) NOT NULL,
            email VARCHAR(100) NOT NULL UNIQUE,
            password VARCHAR(255) NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        CREATE TABLE IF NOT EXISTS flights (
            id INT AUTO_INCREMENT PRIMARY KEY,
            from_city VARCHAR(100) NOT NULL,
            to_city VARCHAR(100) NOT NULL,
            airline VARCHAR(100) NOT NULL,
            flight_no VARCHAR(50) NOT NULL,
            departure VARCHAR(20) NOT NULL,
            arrival VARCHAR(20) NOT NULL,
            duration VARCHAR(20) NOT NULL,
            price INT NOT NULL,
            stops VARCHAR(50) NOT NULL,
            travel_date DATE NOT NULL
        );
        CREATE TABLE IF NOT EXISTS bookings (
            id INT AUTO_INCREMENT PRIMARY KEY,
            booking_reference VARCHAR(50) NOT NULL,
            flight_id INT NOT NULL,
            passenger_name VARCHAR(100) NOT NULL,
            passenger_email VARCHAR(120) NOT NULL,
            passenger_phone VARCHAR(50),
            num_passengers INT DEFAULT 1,
            total_price INT NOT NULL,
            status VARCHAR(20) DEFAULT 'confirmed',
            booked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (flight_id) REFERENCES flights(id)
        );
        CREATE TABLE IF NOT EXISTS newsletter (
            id INT AUTO_INCREMENT PRIMARY KEY,
            email VARCHAR(120) NOT NULL UNIQUE,
            subscribed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        CREATE TABLE IF NOT EXISTS inquiries (
            id INT AUTO_INCREMENT PRIMARY KEY,
            package_name VARCHAR(200) NOT NULL,
            name VARCHAR(100) NOT NULL,
            email VARCHAR(120) NOT NULL,
            phone VARCHAR(50),
            message TEXT,
            status VARCHAR(20) DEFAULT 'pending',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        CREATE TABLE IF NOT EXISTS hotels (
            id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(200) NOT NULL,
            city VARCHAR(100) NOT NULL,
            rating INT NOT NULL,
            price_per_night INT NOT NULL,
            amenities TEXT,
            image_url VARCHAR(255),
            available_from DATE NOT NULL
        );
        CREATE TABLE IF NOT EXISTS trains (
            id INT AUTO_INCREMENT PRIMARY KEY,
            from_city VARCHAR(100) NOT NULL,
            to_city VARCHAR(100) NOT NULL,
            train_name VARCHAR(100) NOT NULL,
            train_no VARCHAR(50) NOT NULL,
            departure VARCHAR(20) NOT NULL,
            arrival VARCHAR(20) NOT NULL,
            duration VARCHAR(20) NOT NULL,
            price INT NOT NULL,
            class VARCHAR(50) NOT NULL,
            travel_date DATE NOT NULL
        );
        CREATE TABLE IF NOT EXISTS buses (
            id INT AUTO_INCREMENT PRIMARY KEY,
            from_city VARCHAR(100) NOT NULL,
            to_city VARCHAR(100) NOT NULL,
            bus_operator VARCHAR(100) NOT NULL,
            bus_type VARCHAR(50) NOT NULL,
            departure VARCHAR(20) NOT NULL,
            arrival VARCHAR(20) NOT NULL,
            duration VARCHAR(20) NOT NULL,
            price INT NOT NULL,
            seats_available INT NOT NULL,
            travel_date DATE NOT NULL
        );
        CREATE TABLE IF NOT EXISTS cabs (
            id INT AUTO_INCREMENT PRIMARY KEY,
            from_location VARCHAR(100) NOT NULL,
            to_location VARCHAR(100) NOT NULL,
            cab_type VARCHAR(50) NOT NULL,
            price INT NOT NULL,
            duration VARCHAR(20) NOT NULL,
            distance VARCHAR(20) NOT NULL,
            available_date DATE NOT NULL
        );
        CREATE TABLE IF NOT EXISTS holidays (
            id INT AUTO_INCREMENT PRIMARY KEY,
            package_name VARCHAR(200) NOT NULL,
            from_city VARCHAR(100) NOT NULL,
            destination VARCHAR(100) NOT NULL,
            duration_days INT NOT NULL,
            price INT NOT NULL,
            inclusions TEXT,
            departure_date DATE NOT NULL
        );
    `);

    // Seed flights if empty
    const [rows] = await pool.query('SELECT COUNT(*) as count FROM flights');
    if (rows[0].count === 0) {
        console.log('🟡 Seeding flights table with sample data...');
        
        // Create flights for the next 30 days
        const flights = [];
        
        for (let dayOffset = 0; dayOffset < 30; dayOffset++) {
            const date = new Date(today);
            date.setDate(today.getDate() + dayOffset);
            const dateStr = date.toISOString().split('T')[0];
            
            // Mumbai-Delhi
            flights.push(['Mumbai','Delhi','Air India','AI-202','08:30 AM','10:45 AM','2h 15m',5450,'Non-stop',dateStr]);
            flights.push(['Mumbai','Delhi','IndiGo','6E-345','11:00 AM','01:30 PM','2h 30m',4890,'Non-stop',dateStr]);
            // Mumbai-Goa
            flights.push(['Mumbai','Goa','SpiceJet','SG-789','09:15 AM','10:30 AM','1h 15m',3250,'Non-stop',dateStr]);
            flights.push(['Mumbai','Goa','Vistara','UK-567','02:15 PM','03:45 PM','1h 30m',4200,'Non-stop',dateStr]);
            // Delhi-Goa
            flights.push(['Delhi','Goa','IndiGo','6E-789','10:00 AM','01:15 PM','3h 15m',5890,'Non-stop',dateStr]);
            flights.push(['Delhi','Goa','Vistara','UK-890','04:45 PM','08:00 PM','3h 15m',6200,'Non-stop',dateStr]);
            // Bengaluru-Delhi
            flights.push(['Bengaluru','Delhi','Vistara','UK-234','06:30 AM','09:15 AM','2h 45m',5600,'Non-stop',dateStr]);
            flights.push(['Bengaluru','Delhi','SpiceJet','SG-678','01:00 PM','03:45 PM','2h 45m',5100,'Non-stop',dateStr]);
            // Goa-Mumbai
            flights.push(['Goa','Mumbai','SpiceJet','SG-901','11:30 AM','12:45 PM','1h 15m',3100,'Non-stop',dateStr]);
            // Delhi-Mumbai
            flights.push(['Delhi','Mumbai','Air India','AI-301','06:00 AM','08:15 AM','2h 15m',5200,'Non-stop',dateStr]);
            flights.push(['Delhi','Mumbai','SpiceJet','SG-456','03:00 PM','05:30 PM','2h 30m',4650,'Non-stop',dateStr]);
        }
        
        await pool.query(
            `INSERT INTO flights (from_city, to_city, airline, flight_no, departure, arrival, duration, price, stops, travel_date)
             VALUES ?`, [flights]
        );
        console.log(`✅ Flights seeded: ${flights.length} flights for next 30 days`);
    }

    // Seed hotels if empty
    const [hotelRows] = await pool.query('SELECT COUNT(*) as count FROM hotels');
    if (hotelRows[0].count === 0) {
        console.log('🟡 Seeding hotels table with sample data...');
        const hotels = [
            ['Taj Palace', 'Delhi', 5, 8500, 'Luxury Room, Free WiFi, Pool, Spa, Restaurant', null, today.toISOString().split('T')[0]],
            ['The Leela', 'Mumbai', 5, 7200, 'Deluxe Suite, Ocean View, Gym, Free Breakfast', null, today.toISOString().split('T')[0]],
            ['ITC Grand Chola', 'Chennai', 5, 6800, 'Executive Room, Business Center, Pool, Bar', null, today.toISOString().split('T')[0]],
            ['Hyatt Regency', 'Bengaluru', 4, 4500, 'Standard Room, WiFi, Parking, Restaurant', null, today.toISOString().split('T')[0]],
            ['Oberoi Udaivilas', 'Udaipur', 5, 12000, 'Lake View Suite, Royal Experience, Butler Service', null, today.toISOString().split('T')[0]],
            ['JW Marriott', 'Pune', 5, 5800, 'Premium Room, Pool, Gym, Spa', null, today.toISOString().split('T')[0]],
            ['Radisson Blu', 'Goa', 4, 5200, 'Beach View, Pool, Restaurant, WiFi', null, today.toISOString().split('T')[0]],
            ['The Ritz-Carlton', 'Bengaluru', 5, 9500, 'Club Room, Lounge Access, Fine Dining', null, today.toISOString().split('T')[0]],
        ];
        await pool.query(
            `INSERT INTO hotels (name, city, rating, price_per_night, amenities, image_url, available_from) VALUES ?`, [hotels]
        );
        console.log(`✅ Hotels seeded: ${hotels.length} hotels`);
    }

    // Seed trains if empty
    const [trainRows] = await pool.query('SELECT COUNT(*) as count FROM trains');
    if (trainRows[0].count === 0) {
        console.log('🟡 Seeding trains table with sample data...');
        const trains = [];
        for (let dayOffset = 0; dayOffset < 30; dayOffset++) {
            const date = new Date(today);
            date.setDate(today.getDate() + dayOffset);
            const dateStr = date.toISOString().split('T')[0];
            trains.push(['Mumbai', 'Delhi', 'Rajdhani Express', '12951', '16:55', '08:35', '15h 40m', 2500, 'AC 3-Tier', dateStr]);
            trains.push(['Delhi', 'Mumbai', 'August Kranti Rajdhani', '12953', '16:35', '09:15', '16h 40m', 2600, 'AC 2-Tier', dateStr]);
            trains.push(['Mumbai', 'Bengaluru', 'Udyan Express', '11301', '08:05', '21:55', '13h 50m', 1800, 'AC 3-Tier', dateStr]);
            trains.push(['Delhi', 'Kolkata', 'Rajdhani Express', '12301', '16:55', '10:05', '17h 10m', 2800, 'AC 2-Tier', dateStr]);
            trains.push(['Chennai', 'Delhi', 'Tamil Nadu Express', '12621', '22:30', '07:05', '32h 35m', 2200, 'AC 3-Tier', dateStr]);
        }
        await pool.query(
            `INSERT INTO trains (from_city, to_city, train_name, train_no, departure, arrival, duration, price, class, travel_date) VALUES ?`, [trains]
        );
        console.log(`✅ Trains seeded: ${trains.length} trains for next 30 days`);
    }

    // Seed buses if empty
    const [busRows] = await pool.query('SELECT COUNT(*) as count FROM buses');
    if (busRows[0].count === 0) {
        console.log('🟡 Seeding buses table with sample data...');
        const buses = [];
        for (let dayOffset = 0; dayOffset < 30; dayOffset++) {
            const date = new Date(today);
            date.setDate(today.getDate() + dayOffset);
            const dateStr = date.toISOString().split('T')[0];
            buses.push(['Mumbai', 'Pune', 'Shivneri Travels', 'AC Sleeper', '23:30', '03:00', '3h 30m', 650, 35, dateStr]);
            buses.push(['Delhi', 'Jaipur', 'RSRTC', 'Volvo AC', '06:00', '11:30', '5h 30m', 850, 40, dateStr]);
            buses.push(['Bengaluru', 'Chennai', 'VRL Travels', 'AC Semi-Sleeper', '22:00', '05:30', '7h 30m', 950, 38, dateStr]);
            buses.push(['Hyderabad', 'Vijayawada', 'Orange Travels', 'Non-AC Seater', '07:00', '12:00', '5h', 450, 45, dateStr]);
            buses.push(['Pune', 'Goa', 'Paulo Travels', 'AC Sleeper', '21:00', '08:00', '11h', 1200, 30, dateStr]);
        }
        await pool.query(
            `INSERT INTO buses (from_city, to_city, bus_operator, bus_type, departure, arrival, duration, price, seats_available, travel_date) VALUES ?`, [buses]
        );
        console.log(`✅ Buses seeded: ${buses.length} buses for next 30 days`);
    }

    // Seed cabs if empty
    const [cabRows] = await pool.query('SELECT COUNT(*) as count FROM cabs');
    if (cabRows[0].count === 0) {
        console.log('🟡 Seeding cabs table with sample data...');
        const cabs = [];
        for (let dayOffset = 0; dayOffset < 30; dayOffset++) {
            const date = new Date(today);
            date.setDate(today.getDate() + dayOffset);
            const dateStr = date.toISOString().split('T')[0];
            cabs.push(['Mumbai Airport', 'Mumbai Central', 'Sedan', 450, '45 mins', '25 km', dateStr]);
            cabs.push(['Delhi Airport', 'Connaught Place', 'SUV', 850, '1 hour', '20 km', dateStr]);
            cabs.push(['Bengaluru Airport', 'MG Road', 'Hatchback', 650, '1.5 hours', '40 km', dateStr]);
            cabs.push(['Chennai Airport', 'T Nagar', 'Sedan', 550, '50 mins', '15 km', dateStr]);
        }
        await pool.query(
            `INSERT INTO cabs (from_location, to_location, cab_type, price, duration, distance, available_date) VALUES ?`, [cabs]
        );
        console.log(`✅ Cabs seeded: ${cabs.length} cab options`);
    }

    // Seed holidays if empty
    const [holidayRows] = await pool.query('SELECT COUNT(*) as count FROM holidays');
    if (holidayRows[0].count === 0) {
        console.log('🟡 Seeding holidays table with sample data...');
        const holidays = [];
        for (let dayOffset = 7; dayOffset < 60; dayOffset += 7) {
            const date = new Date(today);
            date.setDate(today.getDate() + dayOffset);
            const dateStr = date.toISOString().split('T')[0];
            holidays.push(['Goa Beach Paradise', 'Mumbai', 'Goa', 5, 15000, 'Flights, Hotel, Breakfast, Sightseeing', dateStr]);
            holidays.push(['Rajasthan Royal Tour', 'Delhi', 'Jaipur-Udaipur', 7, 25000, 'Flights, Hotels, Meals, Guided Tours', dateStr]);
            holidays.push(['Kerala Backwaters', 'Bengaluru', 'Kerala', 6, 22000, 'Flights, Houseboat, Hotel, Meals', dateStr]);
            holidays.push(['Himalayan Adventure', 'Delhi', 'Manali', 5, 18000, 'Transport, Hotel, Adventure Activities', dateStr]);
        }
        await pool.query(
            `INSERT INTO holidays (package_name, from_city, destination, duration_days, price, inclusions, departure_date) VALUES ?`, [holidays]
        );
        console.log(`✅ Holidays seeded: ${holidays.length} holiday packages`);
    }
}

console.log('✅ Backend server starting...');

// =====================================================
// IN-MEMORY DATA STORES (Replace with database later)
// =====================================================

// In MySQL mode, no in-memory stores

// =====================================================
// API ROUTES
// =====================================================

// Health check
app.get('/api/health', (req, res) => {
    res.json({ 
        success: true,
        status: 'healthy', 
        message: 'MakeMy Trip Clone Backend is running!',
        timestamp: new Date().toISOString()
    });
});

// =====================================================
// FLIGHT ROUTES
// =====================================================

// Search flights
app.get('/api/flights/search', async (req, res) => {
    const { from, to, date } = req.query;
    if (!from || !to) {
        return res.status(400).json({ success: false, error: 'from and to are required' });
    }
    if (FALLBACK_MEMORY_MODE) {
        const fromLower = from.toLowerCase().trim();
        const toLower = to.toLowerCase().trim();
        let results = flightsDatabase.filter(f => f.from.toLowerCase() === fromLower && f.to.toLowerCase() === toLower);
        if (date) {
            results = results.filter(f => f.date === date);
        }
        return res.json({ success: true, count: results.length, from, to, date: date || 'Any', flights: results });
    }
    try {
        const params = [from, to];
        let query = `SELECT id, from_city, to_city, airline, flight_no AS flight, departure, arrival, duration, price, stops, travel_date
                     FROM flights WHERE LOWER(from_city)=LOWER(?) AND LOWER(to_city)=LOWER(?)`;
        if (date) {
            query += ' AND travel_date = ?';
            params.push(date);
        }
        const [rows] = await pool.query(query, params);
        const flights = rows.map(r => ({
            id: r.id,
            from: r.from_city,
            to: r.to_city,
            airline: r.airline,
            flight: r.flight,
            departure: r.departure,
            arrival: r.arrival,
            duration: r.duration,
            price: r.price,
            stops: r.stops,
            date: r.travel_date
        }));
        res.json({ success: true, count: flights.length, from, to, date: date || 'Any', flights });
    } catch (err) {
        console.error('Search error:', err);
        res.status(500).json({ success: false, error: 'Server error' });
    }
});

// Get all flights (for admin/testing)
app.get('/api/flights', async (req, res) => {
    try {
        if (FALLBACK_MEMORY_MODE) {
            return res.json({ success: true, count: flightsDatabase.length, flights: flightsDatabase });
        }
        const [rows] = await pool.query(`SELECT id, from_city, to_city, airline, flight_no AS flight, departure, arrival, duration, price, stops, travel_date FROM flights`);
        const flights = rows.map(r => ({
            id: r.id,
            from: r.from_city,
            to: r.to_city,
            airline: r.airline,
            flight: r.flight,
            departure: r.departure,
            arrival: r.arrival,
            duration: r.duration,
            price: r.price,
            stops: r.stops,
            date: r.travel_date
        }));
        res.json({ success: true, count: flights.length, flights });
    } catch (err) {
        console.error('Get flights error:', err);
        res.status(500).json({ success: false, error: 'Server error' });
    }
});

// Get flight by ID
app.get('/api/flights/:id', async (req, res) => {
    try {
        if (FALLBACK_MEMORY_MODE) {
            const id = parseInt(req.params.id);
            const flight = flightsDatabase.find(f => f.id === id);
            if (!flight) return res.status(404).json({ success: false, error: 'Flight not found' });
            return res.json({ success: true, flight });
        }
        const [rows] = await pool.query(`SELECT id, from_city, to_city, airline, flight_no AS flight, departure, arrival, duration, price, stops, travel_date FROM flights WHERE id = ?`, [req.params.id]);
        if (rows.length === 0) return res.status(404).json({ success: false, error: 'Flight not found' });
        const r = rows[0];
        const flight = {
            id: r.id,
            from: r.from_city,
            to: r.to_city,
            airline: r.airline,
            flight: r.flight,
            departure: r.departure,
            arrival: r.arrival,
            duration: r.duration,
            price: r.price,
            stops: r.stops,
            date: r.travel_date
        };
        res.json({ success: true, flight });
    } catch (err) {
        console.error('Get flight error:', err);
        res.status(500).json({ success: false, error: 'Server error' });
    }
});

// =====================================================
// HOTELS ROUTES
// =====================================================

// Search hotels
app.get('/api/hotels/search', async (req, res) => {
    const { city, checkin } = req.query;
    if (!city) {
        return res.status(400).json({ success: false, error: 'city is required' });
    }
    try {
        const params = [city];
        let query = `SELECT id, name, city, rating, price_per_night AS price, amenities, image_url, available_from 
                     FROM hotels WHERE LOWER(city)=LOWER(?)`;
        if (checkin) {
            query += ' AND available_from <= ?';
            params.push(checkin);
        }
        const [rows] = await pool.query(query, params);
        const hotels = rows.map(r => ({
            id: r.id,
            name: r.name,
            city: r.city,
            rating: r.rating,
            price: r.price,
            amenities: r.amenities,
            imageUrl: r.image_url,
            availableFrom: r.available_from
        }));
        res.json({ success: true, count: hotels.length, city, hotels });
    } catch (err) {
        console.error('Hotels search error:', err);
        res.status(500).json({ success: false, error: 'Server error' });
    }
});

// =====================================================
// TRAINS ROUTES
// =====================================================

// Search trains
app.get('/api/trains/search', async (req, res) => {
    const { from, to, date } = req.query;
    if (!from || !to) {
        return res.status(400).json({ success: false, error: 'from and to are required' });
    }
    try {
        const params = [from, to];
        let query = `SELECT id, from_city, to_city, train_name, train_no, departure, arrival, duration, price, class, travel_date
                     FROM trains WHERE LOWER(from_city)=LOWER(?) AND LOWER(to_city)=LOWER(?)`;
        if (date) {
            query += ' AND travel_date = ?';
            params.push(date);
        }
        const [rows] = await pool.query(query, params);
        const trains = rows.map(r => ({
            id: r.id,
            from: r.from_city,
            to: r.to_city,
            name: r.train_name,
            trainNo: r.train_no,
            departure: r.departure,
            arrival: r.arrival,
            duration: r.duration,
            price: r.price,
            class: r.class,
            date: r.travel_date
        }));
        res.json({ success: true, count: trains.length, from, to, date: date || 'Any', trains });
    } catch (err) {
        console.error('Trains search error:', err);
        res.status(500).json({ success: false, error: 'Server error' });
    }
});

// =====================================================
// BUSES ROUTES
// =====================================================

// Search buses
app.get('/api/buses/search', async (req, res) => {
    const { from, to, date } = req.query;
    if (!from || !to) {
        return res.status(400).json({ success: false, error: 'from and to are required' });
    }
    try {
        const params = [from, to];
        let query = `SELECT id, from_city, to_city, bus_operator, bus_type, departure, arrival, duration, price, seats_available, travel_date
                     FROM buses WHERE LOWER(from_city)=LOWER(?) AND LOWER(to_city)=LOWER(?)`;
        if (date) {
            query += ' AND travel_date = ?';
            params.push(date);
        }
        const [rows] = await pool.query(query, params);
        const buses = rows.map(r => ({
            id: r.id,
            from: r.from_city,
            to: r.to_city,
            operator: r.bus_operator,
            busType: r.bus_type,
            departure: r.departure,
            arrival: r.arrival,
            duration: r.duration,
            price: r.price,
            seatsAvailable: r.seats_available,
            date: r.travel_date
        }));
        res.json({ success: true, count: buses.length, from, to, date: date || 'Any', buses });
    } catch (err) {
        console.error('Buses search error:', err);
        res.status(500).json({ success: false, error: 'Server error' });
    }
});

// =====================================================
// CABS ROUTES
// =====================================================

// Search cabs
app.get('/api/cabs/search', async (req, res) => {
    const { from, to, date } = req.query;
    if (!from || !to) {
        return res.status(400).json({ success: false, error: 'from and to are required' });
    }
    try {
        const params = [from, to];
        let query = `SELECT id, from_location, to_location, cab_type, price, duration, distance, available_date
                     FROM cabs WHERE LOWER(from_location) LIKE LOWER(?) AND LOWER(to_location) LIKE LOWER(?)`;
        if (date) {
            query += ' AND available_date = ?';
            params.push(date);
        }
        const [rows] = await pool.query(query, params.map((p, i) => i < 2 ? `%${p}%` : p));
        const cabs = rows.map(r => ({
            id: r.id,
            from: r.from_location,
            to: r.to_location,
            cabType: r.cab_type,
            price: r.price,
            duration: r.duration,
            distance: r.distance,
            date: r.available_date
        }));
        res.json({ success: true, count: cabs.length, from, to, date: date || 'Any', cabs });
    } catch (err) {
        console.error('Cabs search error:', err);
        res.status(500).json({ success: false, error: 'Server error' });
    }
});

// =====================================================
// HOLIDAYS ROUTES
// =====================================================

// Search holiday packages
app.get('/api/holidays/search', async (req, res) => {
    const { from, to, date } = req.query;
    if (!from || !to) {
        return res.status(400).json({ success: false, error: 'from and to are required' });
    }
    try {
        const params = [from, to];
        let query = `SELECT id, package_name, from_city, destination, duration_days, price, inclusions, departure_date
                     FROM holidays WHERE LOWER(from_city)=LOWER(?) AND LOWER(destination) LIKE LOWER(?)`;
        if (date) {
            query += ' AND departure_date = ?';
            params.push(date);
        }
        const [rows] = await pool.query(query, params.map((p, i) => i === 1 ? `%${p}%` : p));
        const holidays = rows.map(r => ({
            id: r.id,
            name: r.package_name,
            from: r.from_city,
            destination: r.destination,
            durationDays: r.duration_days,
            price: r.price,
            inclusions: r.inclusions,
            date: r.departure_date
        }));
        res.json({ success: true, count: holidays.length, from, to, date: date || 'Any', holidays });
    } catch (err) {
        console.error('Holidays search error:', err);
        res.status(500).json({ success: false, error: 'Server error' });
    }
});

// =====================================================
// BOOKING ROUTES
// =====================================================

// Create a booking
app.post('/api/bookings', 
    authMiddleware,
    [
        body('serviceType').optional().isIn(['flight', 'hotel', 'train', 'bus', 'cab', 'holiday']).withMessage('Invalid service type'),
        body('serviceId').optional().isInt({ min: 1 }).withMessage('Valid service ID required'),
        body('serviceName').optional().trim().isLength({ min: 1 }).withMessage('Service name required'),
        body('flightId').optional().isInt({ min: 1 }).withMessage('Valid flight ID required'),
        body('passengerName').trim().isLength({ min: 2, max: 100 }).withMessage('Passenger name must be 2-100 characters'),
        body('passengerEmail').isEmail().normalizeEmail().withMessage('Valid email required'),
        body('passengerPhone').optional().matches(/^[\+]?[0-9]{10,15}$/).withMessage('Valid phone number required'),
        body('numPassengers').optional().isInt({ min: 1, max: 9 }).withMessage('Number of passengers must be 1-9')
    ],
    async (req, res) => {
        // Validate input
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ success: false, error: errors.array()[0].msg });
        }

        const { serviceType, serviceId, serviceName, flightId, passengerName, passengerEmail, passengerPhone, numPassengers } = req.body;
        const finalServiceType = serviceType || 'flight';
        const finalServiceId = serviceId || flightId;
        
        // Require either serviceId or flightId
        if (!finalServiceId) {
            return res.status(400).json({ success: false, error: 'Service ID or Flight ID required' });
        }
        
        if (FALLBACK_MEMORY_MODE) {
            // In fallback mode, accept any service type with a default price
            const defaultPrice = 5000; // Default price if service not found
            let servicePrice = defaultPrice;
            let serviceInfo = serviceName || `${finalServiceType} Service`;
            
            // Try to find in relevant database, but don't fail if not found
            if (finalServiceType === 'flight') {
                const flight = flightsDatabase.find(f => f.id === parseInt(finalServiceId));
                if (flight) {
                    servicePrice = flight.price;
                    serviceInfo = `${flight.airline} ${flight.flightNumber}`;
                }
            }
            
            const total = servicePrice * (numPassengers || 1);
            const ref = 'MMT-' + Date.now();
            const booking = {
                id: bookings.length + 1,
                bookingReference: ref,
                serviceType: finalServiceType,
                serviceId: finalServiceId,
                serviceName: serviceName || serviceInfo,
                flightId: finalServiceType === 'flight' ? finalServiceId : null,
                passengerName,
                passengerEmail,
                passengerPhone: passengerPhone || null,
                numPassengers: numPassengers || 1,
                totalPrice: total,
                status: 'confirmed',
                bookedAt: new Date().toISOString()
            };
            bookings.push(booking);
            return res.json({ success: true, message: 'Booking created successfully', booking });
        }
        
        try {
            // Get service price based on service type
            let price = 5000; // Default price
            let serviceInfo = serviceName || `${finalServiceType} Service`;
            
            // Try to get price from appropriate table
            const tableMap = {
                'flight': 'flights',
                'hotel': 'hotels',
                'train': 'trains',
                'bus': 'buses',
                'cab': 'cabs',
                'holiday': 'holidays'
            };
            
            const tableName = tableMap[finalServiceType] || 'flights';
            
            try {
                const [rows] = await pool.query(`SELECT price FROM ${tableName} WHERE id = ? LIMIT 1`, [finalServiceId]);
                if (rows.length > 0) {
                    price = rows[0].price;
                }
            } catch (err) {
                // Table might not exist or other error, use default price
                console.log(`Could not fetch price from ${tableName}, using default`);
            }
            
            const total = price * (numPassengers || 1);
            const ref = 'MMT-' + Date.now();
            
            try {
                // Only set flight_id if it's actually a flight booking
                const dbFlightId = (finalServiceType === 'flight') ? finalServiceId : null;
                
                const [result] = await pool.query(
                    `INSERT INTO bookings (booking_reference, flight_id, service_type, service_id, service_name, passenger_name, passenger_email, passenger_phone, num_passengers, total_price)
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                    [ref, dbFlightId, finalServiceType, finalServiceId, serviceName || serviceInfo, passengerName, passengerEmail, passengerPhone || null, numPassengers || 1, total]
                );
                const booking = {
                    id: result.insertId,
                    bookingReference: ref,
                    serviceType: finalServiceType,
                    serviceId: finalServiceId,
                    serviceName: serviceName || serviceInfo,
                    flightId: dbFlightId,
                    passengerName,
                    passengerEmail,
                    passengerPhone: passengerPhone || null,
                    numPassengers: numPassengers || 1,
                    totalPrice: total,
                    status: 'confirmed',
                    bookedAt: new Date().toISOString()
                };
                res.json({ success: true, message: 'Booking created successfully', booking });
            } catch (insertErr) {
                console.error('Database INSERT error:', insertErr.message);
                res.status(500).json({ success: false, error: 'Database error: ' + insertErr.message });
            }
        } catch (err) {
            console.error('Booking error:', err);
            res.status(500).json({ success: false, error: 'Server error: ' + err.message });
        }
    }
);

// Get all bookings
app.get('/api/bookings', authMiddleware, async (req, res) => {
    try {
        const { email } = req.query;
        if (FALLBACK_MEMORY_MODE) {
            let results = bookings;
            if (email) results = bookings.filter(b => b.passengerEmail.toLowerCase() === email.toLowerCase());
            return res.json({ success: true, count: results.length, bookings: results });
        }
        let query = 'SELECT * FROM bookings';
        const params = [];
        if (email) {
            query += ' WHERE LOWER(passenger_email) = LOWER(?)';
            params.push(email);
        }
        const [rows] = await pool.query(query, params);
        const normalized = rows.map(r => ({
            id: r.id,
            bookingReference: r.booking_reference,
            booking_reference: r.booking_reference,
            serviceType: r.service_type || 'flight',
            serviceId: r.service_id || r.flight_id,
            serviceName: r.service_name || `Service #${r.service_id || r.flight_id}`,
            flightId: r.flight_id,
            passengerName: r.passenger_name,
            passenger_name: r.passenger_name,
            passengerEmail: r.passenger_email,
            passenger_email: r.passenger_email,
            passengerPhone: r.passenger_phone,
            passenger_phone: r.passenger_phone,
            numPassengers: r.num_passengers,
            num_passengers: r.num_passengers,
            totalPrice: r.total_price,
            total_price: r.total_price,
            status: r.status,
            bookedAt: r.booked_at,
            booked_at: r.booked_at
        }));
        res.json({ success: true, count: normalized.length, bookings: normalized });
    } catch (err) {
        console.error('Get bookings error:', err);
        res.status(500).json({ success: false, error: 'Server error' });
    }
});

// Get booking by ID
app.get('/api/bookings/:id', async (req, res) => {
    try {
        if (FALLBACK_MEMORY_MODE) {
            const id = parseInt(req.params.id);
            const booking = bookings.find(b => b.id === id);
            if (!booking) return res.status(404).json({ success: false, error: 'Booking not found' });
            return res.json({ success: true, booking });
        }
        const [rows] = await pool.query('SELECT * FROM bookings WHERE id = ?', [req.params.id]);
        if (rows.length === 0) return res.status(404).json({ success: false, error: 'Booking not found' });
        const r = rows[0];
        const booking = {
            id: r.id,
            bookingReference: r.booking_reference,
            flightId: r.flight_id,
            passengerName: r.passenger_name,
            passengerEmail: r.passenger_email,
            passengerPhone: r.passenger_phone,
            numPassengers: r.num_passengers,
            totalPrice: r.total_price,
            status: r.status,
            bookedAt: r.booked_at
        };
        res.json({ success: true, booking });
    } catch (err) {
        console.error('Get booking error:', err);
        res.status(500).json({ success: false, error: 'Server error' });
    }
});

// Cancel booking
app.delete('/api/bookings/:id', async (req, res) => {
    try {
        if (FALLBACK_MEMORY_MODE) {
            const id = parseInt(req.params.id);
            const idx = bookings.findIndex(b => b.id === id);
            if (idx === -1) return res.status(404).json({ success: false, error: 'Booking not found' });
            bookings[idx].status = 'cancelled';
            return res.json({ success: true, message: 'Booking cancelled successfully', booking: bookings[idx] });
        }
        const [rows] = await pool.query('UPDATE bookings SET status = ? WHERE id = ?', ['cancelled', req.params.id]);
        if (rows.affectedRows === 0) return res.status(404).json({ success: false, error: 'Booking not found' });
        const [updated] = await pool.query('SELECT * FROM bookings WHERE id = ?', [req.params.id]);
        const r = updated[0];
        const booking = {
            id: r.id,
            bookingReference: r.booking_reference,
            flightId: r.flight_id,
            passengerName: r.passenger_name,
            passengerEmail: r.passenger_email,
            passengerPhone: r.passenger_phone,
            numPassengers: r.num_passengers,
            totalPrice: r.total_price,
            status: r.status,
            bookedAt: r.booked_at
        };
        res.json({ success: true, message: 'Booking cancelled successfully', booking });
    } catch (err) {
        console.error('Cancel booking error:', err);
        res.status(500).json({ success: false, error: 'Server error' });
    }
});

// =====================================================
// USER ROUTES (Secure authentication with bcrypt)
// =====================================================

// Register user
app.post('/api/auth/signup', 
    authLimiter,
    [
        body('name').exists({ checkFalsy: true }).withMessage('Name is required')
            .bail()
            .trim().isLength({ min: 2, max: 100 }).withMessage('Name must be 2-100 characters'),
        body('email').exists({ checkFalsy: true }).withMessage('Email is required')
            .bail()
            .isEmail().withMessage('Valid email required')
            .bail()
            .normalizeEmail(),
        body('password').exists({ checkFalsy: true }).withMessage('Password is required')
            .bail()
            .isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
    ],
    async (req, res) => {
        // Validate input
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ success: false, error: errors.array()[0].msg });
        }

        const { name, email, password } = req.body;
        
        if (FALLBACK_MEMORY_MODE) {
            const existing = users.find(u => u.email.toLowerCase() === email.toLowerCase());
            if (existing) return res.status(409).json({ success: false, error: 'Email already registered' });
            
            // Hash password with bcrypt
            const hashedPassword = await bcrypt.hash(password, 10);
            const user = { 
                id: users.length + 1, 
                name, 
                email, 
                password: hashedPassword, 
                createdAt: new Date().toISOString() 
            };
            users.push(user);
            return res.status(201).json({ success: true, message: 'User registered successfully', user: { id: user.id, name, email } });
        }
        
        try {
            // Check if email already exists
            const [existing] = await pool.query('SELECT id FROM users WHERE LOWER(email) = LOWER(?)', [email]);
            if (existing.length > 0) {
                return res.status(409).json({ success: false, error: 'Email already registered' });
            }
            
            // Hash password with bcrypt (10 salt rounds)
            const hashedPassword = await bcrypt.hash(password, 10);
            
            // Insert user with hashed password
            const [result] = await pool.query(
                'INSERT INTO users (name, email, password) VALUES (?, ?, ?)', 
                [name, email, hashedPassword]
            );
            
            res.status(201).json({ 
                success: true, 
                message: 'User registered successfully', 
                user: { id: result.insertId, name, email } 
            });
        } catch (err) {
            console.error('Signup error:', err);
            res.status(500).json({ success: false, error: 'Server error' });
        }
    }
);

// Login user
app.post('/api/auth/login',
    authLimiter,
    [
        body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
        body('password').notEmpty().withMessage('Password is required')
    ],
    async (req, res) => {
        // Validate input
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ success: false, error: errors.array()[0].msg });
        }

        const { email, password } = req.body;
        let user;
        
        if (FALLBACK_MEMORY_MODE) {
            user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
            if (!user) {
                return res.status(401).json({ success: false, error: 'Invalid email or password' });
            }
            
            // Compare password with bcrypt
            const isValidPassword = await bcrypt.compare(password, user.password);
            if (!isValidPassword) {
                return res.status(401).json({ success: false, error: 'Invalid email or password' });
            }
        } else {
            try {
                // Fetch user with password hash
                const [rows] = await pool.query(
                    'SELECT id, name, email, password FROM users WHERE LOWER(email)=LOWER(?)', 
                    [email]
                );
                
                if (rows.length === 0) {
                    return res.status(401).json({ success: false, error: 'Invalid email or password' });
                }
                
                user = rows[0];
                
                // Compare password with bcrypt
                const isValidPassword = await bcrypt.compare(password, user.password);
                if (!isValidPassword) {
                    return res.status(401).json({ success: false, error: 'Invalid email or password' });
                }
                
                // Remove password from user object
                delete user.password;
                
            } catch (err) {
                console.error('Login error:', err);
                return res.status(500).json({ success: false, error: 'Server error' });
            }
        }
        
        // Issue JWT
        const token = generateToken(user);
        res.json({ success: true, message: 'Login successful', user, token });
    }
);

// Get user profile
app.get('/api/auth/profile', async (req, res) => {
    const { email } = req.query;
    if (!email) return res.status(400).json({ success: false, error: 'Email is required' });
    if (FALLBACK_MEMORY_MODE) {
        const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
        if (!user) return res.status(404).json({ success: false, error: 'User not found' });
        return res.json({ success: true, user: { id: user.id, name: user.name, email: user.email, createdAt: user.createdAt } });
    }
    try {
        const [rows] = await pool.query('SELECT id, name, email, created_at AS createdAt FROM users WHERE LOWER(email)=LOWER(?)', [email]);
        if (rows.length === 0) return res.status(404).json({ success: false, error: 'User not found' });
        res.json({ success: true, user: rows[0] });
    } catch (err) {
        console.error('Profile error:', err);
        res.status(500).json({ success: false, error: 'Server error' });
    }
});

// Delete current user (self-delete)
app.delete('/api/auth/me', authMiddleware, async (req, res) => {
    const userId = req.user && req.user.id;
    if (!userId) {
        return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    if (FALLBACK_MEMORY_MODE) {
        const idx = users.findIndex(u => u.id === Number(userId));
        if (idx === -1) return res.status(404).json({ success: false, error: 'User not found' });

        // Remove user from in-memory array
        users.splice(idx, 1);
        return res.json({ success: true, message: 'Account deleted successfully' });
    }

    try {
        const [result] = await pool.query('DELETE FROM users WHERE id = ?', [userId]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, error: 'User not found' });
        }
        // Optionally: clean up related data here if you add FKs (bookings etc.)
        return res.json({ success: true, message: 'Account deleted successfully' });
    } catch (err) {
        console.error('Delete user error:', err);
        return res.status(500).json({ success: false, error: 'Server error' });
    }
});

// =====================================================
// CONTACT / INQUIRY ROUTES
// =====================================================

// Submit inquiry
app.post('/api/inquiries', async (req, res) => {
    const { packageName, name, email, phone, message } = req.body;
    if (!packageName || !name || !email) return res.status(400).json({ success: false, error: 'Package name, name, and email are required' });
    if (FALLBACK_MEMORY_MODE) {
        const inquiry = {
            id: Date.now(),
            packageName,
            name,
            email,
            phone: phone || null,
            message: message || null,
            status: 'pending',
            createdAt: new Date().toISOString()
        };
        return res.json({ success: true, message: 'Inquiry submitted successfully', inquiry });
    }
    try {
        const [result] = await pool.query(
            'INSERT INTO inquiries (package_name, name, email, phone, message) VALUES (?, ?, ?, ?, ?)',
            [packageName, name, email, phone || null, message || null]
        );
        const [rows] = await pool.query('SELECT * FROM inquiries WHERE id = ?', [result.insertId]);
        res.json({ success: true, message: 'Inquiry submitted successfully', inquiry: rows[0] });
    } catch (err) {
        console.error('Inquiry error:', err);
        res.status(500).json({ success: false, error: 'Server error' });
    }
});

// Newsletter subscription
app.post('/api/newsletter', async (req, res) => {
    const { email } = req.body;
    if (!email) return res.status(400).json({ success: false, error: 'Email is required' });
    if (FALLBACK_MEMORY_MODE) {
        return res.json({ success: true, message: 'Successfully subscribed to newsletter!', email });
    }
    try {
        await pool.query('INSERT IGNORE INTO newsletter (email) VALUES (?)', [email]);
        res.json({ success: true, message: 'Successfully subscribed to newsletter!', email });
    } catch (err) {
        console.error('Newsletter error:', err);
        res.status(500).json({ success: false, error: 'Server error' });
    }
});

// =====================================================
// 404 Handler
// =====================================================
app.use((req, res) => {
    res.status(404).json({
        success: false,
        error: 'API endpoint not found',
        path: req.path
    });
});

// =====================================================
// START SERVER
// =====================================================
const PORT = process.env.PORT || 3000;

initDatabase().then(() => {
    app.listen(PORT, () => {
    console.log(`
╔════════════════════════════════════════════════════╗
║   🚀 MakeMy Trip Clone Backend Server Started     ║
╠════════════════════════════════════════════════════╣
║   Port:           ${PORT}                          ║
║   Environment:    Development                      ║
║   Database:       MySQL                            ║
║   API Docs:       http://localhost:${PORT}/api/health  ║
╠════════════════════════════════════════════════════╣
║   Available Endpoints:                             ║
║   • GET  /api/health                               ║
║   • GET  /api/flights/search?from=X&to=Y&date=Z    ║
║   • GET  /api/flights                              ║
║   • GET  /api/flights/:id                          ║
║   • POST /api/bookings                             ║
║   • GET  /api/bookings                             ║
║   • GET  /api/bookings/:id                         ║
║   • DELETE /api/bookings/:id                       ║
║   • POST /api/auth/signup                          ║
║   • POST /api/auth/login                           ║
║   • GET  /api/auth/profile?email=X                 ║
║   • DELETE /api/auth/me                            ║
║   • POST /api/inquiries                            ║
║   • POST /api/newsletter                           ║
╠════════════════════════════════════════════════════╣
║   Flight Routes Available: 30 routes               ║
║   Cities: Mumbai, Delhi, Bengaluru, Goa,           ║
║           Chennai, Kolkata, Hyderabad, Jaipur      ║
╚════════════════════════════════════════════════════╝
    `);
    console.log(`✅ Server ready at http://localhost:${PORT}`);
    console.log(`✅ Frontend served at http://localhost:${PORT}/index_new.html\n`);
    });
}).catch(err => {
    console.warn('⚠️ Failed to initialize database, starting in in-memory fallback mode. Details:', err && err.code ? err.code : err);
    FALLBACK_MEMORY_MODE = true;
    pool = undefined;
    app.listen(PORT, () => {
    console.log(`
╔════════════════════════════════════════════════════╗
║   🚀 MakeMy Trip Clone Backend Server Started     ║
╠════════════════════════════════════════════════════╣
║   Port:           ${PORT}                          ║
║   Environment:    Development                      ║
║   Database:       In-Memory (No DB required)       ║
║   API Docs:       http://localhost:${PORT}/api/health  ║
╠════════════════════════════════════════════════════╣
║   Available Endpoints:                             ║
║   • GET  /api/health                               ║
║   • GET  /api/flights/search?from=X&to=Y&date=Z    ║
║   • GET  /api/flights                              ║
║   • GET  /api/flights/:id                          ║
║   • POST /api/bookings                             ║
║   • GET  /api/bookings                             ║
║   • GET  /api/bookings/:id                         ║
║   • DELETE /api/bookings/:id                       ║
║   • POST /api/auth/signup                          ║
║   • POST /api/auth/login                           ║
║   • GET  /api/auth/profile?email=X                 ║
║   • DELETE /api/auth/me                            ║
║   • POST /api/inquiries                            ║
║   • POST /api/newsletter                           ║
╠════════════════════════════════════════════════════╣
║   Flight Routes Available: 30 routes               ║
║   Cities: Mumbai, Delhi, Bengaluru, Goa,           ║
║           Chennai, Kolkata, Hyderabad, Jaipur      ║
╚════════════════════════════════════════════════════╝
    `);
    console.log(`✅ Server ready at http://localhost:${PORT}`);
    console.log(`✅ Frontend served at http://localhost:${PORT}/index_new.html\n`);
    });
});

// =====================================================
// IN-MEMORY FALLBACK DATA (used if DB not available)
// =====================================================

// Users store
const users = [];

// Bookings store
const bookings = [];

// Hotels database
const hotelsDatabase = [
    { id: 1, name: 'Taj Palace', city: 'Delhi', rating: 5, price: 8500, amenities: 'Luxury Room, Free WiFi, Pool, Spa, Restaurant', imageUrl: null, availableFrom: '2025-10-19' },
    { id: 2, name: 'The Leela', city: 'Mumbai', rating: 5, price: 7200, amenities: 'Deluxe Suite, Ocean View, Gym, Free Breakfast', imageUrl: null, availableFrom: '2025-10-19' },
    { id: 3, name: 'ITC Grand Chola', city: 'Chennai', rating: 5, price: 6800, amenities: 'Executive Room, Business Center, Pool, Bar', imageUrl: null, availableFrom: '2025-10-19' },
    { id: 4, name: 'Hyatt Regency', city: 'Bengaluru', rating: 4, price: 4500, amenities: 'Standard Room, WiFi, Parking, Restaurant', imageUrl: null, availableFrom: '2025-10-19' },
    { id: 5, name: 'Oberoi Udaivilas', city: 'Udaipur', rating: 5, price: 12000, amenities: 'Lake View Suite, Royal Experience, Butler Service', imageUrl: null, availableFrom: '2025-10-19' },
    { id: 6, name: 'JW Marriott', city: 'Pune', rating: 5, price: 5800, amenities: 'Premium Room, Pool, Gym, Spa', imageUrl: null, availableFrom: '2025-10-19' },
    { id: 7, name: 'Radisson Blu', city: 'Goa', rating: 4, price: 5200, amenities: 'Beach View, Pool, Restaurant, WiFi', imageUrl: null, availableFrom: '2025-10-19' },
    { id: 8, name: 'The Ritz-Carlton', city: 'Bengaluru', rating: 5, price: 9500, amenities: 'Club Room, Lounge Access, Fine Dining', imageUrl: null, availableFrom: '2025-10-19' },
];

// Trains database
const trainsDatabase = [
    { id: 1, from: 'Mumbai', to: 'Delhi', name: 'Rajdhani Express', trainNo: '12951', departure: '16:55', arrival: '08:35', duration: '15h 40m', price: 2500, class: 'AC 3-Tier', date: '2025-10-20' },
    { id: 2, from: 'Delhi', to: 'Mumbai', name: 'August Kranti Rajdhani', trainNo: '12953', departure: '16:35', arrival: '09:15', duration: '16h 40m', price: 2600, class: 'AC 2-Tier', date: '2025-10-20' },
    { id: 3, from: 'Mumbai', to: 'Bengaluru', name: 'Udyan Express', trainNo: '11301', departure: '08:05', arrival: '21:55', duration: '13h 50m', price: 1800, class: 'AC 3-Tier', date: '2025-10-20' },
    { id: 4, from: 'Delhi', to: 'Kolkata', name: 'Rajdhani Express', trainNo: '12301', departure: '16:55', arrival: '10:05', duration: '17h 10m', price: 2800, class: 'AC 2-Tier', date: '2025-10-20' },
    { id: 5, from: 'Chennai', to: 'Delhi', name: 'Tamil Nadu Express', trainNo: '12621', departure: '22:30', arrival: '07:05', duration: '32h 35m', price: 2200, class: 'AC 3-Tier', date: '2025-10-20' },
];

// Buses database
const busesDatabase = [
    { id: 1, from: 'Mumbai', to: 'Pune', operator: 'Shivneri Travels', busType: 'AC Sleeper', departure: '23:30', arrival: '03:00', duration: '3h 30m', price: 650, seatsAvailable: 35, date: '2025-10-20' },
    { id: 2, from: 'Delhi', to: 'Jaipur', operator: 'RSRTC', busType: 'Volvo AC', departure: '06:00', arrival: '11:30', duration: '5h 30m', price: 850, seatsAvailable: 40, date: '2025-10-20' },
    { id: 3, from: 'Bengaluru', to: 'Chennai', operator: 'VRL Travels', busType: 'AC Semi-Sleeper', departure: '22:00', arrival: '05:30', duration: '7h 30m', price: 950, seatsAvailable: 38, date: '2025-10-20' },
    { id: 4, from: 'Hyderabad', to: 'Vijayawada', operator: 'Orange Travels', busType: 'Non-AC Seater', departure: '07:00', arrival: '12:00', duration: '5h', price: 450, seatsAvailable: 45, date: '2025-10-20' },
    { id: 5, from: 'Pune', to: 'Goa', operator: 'Paulo Travels', busType: 'AC Sleeper', departure: '21:00', arrival: '08:00', duration: '11h', price: 1200, seatsAvailable: 30, date: '2025-10-20' },
];

// Cabs database
const cabsDatabase = [
    { id: 1, from: 'Mumbai Airport', to: 'Mumbai Central', cabType: 'Sedan', price: 450, duration: '45 mins', distance: '25 km', date: '2025-10-20' },
    { id: 2, from: 'Delhi Airport', to: 'Connaught Place', cabType: 'SUV', price: 850, duration: '1 hour', distance: '20 km', date: '2025-10-20' },
    { id: 3, from: 'Bengaluru Airport', to: 'MG Road', cabType: 'Hatchback', price: 650, duration: '1.5 hours', distance: '40 km', date: '2025-10-20' },
    { id: 4, from: 'Chennai Airport', to: 'T Nagar', cabType: 'Sedan', price: 550, duration: '50 mins', distance: '15 km', date: '2025-10-20' },
];

// Holidays database
const holidaysDatabase = [
    { id: 1, name: 'Goa Beach Paradise', from: 'Mumbai', destination: 'Goa', durationDays: 5, price: 15000, inclusions: 'Flights, Hotel, Breakfast, Sightseeing', date: '2025-10-26' },
    { id: 2, name: 'Rajasthan Royal Tour', from: 'Delhi', destination: 'Jaipur-Udaipur', durationDays: 7, price: 25000, inclusions: 'Flights, Hotels, Meals, Guided Tours', date: '2025-10-26' },
    { id: 3, name: 'Kerala Backwaters', from: 'Bengaluru', destination: 'Kerala', durationDays: 6, price: 22000, inclusions: 'Flights, Houseboat, Hotel, Meals', date: '2025-10-26' },
    { id: 4, name: 'Himalayan Adventure', from: 'Delhi', destination: 'Manali', durationDays: 5, price: 18000, inclusions: 'Transport, Hotel, Adventure Activities', date: '2025-10-26' },
    { id: 5, name: 'Andaman Islands', from: 'Chennai', destination: 'Port Blair', durationDays: 6, price: 28000, inclusions: 'Flights, Resort, Scuba Diving, Meals', date: '2025-11-02' },
];

// Flights database with realistic Indian routes
const flightsDatabase = [
        // Mumbai Routes
        { id: 1, from: 'Mumbai', to: 'Delhi', airline: 'Air India', flight: 'AI-202', departure: '08:30 AM', arrival: '10:45 AM', duration: '2h 15m', price: 5450, stops: 'Non-stop', date: '2025-10-20' },
        { id: 2, from: 'Mumbai', to: 'Delhi', airline: 'IndiGo', flight: '6E-345', departure: '11:00 AM', arrival: '01:30 PM', duration: '2h 30m', price: 4890, stops: 'Non-stop', date: '2025-10-20' },
        { id: 3, from: 'Mumbai', to: 'Goa', airline: 'SpiceJet', flight: 'SG-789', departure: '09:15 AM', arrival: '10:30 AM', duration: '1h 15m', price: 3250, stops: 'Non-stop', date: '2025-10-20' },
        { id: 4, from: 'Mumbai', to: 'Goa', airline: 'Vistara', flight: 'UK-567', departure: '02:15 PM', arrival: '03:45 PM', duration: '1h 30m', price: 4200, stops: 'Non-stop', date: '2025-10-20' },
        { id: 5, from: 'Mumbai', to: 'Bengaluru', airline: 'Air India', flight: 'AI-678', departure: '07:00 AM', arrival: '09:00 AM', duration: '2h', price: 4100, stops: 'Non-stop', date: '2025-10-20' },
        { id: 6, from: 'Mumbai', to: 'Bengaluru', airline: 'IndiGo', flight: '6E-234', departure: '05:30 PM', arrival: '07:20 PM', duration: '1h 50m', price: 3890, stops: 'Non-stop', date: '2025-10-20' },
    
        // Delhi Routes
        { id: 7, from: 'Delhi', to: 'Mumbai', airline: 'Air India', flight: 'AI-301', departure: '06:00 AM', arrival: '08:15 AM', duration: '2h 15m', price: 5200, stops: 'Non-stop', date: '2025-10-20' },
        { id: 8, from: 'Delhi', to: 'Mumbai', airline: 'SpiceJet', flight: 'SG-456', departure: '03:00 PM', arrival: '05:30 PM', duration: '2h 30m', price: 4650, stops: 'Non-stop', date: '2025-10-20' },
        { id: 9, from: 'Delhi', to: 'Goa', airline: 'IndiGo', flight: '6E-789', departure: '10:00 AM', arrival: '01:15 PM', duration: '3h 15m', price: 5890, stops: 'Non-stop', date: '2025-10-20' },
        { id: 10, from: 'Delhi', to: 'Goa', airline: 'Vistara', flight: 'UK-890', departure: '04:45 PM', arrival: '08:00 PM', duration: '3h 15m', price: 6200, stops: 'Non-stop', date: '2025-10-20' },
        { id: 11, from: 'Delhi', to: 'Jaipur', airline: 'IndiGo', flight: '6E-123', departure: '08:00 AM', arrival: '09:00 AM', duration: '1h', price: 2500, stops: 'Non-stop', date: '2025-10-20' },
        { id: 12, from: 'Delhi', to: 'Jaipur', airline: 'SpiceJet', flight: 'SG-567', departure: '06:30 PM', arrival: '07:30 PM', duration: '1h', price: 2200, stops: 'Non-stop', date: '2025-10-20' },
    
        // Bengaluru Routes
        { id: 13, from: 'Bengaluru', to: 'Mumbai', airline: 'Air India', flight: 'AI-901', departure: '10:00 AM', arrival: '12:00 PM', duration: '2h', price: 4300, stops: 'Non-stop', date: '2025-10-20' },
        { id: 14, from: 'Bengaluru', to: 'Mumbai', airline: 'IndiGo', flight: '6E-432', departure: '08:30 PM', arrival: '10:20 PM', duration: '1h 50m', price: 3950, stops: 'Non-stop', date: '2025-10-20' },
        { id: 15, from: 'Bengaluru', to: 'Delhi', airline: 'Vistara', flight: 'UK-234', departure: '06:30 AM', arrival: '09:15 AM', duration: '2h 45m', price: 5600, stops: 'Non-stop', date: '2025-10-20' },
        { id: 16, from: 'Bengaluru', to: 'Delhi', airline: 'SpiceJet', flight: 'SG-678', departure: '01:00 PM', arrival: '03:45 PM', duration: '2h 45m', price: 5100, stops: 'Non-stop', date: '2025-10-20' },
        { id: 17, from: 'Bengaluru', to: 'Jaipur', airline: 'IndiGo', flight: '6E-567', departure: '11:30 AM', arrival: '02:00 PM', duration: '2h 30m', price: 4800, stops: 'Non-stop', date: '2025-10-20' },
        { id: 18, from: 'Bengaluru', to: 'Goa', airline: 'Air India', flight: 'AI-345', departure: '09:00 AM', arrival: '10:15 AM', duration: '1h 15m', price: 3400, stops: 'Non-stop', date: '2025-10-20' },
    
        // Goa Routes
        { id: 19, from: 'Goa', to: 'Mumbai', airline: 'SpiceJet', flight: 'SG-901', departure: '11:30 AM', arrival: '12:45 PM', duration: '1h 15m', price: 3100, stops: 'Non-stop', date: '2025-10-20' },
        { id: 20, from: 'Goa', to: 'Delhi', airline: 'IndiGo', flight: '6E-901', departure: '02:00 PM', arrival: '05:15 PM', duration: '3h 15m', price: 5750, stops: 'Non-stop', date: '2025-10-20' },
        { id: 21, from: 'Goa', to: 'Bengaluru', airline: 'Air India', flight: 'AI-567', departure: '04:00 PM', arrival: '05:15 PM', duration: '1h 15m', price: 3300, stops: 'Non-stop', date: '2025-10-20' },
    
        // Additional routes for other cities
        { id: 22, from: 'Chennai', to: 'Delhi', airline: 'Vistara', flight: 'UK-456', departure: '07:00 AM', arrival: '10:00 AM', duration: '3h', price: 6100, stops: 'Non-stop', date: '2025-10-20' },
        { id: 23, from: 'Chennai', to: 'Mumbai', airline: 'IndiGo', flight: '6E-678', departure: '01:00 PM', arrival: '03:15 PM', duration: '2h 15m', price: 4900, stops: 'Non-stop', date: '2025-10-20' },
        { id: 24, from: 'Kolkata', to: 'Delhi', airline: 'Air India', flight: 'AI-789', departure: '08:30 AM', arrival: '11:00 AM', duration: '2h 30m', price: 5300, stops: 'Non-stop', date: '2025-10-20' },
        { id: 25, from: 'Kolkata', to: 'Mumbai', airline: 'SpiceJet', flight: 'SG-234', departure: '12:00 PM', arrival: '02:45 PM', duration: '2h 45m', price: 5500, stops: 'Non-stop', date: '2025-10-20' },
        { id: 26, from: 'Hyderabad', to: 'Delhi', airline: 'IndiGo', flight: '6E-890', departure: '09:00 AM', arrival: '11:30 AM', duration: '2h 30m', price: 5400, stops: 'Non-stop', date: '2025-10-20' },
        { id: 27, from: 'Hyderabad', to: 'Mumbai', airline: 'Vistara', flight: 'UK-678', departure: '05:00 PM', arrival: '06:30 PM', duration: '1h 30m', price: 4200, stops: 'Non-stop', date: '2025-10-20' },
        { id: 28, from: 'Jaipur', to: 'Delhi', airline: 'SpiceJet', flight: 'SG-345', departure: '10:00 AM', arrival: '11:00 AM', duration: '1h', price: 2300, stops: 'Non-stop', date: '2025-10-20' },
        { id: 29, from: 'Jaipur', to: 'Mumbai', airline: 'Air India', flight: 'AI-234', departure: '03:00 PM', arrival: '05:00 PM', duration: '2h', price: 4500, stops: 'Non-stop', date: '2025-10-20' },
        { id: 30, from: 'Jaipur', to: 'Bengaluru', airline: 'IndiGo', flight: '6E-456', departure: '07:30 AM', arrival: '10:00 AM', duration: '2h 30m', price: 4700, stops: 'Non-stop', date: '2025-10-20' },
];