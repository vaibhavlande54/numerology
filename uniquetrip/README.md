# 🚀 MakeMy Trip Clone - Full Stack Travel Booking Platform

A complete, fully functional travel booking website with backend API integration, user authentication, flight search, and booking management.

## ✨ Features

### 🎨 Frontend
- **Modern UI/UX** with glass morphism design
- **Dark/Light Mode** theme toggle with localStorage persistence
- **Responsive Design** - Works on all devices
- **Hero Video Background** with search functionality
- **AI-Powered Recommendations** based on user preferences
- **Toast Notifications** for user feedback
- **Smooth Animations** and transitions
- **Accessible** with ARIA labels and keyboard navigation

### 🔐 User Authentication
- User registration with validation
- Login with session management
- Profile dropdown menu
- Logout functionality
- Auto-filled forms for logged-in users

### ✈️ Flight Search & Booking
- **Real-time Flight Search** from backend API
- **30 Pre-configured Routes** across 8 major Indian cities
- **Interactive Booking Modal** with passenger details
- **Price Calculation** for multiple passengers
- **Booking Confirmation** with unique booking reference
- **No Results Handling** with suggested routes

### 🏨 Additional Features
- Popular travel packages with modals
- Newsletter subscription
- Package inquiry system
- View Details for destinations
- AI recommendation preferences modal

### 🌐 Backend API
- **RESTful API** built with Express.js
- **In-Memory Storage** (no database setup required)
- **11 API Endpoints** for complete functionality
- **CORS Enabled** for cross-origin requests
- **Comprehensive Error Handling**

## 📂 Project Structure

```
makemytrip_clone/
├── server/
│   ├── index.js              # Backend API server
│   ├── package.json          # Backend dependencies
│   └── README.md             # API documentation
│
├── assets/
│   └── hero-video.mp4        # Hero section video
│
├── index_new.html            # Main homepage
├── login_new.html            # Login/Signup page (✅ Backend integrated)
├── flights_new.html          # Flights page
├── hotels_new.html           # Hotels page
├── holidays_new.html         # Holidays page
├── trains_new.html           # Trains page
├── buses_new.html            # Buses page
├── cabs_new.html             # Cabs page
│
├── script.js                 # Main JavaScript (✅ Backend integrated)
├── style.css                 # Main stylesheet
├── ai-recommendations.js     # AI recommendation engine
│
├── api-test.html             # API testing dashboard
├── server.js                 # Alternative server file
│
└── README.md                 # This file
```

## 🚀 Quick Start

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn

### Installation & Running

#### 1. Install Backend Dependencies
```bash
cd server
npm install
```

#### 2. Start the Backend Server
```bash
# From the server directory
npm start
```
Backend will run on **http://localhost:3000**

#### 3. Open the Frontend
You have two options:

**Option A: Use Backend Server (Recommended)**
- Open http://localhost:3000/index_new.html in your browser
- Everything will work seamlessly

**Option B: Use Separate Static Server**
```bash
# In a new terminal, from project root
npx http-server -p 8001 -c-1
```
- Open http://localhost:8001/index_new.html

### 🎯 Test the Application

#### Option 1: API Test Dashboard
Open http://localhost:3000/api-test.html to test all API endpoints interactively.

#### Option 2: Manual Testing

**1. Register a New User:**
- Go to http://localhost:3000/login_new.html
- Click "Register" tab
- Fill in: Name, Email, Password
- Click "Register"
- You'll be auto-redirected to login

**2. Login:**
- Enter your email and password
- Click "Login"
- You'll be redirected to homepage
- Your name will appear in the top-right corner

**3. Search Flights:**
- On homepage, enter:
  - From: Mumbai
  - To: Goa
  - Date: Any future date
- Click "Search"
- Real flights from API will appear!

**4. Book a Flight:**
- Click "Book Now" on any flight
- A modal will open with pre-filled details (if logged in)
- Enter phone number and number of passengers
- Click "Confirm Booking"
- You'll get a booking reference number!

**5. View Profile:**
- Click on your name in the top-right
- Dropdown menu appears with options
- Click "Logout" to sign out

## 🗺️ Available Flight Routes

### Cities
- Mumbai
- Delhi
- Bengaluru
- Goa
- Chennai
- Kolkata
- Hyderabad
- Jaipur

### Popular Routes
- Mumbai ↔ Delhi (4 flights/day)
- Mumbai ↔ Goa (2 flights/day)
- Delhi ↔ Goa (2 flights/day)
- Bengaluru ↔ Delhi (2 flights/day)
- And 20+ more routes!

## 📡 API Endpoints

### Authentication
```
POST /api/auth/signup      # Register new user
POST /api/auth/login       # User login
GET  /api/auth/profile     # Get user profile
```

