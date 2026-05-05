# Hardware & Software Requirements
## UniqueTrip — MakeMyTrip Clone Project

**Project:** Multi-Service Travel Booking Platform  
**Version:** 1.0  
**Date:** October 28, 2025

---

## Quick Summary (Simple)

### Hardware (Server-Side):
- High-speed SSDs & Object Storage (S3)
- Load Balancers, High-bandwidth Internet
- **Development**: 4-8 GB RAM, 10-20 GB SSD
- **Production**: 2-4 vCPUs, 4 GB RAM, 20 GB SSD

### Software:
- **OS**: Windows (10/11), macOS, or Linux
- **Backend**: Node.js (v16+)
- **Frontend**: HTML (for pages), CSS (for styling), JavaScript (for logic)
- **Database**: MySQL (v8.0)
- **APIs**: Payment Gateways (Stripe, Razorpay), Flight/Hotel APIs (future)
- **IDE**: VS Code, IntelliJ IDEA

### Key Dependencies (npm):
- express (web framework)
- mysql2 (database driver)
- jsonwebtoken (JWT auth)
- bcrypt (password hashing)
- cors (cross-origin support)
- express-rate-limit (security)

### Quick Start:
```powershell
# 1. Install dependencies
npm install

# 2. Start MySQL service
net start MYSQL80

# 3. Run the server
cd server
node index.js

# 4. Open browser → http://localhost:3000/index_new.html
```

---

## 1. Software Requirements

### 1.1 Development Environment

#### **Operating System**
- **Windows 10/11** (64-bit) - Primary development platform
- **macOS** (10.15 or later) - Alternative
- **Linux** (Ubuntu 20.04 LTS or later) - Alternative

#### **Runtime Environments**
| Software | Version | Purpose |
|----------|---------|---------|
| **Node.js** | 16.x or higher | JavaScript runtime for backend server |
| **npm** | 8.x or higher | Package manager (bundled with Node.js) |
| **MySQL Server** | 8.0 or higher | Relational database management system |

#### **Code Editor / IDE**
- **Visual Studio Code** (recommended) - v1.80+
  - Extensions: ESLint, Prettier, MySQL, REST Client
- **Alternative**: WebStorm, Sublime Text, Atom

#### **Web Browsers** (for testing)
| Browser | Minimum Version | Purpose |
|---------|----------------|---------|
| Google Chrome | v90+ | Primary development browser |
| Mozilla Firefox | v88+ | Cross-browser testing |
| Microsoft Edge | v90+ | Cross-browser testing |
| Safari | v14+ | macOS/iOS testing (if applicable) |

---

### 1.2 Backend Dependencies (Node.js Packages)

Installed via `npm install` in project root:

| Package | Version | Purpose |
|---------|---------|---------|
| **express** | ^5.1.0 | Web application framework |
| **mysql2** | ^3.15.1 | MySQL database driver with promise support |
| **cors** | ^2.8.5 | Cross-Origin Resource Sharing middleware |
| **body-parser** | ^2.2.0 | Parse incoming request bodies |
| **jsonwebtoken** | ^9.0.0 | JWT token generation and verification |
| **bcrypt** | ^5.1.0 | Password hashing (10 salt rounds) |
| **express-rate-limit** | ^6.7.0 | Rate limiting middleware (DDoS protection) |
| **express-validator** | ^7.0.0 | Input validation middleware |
| **dotenv** | ^16.0.0 | Environment variable management |

#### **Dev Dependencies (Optional)**
- **nodemon** (^3.0.0) - Auto-restart server on file changes
- **mocha** / **chai** - Testing framework (if extending tests)

---

### 1.3 Database Requirements

#### **MySQL Configuration**
```
Database Name: makemytrip
User: root (or custom user)
Password: user123 (configurable via .env)
Host: localhost
Port: 3306 (default)
```

#### **Required Tables**
- `users` - User accounts
- `flights` - Flight inventory
- `hotels` - Hotel listings
- `trains` - Train schedules
- `buses` - Bus services
- `cabs` - Cab/taxi services
- `holidays` - Holiday packages
- `bookings` - All booking records
- `newsletter` - Email subscriptions
- `inquiries` - Customer inquiries

---

### 1.4 Frontend Dependencies

**No external libraries required** - uses browser-native APIs:
- Fetch API (for HTTP requests)
- LocalStorage API (for token storage)
- DOM API (for UI manipulation)

