# 🏛️ E-Governance Service Automation System

> A full-stack web application for automating government service requests — built with Node.js, Express, MongoDB, and vanilla HTML/CSS/JS.

---

## 📁 Project Structure

```
egov/
├── backend/
│   ├── middleware/
│   │   ├── auth.js          # JWT auth + role-based access
│   │   └── upload.js        # Multer file upload config
│   ├── models/
│   │   ├── User.js          # Citizen / Admin / Officer schema
│   │   ├── ServiceRequest.js # Request + workflow schema
│   │   └── Document.js      # Uploaded document schema
│   ├── routes/
│   │   ├── auth.js          # Register, Login, Profile
│   │   ├── requests.js      # CRUD + status workflow
│   │   ├── documents.js     # Upload, verify, delete
│   │   └── citizens.js      # Admin citizen management
│   ├── uploads/             # Uploaded files stored here
│   ├── server.js            # Express entry point
│   ├── package.json
│   └── .env.example
│
└── frontend/
    ├── login.html           # Login + Register page
    ├── portal.html          # Citizen portal
    ├── admin.html           # Admin dashboard
    ├── style.css            # Shared stylesheet
    └── app.js               # Shared JS utilities + API calls
```

---

## ⚡ Quick Setup

### Prerequisites
- Node.js v18+
- MongoDB (local or Atlas)

### 1. Clone & Install Backend

```bash
cd backend
npm install
```

### 2. Configure Environment

```bash
cp .env.example .env
```

Edit `.env`:
```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/egovernance
JWT_SECRET=your_super_secret_key_here
JWT_EXPIRE=7d
```

### 3. Seed Admin User (run once)

```bash
node -e "
const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');
require('dotenv').config();

mongoose.connect(process.env.MONGO_URI).then(async () => {
  const User = require('./models/User');
  const exists = await User.findOne({ email: 'admin@egov.in' });
  if (!exists) {
    await User.create({ name: 'Admin Officer', email: 'admin@egov.in', password: 'admin123', role: 'admin' });
    console.log('✅ Admin created: admin@egov.in / admin123');
  } else {
    console.log('Admin already exists.');
  }
  process.exit();
});
"
```

### 4. Start Backend

```bash
# Development (with auto-reload)
npm run dev

# Production
npm start
```

Server runs at: **http://localhost:5000**

### 5. Open Frontend

Open `frontend/login.html` in a browser, or serve with any static server:

```bash
# Using Python
cd frontend && python3 -m http.server 3000

# Using Node
npx serve frontend -p 3000
```

Then visit: **http://localhost:3000/login.html**

---

## 🔑 Default Credentials

| Role    | Email               | Password   |
|---------|---------------------|------------|
| Admin   | admin@egov.in       | admin123   |
| Citizen | Register via portal | (your own) |

---

## 🔌 API Reference

### Auth

| Method | Endpoint                  | Auth     | Description          |
|--------|---------------------------|----------|----------------------|
| POST   | /api/auth/register        | ❌        | Register citizen     |
| POST   | /api/auth/login           | ❌        | Login, get JWT       |
| GET    | /api/auth/me              | ✅        | Get current user     |
| PUT    | /api/auth/profile         | ✅        | Update profile       |
| PUT    | /api/auth/change-password | ✅        | Change password      |

### Service Requests

| Method | Endpoint                      | Auth         | Description              |
|--------|-------------------------------|--------------|--------------------------|
| GET    | /api/requests                 | ✅            | List requests (own/all)  |
| GET    | /api/requests/stats           | ✅ Admin      | Dashboard statistics     |
| GET    | /api/requests/:id             | ✅            | Get single request       |
| POST   | /api/requests                 | ✅            | Create new request       |
| PUT    | /api/requests/:id/status      | ✅ Admin      | Update status + workflow |
| DELETE | /api/requests/:id             | ✅ Admin      | Delete request           |

### Documents

| Method | Endpoint                      | Auth         | Description              |
|--------|-------------------------------|--------------|--------------------------|
| POST   | /api/documents/upload         | ✅            | Upload a file            |
| GET    | /api/documents                | ✅            | List documents           |
| GET    | /api/documents/:id            | ✅            | Get document info        |
| PUT    | /api/documents/:id/verify     | ✅ Admin      | Mark document verified   |
| DELETE | /api/documents/:id            | ✅            | Delete document          |

### Citizens (Admin)

| Method | Endpoint                          | Auth    | Description            |
|--------|-----------------------------------|---------|------------------------|
| GET    | /api/citizens                     | ✅ Admin | List all citizens      |
| GET    | /api/citizens/:id                 | ✅ Admin | View citizen + history |
| PUT    | /api/citizens/:id/toggle-active   | ✅ Admin | Activate/deactivate    |

---

## 🎯 Modules Included

### ✅ Authentication System
- JWT-based login/register
- Role-based access: `citizen`, `admin`, `officer`
- Password hashing with bcrypt
- Protected routes middleware

### ✅ Citizen Portal
- Submit service requests (8 service types)
- Track application with 5-step workflow
- View/filter all personal requests
- Update profile

### ✅ Document Upload & Management
- Upload PDF, JPG, PNG, DOC files (max 5MB)
- Drag & drop interface
- Link documents to specific requests
- Admin document verification
- Secure file storage on server

### ✅ Admin Dashboard
- Real-time stats (total, pending, approved, in-review)
- Update request status with workflow advancement
- Verify documents
- Manage citizen accounts (activate/deactivate)
- Service type distribution charts

---

## 🛠️ Tech Stack

| Layer    | Technology          |
|----------|---------------------|
| Backend  | Node.js + Express   |
| Database | MongoDB + Mongoose  |
| Auth     | JWT + bcryptjs      |
| Upload   | Multer              |
| Frontend | HTML + CSS + Vanilla JS |

---

## 🔒 Security Features

- Passwords hashed with bcrypt (salt rounds: 10)
- JWT tokens expire in 7 days
- Aadhaar numbers masked in API responses
- File type & size validation on upload
- Role-based route authorization
- Citizens can only access their own data
