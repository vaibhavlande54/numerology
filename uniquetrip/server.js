const axios = require('axios');
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const mysql = require('mysql2');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json());

// MySQL connection via env vars with safe defaults
const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'makemytrip'
};

const db = mysql.createConnection(dbConfig);

let dbConnected = false;
db.connect(err => {
    if (err) {
        console.error('MySQL connection failed:', err.message);
        dbConnected = false;
    } else {
        console.log('Connected to MySQL');
        dbConnected = true;
        // Create users table if not exists
        const createTable = `CREATE TABLE IF NOT EXISTS users (
            id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(100),
            email VARCHAR(100) UNIQUE,
            password VARCHAR(100),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )`;
        db.query(createTable, err => {
            if (err) console.error('Failed creating users table:', err.message);
        });
    }
});

// Health endpoint
app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        dbConnected,
        dbHost: dbConfig.host,
        dbName: dbConfig.database
    });
});

// Middleware to ensure DB is available for API routes
function requireDb(req, res, next) {
    if (!dbConnected) return res.status(503).json({ error: 'Database unavailable' });
    next();
}

// Signup endpoint
app.post('/api/signup', requireDb, (req, res) => {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
        return res.status(400).json({ error: 'All fields are required.' });
    }
    db.query('SELECT * FROM users WHERE email = ?', [email], (err, results) => {
        if (err) return res.status(500).json({ error: 'Database error.' });
        if (results.length > 0) {
            return res.status(400).json({ error: 'Email already exists.' });
        }
        db.query('INSERT INTO users (name, email, password) VALUES (?, ?, ?)', [name, email, password], err => {
            if (err) return res.status(500).json({ error: 'Signup failed.' });
            res.json({ message: 'Signup successful! You can now login.' });
        });
    });
});

// Login endpoint
app.post('/api/login', requireDb, (req, res) => {
    const { email, password } = req.body;
    db.query('SELECT * FROM users WHERE email = ? AND password = ?', [email, password], (err, results) => {
        if (err) return res.status(500).json({ error: 'Database error.' });
        if (results.length > 0) {
            const user = results[0];
            res.json({ message: 'Login successful!', name: user.name, email: user.email });
        } else {
            res.status(401).json({ error: 'Invalid email or password.' });
        }
    });
});

// Get profile info
app.get('/api/profile', requireDb, (req, res) => {
    const { email } = req.query;
    db.query('SELECT name, email, created_at FROM users WHERE email = ?', [email], (err, results) => {
        if (err) return res.status(500).json({ error: 'Database error.' });
        if (results.length > 0) {
            res.json(results[0]);
        } else {
            res.status(404).json({ error: 'User not found.' });
        }
    });
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});