**Optional (for UML diagram rendering)**:
- **Mermaid CLI** (@mermaid-js/mermaid-cli ^10.9.1) - for generating diagrams
- Installed in `docs/uml/` subfolder

---

### 1.5 Version Control & Collaboration

| Tool | Version | Purpose |
|------|---------|---------|
| **Git** | 2.30+ | Source code version control |
| **GitHub / GitLab / Bitbucket** | - | Remote repository hosting (optional) |

---

## 2. Hardware Requirements

### 2.1 Minimum Requirements (Development)

| Component | Specification |
|-----------|---------------|
| **Processor** | Intel Core i3 / AMD Ryzen 3 (2 cores, 2.0 GHz) |
| **RAM** | 4 GB |
| **Storage** | 10 GB free disk space (SSD recommended) |
| **Network** | Broadband internet connection (for npm packages) |
| **Display** | 1366 x 768 resolution |

### 2.2 Recommended Requirements (Development)

| Component | Specification |
|-----------|---------------|
| **Processor** | Intel Core i5/i7 / AMD Ryzen 5/7 (4+ cores, 3.0+ GHz) |
| **RAM** | 8 GB or more |
| **Storage** | 20 GB free SSD storage |
| **Network** | High-speed internet (for faster npm installs) |
| **Display** | 1920 x 1080 resolution (Full HD) |

---

### 2.3 Production Deployment Requirements

#### **Server Specifications** (for hosting)
| Component | Minimum | Recommended |
|-----------|---------|-------------|
| **CPU** | 1 vCPU | 2+ vCPUs |
| **RAM** | 1 GB | 2-4 GB |
| **Storage** | 10 GB SSD | 20 GB SSD |
| **Bandwidth** | 1 TB/month | Unlimited |
| **OS** | Ubuntu 20.04 LTS | Ubuntu 22.04 LTS |

#### **Hosting Options**
- **Cloud Platforms**: AWS (EC2), Google Cloud (Compute Engine), Azure, DigitalOcean
- **Platform-as-a-Service**: Heroku, Render, Railway, Vercel (frontend), Fly.io
- **Database Hosting**: AWS RDS (MySQL), DigitalOcean Managed Database, PlanetScale

---

## 3. Network Requirements

### 3.1 Development

| Requirement | Details |
|-------------|---------|
| **Localhost Access** | Server runs on `http://localhost:3000` |
| **Ports** | 3000 (Express server), 3306 (MySQL) |
| **Firewall** | Allow inbound on port 3000 (for testing from other devices on LAN) |

### 3.2 Production