### Flights
```
GET  /api/flights/search   # Search flights (from, to, date)
GET  /api/flights          # Get all flights
GET  /api/flights/:id      # Get flight by ID
```

### Bookings
```
POST   /api/bookings       # Create booking
GET    /api/bookings       # Get all bookings (filter by email)
GET    /api/bookings/:id   # Get booking by ID
DELETE /api/bookings/:id   # Cancel booking
```

### Other
```
GET  /api/health           # Health check
POST /api/newsletter       # Newsletter subscription
POST /api/inquiries        # Package inquiry
```

For detailed API documentation, see `server/README.md`

## 🎨 Features Walkthrough

### 1. **Dark Mode Toggle**
- Click the 🌙/☀️ button in top-right
- Theme persists across sessions
- All pages support dark mode

### 2. **Flight Search**
- Real-time API calls to backend
- Displays actual flight data from database
- Shows price, duration, airline info
- Handles "no results" gracefully with suggestions

### 3. **Booking Flow**
- Professional booking modal
- Pre-fills data for logged-in users
- Calculates total price for multiple passengers
- Generates unique booking reference
- Saves booking to backend

### 4. **User Session**
- Stores user data in localStorage
- Shows user name in navbar
- Profile dropdown with options
- Logout clears session

### 5. **AI Recommendations**
- Set preferences (travel style, budget, activities)
- AI algorithm scores destinations
- Personalized recommendations
- Click to explore or add to favorites

## 🔧 Configuration

### Backend Port
Default: 3000
To change:
```bash
PORT=5000 npm start
```

### API URL in Frontend
If you change backend port, update in:
- `script.js` → Line with `http://localhost:3000`
- `login_new.html` → `const API_URL`

### Theme
Default theme is set in:
- `script.js` → `currentTheme` variable
- Persists in localStorage as `'theme'`

## 📊 Technologies Used

### Frontend
- HTML5
- CSS3 (Custom Properties, Flexbox, Grid, Animations)
- Vanilla JavaScript (ES6+)
- Fetch API for AJAX
- LocalStorage for persistence

### Backend
- Node.js
- Express.js
- CORS
- In-Memory Data Storage

### Design
- Glass Morphism UI
- Gradient Backgrounds
- Toast Notifications
- Modal Dialogs
- Responsive Grid Layout

## 🐛 Troubleshooting

### Backend Not Starting?
```bash
# Check if port 3000 is in use
netstat -ano | findstr :3000   # Windows
lsof -ti:3000                  # Mac/Linux

# Kill process or use different port
PORT=3001 npm start
```

### CORS Errors?
- Make sure backend is running
- Check browser console for errors
- Verify `CORS` is enabled in `server/index.js`

### Flights Not Showing?
- Open browser DevTools → Network tab
- Check if API call is being made
- Look for any red (failed) requests
- Verify backend URL is correct

### Login Not Working?
- Check browser console for errors
- Verify backend is running on port 3000
- Try API test dashboard to confirm backend works
- Clear localStorage and try again

## 🚀 Deployment

### Backend (Heroku, Railway, Render)
```bash
# Add to package.json in server/
"scripts": {
  "start": "node index.js"
}

# Set PORT environment variable in hosting platform
# Deploy server/ folder
```

### Frontend (Netlify, Vercel, GitHub Pages)
```bash
# Update API URL in script.js to your deployed backend
const API_URL = 'https://your-backend.herokuapp.com/api';

# Deploy root folder (not server/)
```

## 📈 Future Enhancements

- [ ] Add real database (MongoDB/PostgreSQL)
- [ ] JWT authentication with secure tokens
- [ ] Payment gateway integration (Razorpay/Stripe)
- [ ] Email notifications for bookings
- [ ] "My Bookings" page to view history
- [ ] Seat selection interface
- [ ] Flight filtering (price, duration, stops)
- [ ] Hotel & train booking integration
- [ ] Admin dashboard for managing flights
- [ ] Real-time flight status updates
- [ ] Multi-language support
- [ ] PWA (Progressive Web App)
- [ ] Social login (Google, Facebook)

## 📝 License

MIT License - Feel free to use this project for learning or personal projects!

## 👨‍💻 Development

Built with ❤️ as a full-stack travel booking platform demonstration.

**Key Highlights:**
- ✅ Complete frontend with 8+ pages
- ✅ Fully functional backend API
- ✅ User authentication & session management
- ✅ Real booking system
- ✅ No database setup required
- ✅ Professional UI/UX
- ✅ Mobile responsive
- ✅ Dark mode support

---

## 🎯 Quick Commands

```bash
# Start backend server
cd server && npm start

# Start frontend static server
npx http-server -p 8001

# Test API
# Open: http://localhost:3000/api-test.html

# View main site
# Open: http://localhost:3000/index_new.html
```

**Everything is ready to go! Start the backend and start booking flights! ✈️🎉**
