# MakeMy Trip Clone - Backend API

A complete RESTful API backend for the MakeMy Trip clone application with flight search, booking management, and user authentication.

## 🚀 Quick Start

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn

### Installation

```bash
# Navigate to server directory
cd server

# Install dependencies
npm install

# Start the server
npm start
```

The server will start at `http://localhost:3000`

## 📡 API Endpoints

### Health Check
```
GET /api/health
```
Check if the server is running.

**Response:**
```json
{
  "status": "healthy",
  "message": "MakeMy Trip Clone Backend is running!",
  "timestamp": "2025-10-18T10:30:00.000Z"
}
```

---

### Flight Routes

#### Search Flights
```
GET /api/flights/search?from={city}&to={city}&date={date}
```

**Parameters:**
- `from` (required): Departure city
- `to` (required): Destination city
- `date` (optional): Travel date

**Example:**
```bash
GET /api/flights/search?from=Mumbai&to=Goa&date=2025-10-20
```

**Response:**
```json
{
  "success": true,
  "count": 2,
  "from": "Mumbai",
  "to": "Goa",
  "date": "2025-10-20",
  "flights": [
    {
      "id": 3,
      "from": "Mumbai",
      "to": "Goa",
      "airline": "SpiceJet",
      "flight": "SG-789",
      "departure": "09:15 AM",
      "arrival": "10:30 AM",
      "duration": "1h 15m",
      "price": 3250,
      "stops": "Non-stop",
      "date": "2025-10-20"
    }
  ]
}
```

#### Get All Flights
```
GET /api/flights
```

#### Get Flight by ID
```
GET /api/flights/:id
```

---

### Booking Routes

#### Create Booking
```
POST /api/bookings
```

**Request Body:**
```json
{
  "flightId": 3,
  "passengerName": "John Doe",
  "passengerEmail": "john@example.com",
  "passengerPhone": "+91-9876543210",
  "numPassengers": 2
}
```

**Response:**
```json
{
  "success": true,
  "message": "Booking created successfully",
  "booking": {
    "id": 1,
    "bookingReference": "MMT1697621400000",
    "flightId": 3,
    "flight": {...},
    "passengerName": "John Doe",
    "passengerEmail": "john@example.com",
    "totalPrice": 6500,
    "status": "confirmed",
    "bookedAt": "2025-10-18T10:30:00.000Z"
  }
}
```

#### Get All Bookings
```
GET /api/bookings
GET /api/bookings?email=john@example.com  # Filter by email
```

#### Get Booking by ID
```
GET /api/bookings/:id
```

#### Cancel Booking
```
DELETE /api/bookings/:id
```

---

### Authentication Routes

#### Sign Up
```
POST /api/auth/signup
```

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "User registered successfully",
  "user": {
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com"
  }
}
```

#### Login
```
POST /api/auth/login
```

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "user": {
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com"
  }
}
```

#### Get Profile
```
GET /api/auth/profile?email=john@example.com
```

---

### Inquiry & Newsletter Routes

#### Submit Inquiry
```
POST /api/inquiries
```

**Request Body:**
```json
{
  "packageName": "Goa Beach Package",
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "+91-9876543210",
  "message": "I'm interested in this package"
}
```

#### Subscribe to Newsletter
```
POST /api/newsletter
```

**Request Body:**
```json
{
  "email": "john@example.com"
}
```

---

## 🗺️ Available Flight Routes

The backend includes 30 pre-configured flight routes between major Indian cities:

- **Mumbai** ↔ Delhi, Goa, Bengaluru
- **Delhi** ↔ Mumbai, Goa, Jaipur
- **Bengaluru** ↔ Mumbai, Delhi, Jaipur, Goa
- **Goa** ↔ Mumbai, Delhi, Bengaluru
- **Chennai** ↔ Delhi, Mumbai
- **Kolkata** ↔ Delhi, Mumbai
- **Hyderabad** ↔ Delhi, Mumbai
- **Jaipur** ↔ Delhi, Mumbai, Bengaluru

---

## 🔧 Configuration

### Port Configuration
Default port is `3000`. You can change it by setting the `PORT` environment variable:

```bash
PORT=5000 npm start
```

### Data Storage
Currently using **in-memory storage** (data resets on server restart).

For production, replace with:
- MongoDB
- PostgreSQL
- MySQL

---

## 🧪 Testing the API

### Using cURL

**Search Flights:**
```bash
curl "http://localhost:3000/api/flights/search?from=Mumbai&to=Goa"
```

**Create Booking:**
```bash
curl -X POST http://localhost:3000/api/bookings \
  -H "Content-Type: application/json" \
  -d '{
    "flightId": 3,
    "passengerName": "John Doe",
    "passengerEmail": "john@example.com",
    "numPassengers": 1
  }'
```

### Using Postman
Import the following base URL: `http://localhost:3000`

Then test each endpoint using the documentation above.

---

## 📝 Error Responses

All error responses follow this format:

```json
{
  "success": false,
  "error": "Error message here"
}
```

**Common HTTP Status Codes:**
- `200` - Success
- `400` - Bad Request (missing parameters)
- `401` - Unauthorized (invalid credentials)
- `404` - Not Found
- `409` - Conflict (duplicate email)
- `500` - Internal Server Error

---

## 🚧 Future Enhancements

- [ ] Add JWT authentication
- [ ] Integrate real database (MongoDB/PostgreSQL)
- [ ] Add payment gateway integration
- [ ] Implement seat selection
- [ ] Add flight filtering (price, duration, stops)
- [ ] Real-time flight availability
- [ ] Email notifications for bookings
- [ ] Admin dashboard
- [ ] Rate limiting and security middleware

---

## 📄 License

MIT License

---

## 👨‍💻 Developer

Built with ❤️ for MakeMy Trip Clone Project
