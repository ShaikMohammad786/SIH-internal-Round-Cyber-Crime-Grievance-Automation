# 🛡️ FraudLens - Cyber Crime Grievance Automation Platform

[![Node.js](https://img.shields.io/badge/Node.js-v18+-green.svg)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-v19.1-blue.svg)](https://reactjs.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-v6.20-green.svg)](https://www.mongodb.com/)
[![Express](https://img.shields.io/badge/Express-v5.1-lightgrey.svg)](https://expressjs.com/)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

> **Smart India Hackathon (SIH) Project** - An intelligent, automated platform for streamlining cyber-crime fraud reporting, legal document generation, and multi-stakeholder case management.

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Key Features](#-key-features)
- [Technology Stack](#-technology-stack)
- [System Architecture](#-system-architecture)
- [Project Structure](#-project-structure)
- [Installation & Setup](#-installation--setup)
- [Usage Guide](#-usage-guide)
- [API Documentation](#-api-documentation)
- [Database Schema](#-database-schema)
- [Workflow Automation](#-workflow-automation)
- [Security Features](#-security-features)
- [Screenshots](#-screenshots)
- [Contributing](#-contributing)
- [License](#-license)
- [Contact](#-contact)

---

## 🎯 Overview

**FraudLens** is a comprehensive full-stack web application designed to revolutionize the cyber-crime reporting and investigation process in India. Built for the Smart India Hackathon, this platform automates the entire fraud case lifecycle - from victim reporting to legal document generation, authority notification, and case resolution.

### Problem Statement
Traditional fraud reporting systems are:
- ❌ Manual and time-consuming
- ❌ Lack coordination between stakeholders
- ❌ Require multiple visits to police stations
- ❌ Have no real-time tracking
- ❌ Involve complex legal documentation

### Our Solution
FraudLens provides:
- ✅ **Automated Case Management** - 8-stage workflow automation
- ✅ **Legal Document Generation** - Auto-generate Section 91 CrPC notices
- ✅ **Multi-Stakeholder Portal** - Victim, Admin, and Police interfaces
- ✅ **Real-Time Tracking** - Live case status and timeline updates
- ✅ **Authority Notification** - Automated emails to telecom, banking, and cyber-crime authorities
- ✅ **Scammer Database** - Intelligent deduplication and tracking

---

## ✨ Key Features

### 🔐 For Victims (Users)
- **Easy Case Registration** - Multi-step guided form with validation
- **Document Upload** - Support for images, PDFs, audio, and video evidence
- **Real-Time Tracking** - Monitor case progress through 8 workflow stages
- **Case History** - View all submitted cases and their statuses
- **Secure Authentication** - JWT-based login with password encryption

### 👨‍💼 For Administrators
- **Comprehensive Dashboard** - Analytics with case metrics and trends
- **Case Management** - Review, verify, and process fraud reports
- **91 CrPC Generation** - Automated legal document creation with PDFKit
- **Email Automation** - Send notices to telecom, banking, and nodal authorities
- **Scammer Profiling** - Create and manage scammer databases
- **User Management** - Role assignment and access control
- **Timeline Management** - Track and update case progression

### 👮 For Police Officers
- **Assigned Cases View** - See all cases assigned for investigation
- **Evidence Collection** - Add investigation findings and evidence
- **Case Resolution** - Mark cases as resolved with action details
- **Status Updates** - Update case status and add comments
- **Dashboard Analytics** - View assigned case statistics

### 🤖 Automation Features
- **Workflow Orchestration** - 8-stage automated case progression
- **Email Notifications** - Automated SMTP emails to authorities
- **Document Generation** - PDF creation for legal notices
- **Scammer Deduplication** - Intelligent matching across identifiers
- **Timeline Tracking** - Automatic status updates and logging

---

## 🛠️ Technology Stack

### Frontend
- **React 19.1** - Modern UI library with hooks
- **Vite 7.1** - Fast build tool and dev server
- **TailwindCSS 4.1** - Utility-first CSS framework
- **React Router DOM 7.9** - Client-side routing
- **Axios 1.12** - HTTP client for API calls
- **Lucide React** - Icon library
- **jsPDF 3.0** - Client-side PDF generation

### Backend
- **Node.js 18+** - JavaScript runtime
- **Express.js 5.1** - Web application framework
- **MongoDB 6.20** - NoSQL database
- **JWT (jsonwebtoken 9.0)** - Authentication tokens
- **bcrypt 6.0** - Password hashing
- **Nodemailer 7.0** - Email sending service
- **PDFKit 0.17** - Server-side PDF generation
- **CORS 2.8** - Cross-origin resource sharing

### Development Tools
- **ESLint** - Code linting
- **dotenv** - Environment variable management
- **Nodemon** - Auto-restart development server

---

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     FraudLens Platform                       │
└─────────────────────────────────────────────────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        │                     │                     │
   ┌────▼────┐          ┌─────▼─────┐        ┌─────▼─────┐
   │  Victim │          │   Admin   │        │  Police   │
   │ Portal  │          │ Dashboard │        │  Portal   │
   └────┬────┘          └─────┬─────┘        └─────┬─────┘
        │                     │                     │
        └─────────────────────┼─────────────────────┘
                              │
                    ┌─────────▼──────────┐
                    │   React Frontend   │
                    │  (Vite + Tailwind) │
                    └─────────┬──────────┘
                              │
                    ┌─────────▼──────────┐
                    │   REST API Layer   │
                    │  (Express.js)      │
                    └─────────┬──────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        │                     │                     │
   ┌────▼────┐          ┌─────▼─────┐        ┌─────▼─────┐
   │ MongoDB │          │  PDFKit   │        │ Nodemailer│
   │Database │          │ Document  │        │   SMTP    │
   │         │          │ Generator │        │  Service  │
   └─────────┘          └───────────┘        └───────────┘
```

### Data Flow
1. **User Registration/Login** → JWT Token Generation
2. **Case Submission** → Form Validation → MongoDB Storage
3. **Admin Review** → Scammer Profile Creation → Timeline Update
4. **91 CrPC Generation** → PDF Document Creation → Database Storage
5. **Email Automation** → SMTP Service → Authority Notification
6. **Police Assignment** → Evidence Collection → Case Resolution

---

## 📁 Project Structure

```
fraudlens/
├── Backend/
│   ├── routes/
│   │   ├── admin.js              # Admin dashboard & case management
│   │   ├── adminActions.js       # Admin-specific actions
│   │   ├── auth.js               # Authentication & JWT
│   │   ├── caseFlow.js           # Automated workflow management
│   │   ├── cases.js              # Case CRUD operations
│   │   ├── crpcGenerator.js      # 91 CrPC document generation
│   │   ├── email.js              # Email templates & sending
│   │   ├── emailConfig.js        # Email configuration
│   │   ├── police.js             # Police portal operations
│   │   ├── scammers.js           # Scammer profile management
│   │   ├── timeline.js           # Case timeline tracking
│   │   └── userProfiles.js       # User profile management
│   ├── services/
│   │   └── emailService.js       # Email automation service
│   ├── utils/
│   │   ├── scammerManager.js     # Scammer deduplication logic
│   │   └── timelineManager.js    # Timeline helper functions
│   ├── server.js                 # Express server entry point
│   ├── package.json              # Backend dependencies
│   └── .env                      # Environment variables
│
├── Frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── AdminCaseFlowManager.jsx
│   │   │   ├── CaseDetailsModal.jsx
│   │   │   ├── CaseFlowTracker.jsx
│   │   │   ├── CRPCDocumentsModal.jsx
│   │   │   ├── FormInput.jsx
│   │   │   ├── Header.jsx
│   │   │   ├── ProfilePopup.jsx
│   │   │   ├── ScammerDetailsModal.jsx
│   │   │   ├── SessionManager.jsx
│   │   │   ├── UserProfile.jsx
│   │   │   └── [Protected Routes]
│   │   ├── pages/
│   │   │   ├── Admin.jsx
│   │   │   ├── AdminDashboard.jsx
│   │   │   ├── AdminFlowDashboard.jsx
│   │   │   ├── CaseHistory.jsx
│   │   │   ├── CaseStatus.jsx
│   │   │   ├── Dashboard.jsx
│   │   │   ├── Home.jsx
│   │   │   ├── Login.jsx
│   │   │   ├── PoliceLogin.jsx
│   │   │   ├── PolicePortal.jsx
│   │   │   ├── Register.jsx
│   │   │   └── RegisterCase.jsx
│   │   ├── utils/
│   │   │   ├── auth.js           # Authentication utilities
│   │   │   ├── caseFlowAPI.js    # Case flow API calls
│   │   │   └── userProfilesAPI.js # User profile API calls
│   │   ├── App.jsx               # Main app component
│   │   ├── main.jsx              # React entry point
│   │   └── index.css             # Global styles
│   ├── public/                   # Static assets
│   ├── package.json              # Frontend dependencies
│   └── vite.config.js            # Vite configuration
│
├── Chat/                         # Chat evidence files
└── README.md                     # This file
```

---

## 🚀 Installation & Setup

### Prerequisites
- **Node.js** v18 or higher
- **MongoDB** v6.0 or higher (running locally or cloud instance)
- **Git** for version control
- **Gmail Account** for SMTP email service (or other SMTP provider)

### Step 1: Clone the Repository
```bash
git clone https://github.com/ShaikMohammad786/SIH-internal-Round-Cyber-Crime-Grievance-Automation.git
cd fraudlens
```

### Step 2: Backend Setup

```bash
# Navigate to backend directory
cd Backend

# Install dependencies
npm install

# Create .env file with the following variables:
MONGODB_URI=mongodb://localhost:27017
JWT_SECRET=your-secret-key-change-in-production
PORT=5000
NODE_ENV=development
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
TELECOM_EMAIL=telecom-authority@example.com
BANKING_EMAIL=banking-authority@example.com
NODAL_EMAIL=nodal-officer@example.com

# Start MongoDB (if running locally)
mongod

# Start the backend server
npm start
```

The backend server will run on `http://localhost:5000`

### Step 3: Frontend Setup

```bash
# Navigate to frontend directory (from project root)
cd Frontend

# Install dependencies
npm install

# Start the development server
npm run dev
```

The frontend will run on `http://localhost:5173`

### Step 4: Database Initialization

The application will automatically create necessary collections on first use. For admin access, you can use the provided scripts:

```bash
cd Backend
node create-super-admin.js
```

---

## 📖 Usage Guide

### For Victims (Users)

1. **Register Account**
   - Navigate to `/register`
   - Fill in name, email, phone, and password
   - Click "Register" to create account

2. **Login**
   - Go to `/login`
   - Enter email and password
   - Access user dashboard

3. **Register a Case**
   - Click "Register New Case" from dashboard
   - **Step 1**: Fill personal information (name, DOB, contact, address, government IDs)
   - **Step 2**: Provide incident details (date, scam type, description, scammer info, amount lost)
   - **Step 3**: Upload evidence files (images, PDFs, audio, video)
   - Submit case

4. **Track Case Status**
   - View case timeline with 8 stages
   - Check email notifications
   - See admin comments and updates

### For Administrators

1. **Login**
   - Navigate to `/admin`
   - Enter admin credentials
   - Access admin dashboard

2. **Dashboard Overview**
   - View total cases, active cases, resolved cases
   - See monthly statistics and trends
   - Monitor recent case submissions

3. **Case Management**
   - Click on any case to view details
   - Review victim information and evidence
   - Verify case information

4. **Scammer Profile Creation**
   - Add scammer details (phone, email, UPI, bank account)
   - System automatically detects duplicates
   - Link scammer to multiple cases

5. **Generate 91 CrPC Document**
   - Click "Generate 91 CrPC" button
   - System creates legal notice PDF
   - Document stored in database

6. **Send to Authorities**
   - Select recipients (telecom, banking, nodal)
   - Click "Send Emails"
   - Automated emails sent with case details

7. **Assign to Police**
   - Select police officer from list
   - Case moves to "Under Review" status

### For Police Officers

1. **Login**
   - Navigate to `/police-login`
   - Enter police credentials
   - Access police portal

2. **View Assigned Cases**
   - See all cases assigned to you
   - Filter by status

3. **Collect Evidence**
   - Add investigation findings
   - Upload additional evidence
   - Record arrest information

4. **Update Case Status**
   - Mark as "Evidence Collected"
   - Mark as "Resolved"
   - Add resolution details

5. **Close Case**
   - Provide closure reason
   - Add final notes
   - Case marked as "Closed"

---

## 🔌 API Documentation

### Authentication Endpoints

#### Register User
```http
POST /api/auth/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "securepassword",
  "phone": "+91 9876543210"
}
```

#### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "securepassword"
}
```

#### Get Current User
```http
GET /api/auth/me
Authorization: Bearer <jwt_token>
```

### Case Management Endpoints

#### Get Case Details
```http
GET /api/cases/:caseId
Authorization: Bearer <jwt_token>
```

#### Update Case Status (Admin)
```http
PUT /api/cases/:caseId/status
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "status": "under_review",
  "adminComment": "Case verified and under review"
}
```

#### Add Admin Comment
```http
POST /api/cases/:caseId/comment
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "comment": "Additional information requested from victim"
}
```

### Admin Endpoints

#### Get Dashboard Statistics
```http
GET /api/admin/dashboard-stats
Authorization: Bearer <jwt_token>
```

#### Get All Users
```http
GET /api/admin/users?page=1&limit=20&search=john
Authorization: Bearer <jwt_token>
```

#### Get Case Details (Admin View)
```http
GET /api/admin/cases/:caseId
Authorization: Bearer <jwt_token>
```

### CRPC Generator Endpoints

#### Generate 91 CrPC Document
```http
POST /api/crpc/generate/:caseId
Authorization: Bearer <jwt_token>
```

#### Send to Authorities
```http
POST /api/crpc/send/:caseId
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "recipients": ["telecom", "banking", "nodal"]
}
```

#### Download CRPC Document
```http
GET /api/crpc/download/:documentId
Authorization: Bearer <jwt_token>
```

### Scammer Management Endpoints

#### Create Scammer Profile
```http
POST /api/scammers/create
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "phoneNumber": "+91 9876543210",
  "email": "scammer@example.com",
  "upiId": "scammer@paytm",
  "bankAccount": "1234567890",
  "ifscCode": "SBIN0001234",
  "name": "Scammer Name",
  "address": "Unknown",
  "caseId": "CASE123",
  "evidenceType": "Screenshots"
}
```

#### Search Scammers
```http
GET /api/scammers/search/:query
Authorization: Bearer <jwt_token>
```

### Police Endpoints

#### Get Assigned Cases
```http
GET /api/police/cases
Authorization: Bearer <jwt_token>
```

#### Add Evidence
```http
POST /api/police/cases/:caseId/evidence
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "evidenceType": "Physical Evidence",
  "details": "Seized mobile phone and documents",
  "arrestInfo": "Suspect arrested on 2024-01-01",
  "recommendation": "Proceed with prosecution"
}
```

#### Resolve Case
```http
POST /api/police/cases/:caseId/resolve
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "resolutionDetails": "Case resolved successfully",
  "actionTaken": "Arrested and charged",
  "outcome": "Money recovered and returned to victim"
}
```

---

## 🗄️ Database Schema

### Collections

#### 1. users
```javascript
{
  _id: ObjectId,
  name: String,
  email: String (unique),
  password: String (hashed),
  phone: String,
  role: String (enum: ['user', 'admin', 'police']),
  createdAt: Date,
  updatedAt: Date
}
```

#### 2. cases
```javascript
{
  _id: ObjectId,
  caseId: String (unique, auto-generated),
  userId: ObjectId (ref: users),
  caseType: String,
  description: String,
  amount: Number,
  incidentDate: Date,
  location: String,
  status: String (enum: ['submitted', 'information_verified', 'crpc_generated', 'emails_sent', 'under_review', 'evidence_collected', 'resolved', 'closed']),
  priority: String,
  formData: Object,
  scammerId: ObjectId (ref: scammers),
  assignedTo: ObjectId (ref: users),
  crpcDocumentId: ObjectId (ref: crpc_documents),
  emailStatus: Object,
  createdAt: Date,
  updatedAt: Date
}
```

#### 3. scammers
```javascript
{
  _id: ObjectId,
  phoneNumber: String,
  email: String,
  upiId: String,
  bankAccount: String,
  ifscCode: String,
  name: String,
  address: String,
  cases: [String],
  evidenceTypes: [String],
  totalCases: Number,
  status: String (enum: ['active', 'blocked', 'under_investigation']),
  firstSeen: Date,
  lastSeen: Date,
  createdAt: Date,
  updatedAt: Date
}
```

#### 4. crpc_documents
```javascript
{
  _id: ObjectId,
  caseId: ObjectId (ref: cases),
  documentNumber: String (unique),
  documentType: String,
  content: Object,
  status: String (enum: ['generated', 'sent']),
  recipients: Object,
  generatedBy: ObjectId (ref: users),
  generatedAt: Date,
  sentAt: Date,
  createdAt: Date,
  updatedAt: Date
}
```

#### 5. case_timeline
```javascript
{
  _id: ObjectId,
  caseId: ObjectId (ref: cases),
  stage: String,
  stageName: String,
  status: String (enum: ['pending', 'completed']),
  description: String,
  icon: String,
  completedAt: Date,
  createdBy: ObjectId (ref: users),
  createdByRole: String,
  metadata: Object,
  createdAt: Date
}
```

#### 6. userProfiles
```javascript
{
  _id: ObjectId,
  userId: ObjectId (ref: users),
  personalInfo: Object,
  contactInfo: Object,
  addressInfo: Object,
  governmentIds: Object,
  createdAt: Date,
  updatedAt: Date
}
```

#### 7. admin_comments
```javascript
{
  _id: ObjectId,
  caseId: ObjectId (ref: cases),
  comment: String,
  adminName: String,
  createdAt: Date
}
```

#### 8. sent_emails
```javascript
{
  _id: ObjectId,
  caseId: ObjectId (ref: cases),
  emailType: String,
  subject: String,
  content: String,
  recipient: Object,
  status: String,
  sentAt: Date,
  sentBy: ObjectId (ref: users)
}
```

---

## ⚙️ Workflow Automation

### 8-Stage Case Lifecycle

```
1. 📄 Report Submitted
   ↓
2. 🔍 Information Verified (Admin verifies victim details)
   ↓
3. ⚖️ 91 CrPC Generated (Legal document created)
   ↓
4. 📧 Authorities Notified (Emails sent to telecom/banking/nodal)
   ↓
5. 👮 Under Review (Police assigned and investigating)
   ↓
6. 📋 Evidence Collected (Police gathers evidence)
   ↓
7. 📊 Case Resolved (Investigation completed)
   ↓
8. ✅ Case Closed (Final closure)
```

### Automated Actions

- **On Case Submission**: Create timeline entry, send confirmation email
- **On Information Verification**: Update status, create scammer profile
- **On CRPC Generation**: Generate PDF, store in database, update timeline
- **On Email Sending**: Send to multiple authorities, log email status
- **On Police Assignment**: Notify police officer, update case status
- **On Evidence Collection**: Update timeline, notify admin
- **On Resolution**: Update status, notify victim
- **On Closure**: Archive case, send final notification

---

## 🔒 Security Features

### Authentication & Authorization
- **JWT Tokens** - Secure token-based authentication
- **bcrypt Hashing** - Password encryption with salt rounds
- **Role-Based Access Control (RBAC)** - Admin, Police, User roles
- **Protected Routes** - Frontend and backend route protection
- **Token Expiration** - 7-day token validity

### Data Security
- **Input Validation** - Server-side and client-side validation
- **SQL Injection Prevention** - MongoDB parameterized queries
- **XSS Protection** - Input sanitization
- **CORS Configuration** - Controlled cross-origin requests
- **Environment Variables** - Sensitive data in .env files

### Privacy
- **Password Exclusion** - Passwords never returned in API responses
- **User Data Protection** - Access control for personal information
- **Secure File Upload** - File type and size validation
- **HTTPS Ready** - Production deployment with SSL/TLS

---

## 📸 Screenshots

### User Dashboard
![User Dashboard](screenshots/user-dashboard.png)

### Case Registration Form
![Case Registration](screenshots/case-registration.png)

### Admin Dashboard
![Admin Dashboard](screenshots/admin-dashboard.png)

### Case Timeline
![Case Timeline](screenshots/case-timeline.png)

### Police Portal
![Police Portal](screenshots/police-portal.png)

---

## 🤝 Contributing

We welcome contributions to FraudLens! Here's how you can help:

### Reporting Bugs
1. Check if the bug has already been reported
2. Create a new issue with detailed description
3. Include steps to reproduce
4. Add screenshots if applicable

### Suggesting Features
1. Open an issue with [Feature Request] tag
2. Describe the feature and its benefits
3. Discuss implementation approach

### Pull Requests
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

### Code Style
- Follow ESLint configuration
- Use meaningful variable names
- Add comments for complex logic
- Write clean, readable code

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 📞 Contact

**Project Team**
- **Developer**: Shaik Mohammad
- **Email**: skmohammad378@gmail.com
- **GitHub**: [@ShaikMohammad786](https://github.com/ShaikMohammad786)
- **Project Repository**: [FraudLens](https://github.com/ShaikMohammad786/SIH-internal-Round-Cyber-Crime-Grievance-Automation)

**Hackathon**: Smart India Hackathon (SIH) - Internal Round

---

## 🙏 Acknowledgments

- Smart India Hackathon organizers
- MongoDB for database solutions
- React and Node.js communities
- All contributors and testers

---

## 📚 Additional Resources

- [MongoDB Documentation](https://docs.mongodb.com/)
- [React Documentation](https://react.dev/)
- [Express.js Guide](https://expressjs.com/en/guide/routing.html)
- [JWT Best Practices](https://jwt.io/introduction)
- [Section 91 CrPC Information](https://indiankanoon.org/doc/1953529/)

---

## 🔄 Version History

### v1.0.0 (Current)
- Initial release
- Complete case management system
- 91 CrPC document generation
- Email automation
- Multi-role portal system
- Real-time timeline tracking

---

## 🚧 Roadmap

### Planned Features
- [ ] Mobile application (React Native)
- [ ] SMS notifications
- [ ] Advanced analytics dashboard
- [ ] Machine learning for fraud detection
- [ ] Multi-language support
- [ ] Integration with government databases
- [ ] Blockchain for evidence integrity
- [ ] Video conferencing for virtual hearings

---

<div align="center">

**Made with ❤️ for Smart India Hackathon**

⭐ Star this repository if you find it helpful!

</div>