| Requirement | Details |
|-------------|---------|
| **Domain Name** | Optional (e.g., uniquetrip.com) |
| **SSL/TLS Certificate** | Required for HTTPS (Let's Encrypt free option) |
| **DNS** | A/AAAA records pointing to server IP |
| **CDN** | Optional (Cloudflare, AWS CloudFront for static assets) |
| **Load Balancer** | Optional (Nginx, AWS ALB for high traffic) |

---

## 4. Additional Tools & Services

### 4.1 Development Tools

| Tool | Purpose |
|------|---------|
| **Postman / Insomnia** | API testing (REST endpoints) |
| **MySQL Workbench** | Database GUI (visual schema design) |
| **Git Bash / Terminal** | Command-line interface |
| **Chrome DevTools** | Frontend debugging |

### 4.2 Optional Enhancements

| Service | Purpose |
|---------|---------|
| **Payment Gateway** | Stripe, PayPal, Razorpay (for real payments) |
| **Email Service** | SendGrid, Mailgun (for booking confirmations) |
| **SMS Gateway** | Twilio (for OTP verification) |
| **Monitoring** | PM2 (process management), New Relic, Datadog |
| **Logging** | Winston, Morgan (structured logging) |

---

## 5. Security Requirements

### 5.1 Software

| Component | Requirement |
|-----------|-------------|
| **HTTPS** | SSL/TLS certificate (production) |
| **Environment Variables** | `.env` file for secrets (never commit to Git) |
| **Firewall** | UFW (Linux) or Windows Firewall enabled |
| **Antivirus** | Keep OS and AV software updated |

### 5.2 Best Practices

- **Password Policy**: Bcrypt with 10+ salt rounds
- **Token Expiry**: JWT tokens expire in 2 hours
- **Rate Limiting**: Prevents brute-force attacks
- **Input Validation**: express-validator for sanitization
- **SQL Injection Protection**: Parameterized queries (mysql2)

---

## 6. Installation & Setup Summary

### 6.1 Quick Start (Local Development)

```powershell
# 1. Install Node.js (download from nodejs.org)
node --version   # Verify installation

# 2. Install MySQL (download from mysql.com)
# Start MySQL service:
net start MYSQL80   # Windows (run as Administrator)

# 3. Clone/download project
cd "c:\shri web devlompment\makemytrip_clone"

# 4. Install dependencies
npm install

# 5. Start backend server
cd server
node index.js

# 6. Open browser
# Navigate to http://localhost:3000/index_new.html
```

### 6.2 Environment Configuration

Create `.env` file in `server/` directory:

```env
# Database
DB_HOST=localhost
DB_USER=root
DB_PASS=user123
DB_NAME=makemytrip
DB_PORT=3306

# JWT
JWT_SECRET=your_super_secret_key_here

# Server
PORT=3000
NODE_ENV=development
```

---

## 7. Browser Compatibility

| Browser | Supported Versions | Features Tested |
|---------|-------------------|-----------------|
| Chrome | 90+ | ✅ Full support |
| Firefox | 88+ | ✅ Full support |
| Edge | 90+ | ✅ Full support |
| Safari | 14+ | ✅ Full support (macOS/iOS) |
| Opera | 76+ | ✅ Full support |
| IE 11 | ❌ Not supported | ES6+ features required |

### Required Browser Features
- **ES6+ JavaScript** (async/await, Fetch API, arrow functions)
- **LocalStorage API**
- **CSS Grid & Flexbox**
- **HTML5 semantic elements**

---

## 8. Scalability Considerations (Future)

### 8.1 Horizontal Scaling

| Component | Strategy |
|-----------|----------|
| **Web Server** | Multiple Node.js instances behind load balancer (PM2 cluster mode, Nginx) |
| **Database** | Read replicas, master-slave replication (MySQL) |
| **Static Assets** | CDN (Cloudflare, AWS CloudFront) |
| **Session Storage** | Redis for distributed JWT blacklist (logout) |

### 8.2 Vertical Scaling

| Component | Upgrade Path |
|-----------|--------------|
| **CPU** | 2 vCPU → 4 vCPU → 8 vCPU |
| **RAM** | 2 GB → 4 GB → 8 GB → 16 GB |
| **Storage** | SSD with auto-scaling (AWS EBS, DigitalOcean Volumes) |

---

## 9. Testing Requirements

### 9.1 Automated Testing

| Type | Tool | Coverage |
|------|------|----------|
| **Unit Tests** | Mocha, Chai, Jest | API endpoints, utility functions |
| **Integration Tests** | Supertest | Full request-response cycles |
| **Load Tests** | Apache JMeter, Artillery | Concurrent user simulation |

**Current Test Files:**
- `server/test-auth.js` (10/10 passing)
- `server/test-bookings.js` (10/10 passing)

### 9.2 Manual Testing

- **Cross-browser testing** (Chrome, Firefox, Edge, Safari)
- **Responsive design testing** (mobile, tablet, desktop)
- **User acceptance testing** (UAT) for booking flows

---

## 10. Documentation Requirements

| Document | Location | Purpose |
|----------|----------|---------|
| **README.md** | Root directory | Project overview, setup instructions |
| **LITERATURE_SURVEY.md** | docs/ | Research foundations |
| **UML Diagrams** | docs/uml/ | Architecture, data model, sequences |
| **API Documentation** | docs/API.md (optional) | Endpoint specifications |

---

## Summary

### Minimum Setup (For Development)
- **Hardware**: 4 GB RAM, 10 GB storage
- **Software**: Node.js 16+, MySQL 8.0, VS Code, Chrome
- **Time to Setup**: ~30 minutes

### Recommended Setup (For Production)
- **Hardware**: 2 vCPUs, 4 GB RAM, 20 GB SSD
- **Software**: Same as dev + PM2, Nginx, SSL certificate
- **Hosting**: Cloud VPS (DigitalOcean $12/month, AWS EC2 t2.small)

---

**Last Updated:** October 28, 2025  
**Maintained By:** UniqueTrip Development Team
