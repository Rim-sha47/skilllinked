<div align="center">

<img src="https://img.shields.io/badge/SkillLinked-2.0-2563EB?style=for-the-badge&logo=data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCI+PHBhdGggZmlsbD0id2hpdGUiIGQ9Ik0xMiAyQzYuNDggMiAyIDYuNDggMiAxMnM0LjQ4IDEwIDEwIDEwIDEwLTQuNDggMTAtMTBTMTcuNTIgMiAxMiAyem0tMiAxNWwtNS01IDEuNDEtMS40MUwxMCAxNC4xN2w3LjU5LTcuNTlMMTkgOGwtOSA5eiIvPjwvc3ZnPg==&logoColor=white" alt="SkillLinked"/>

<h1>
  <img src="docs/screenshots/logo.png" width="40" height="40" style="vertical-align:middle"/> 
  SkillLinked
</h1>

<p align="center">
  <strong>🚀 The Next-Generation Professional Networking Platform</strong><br/>
  <em>Intelligent networking · AI-driven job matching · Premium SaaS aesthetics</em>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react&logoColor=black" />
  <img src="https://img.shields.io/badge/Node.js-Express-339933?style=flat-square&logo=node.js&logoColor=white" />
  <img src="https://img.shields.io/badge/MongoDB-Atlas-47A248?style=flat-square&logo=mongodb&logoColor=white" />
  <img src="https://img.shields.io/badge/Redux_Toolkit-764ABC?style=flat-square&logo=redux&logoColor=white" />
  <img src="https://img.shields.io/badge/Socket.io-Real--time-010101?style=flat-square&logo=socket.io&logoColor=white" />
  <img src="https://img.shields.io/badge/TailwindCSS-3.0-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white" />
  <img src="https://img.shields.io/badge/JWT-Auth-000000?style=flat-square&logo=jsonwebtokens&logoColor=white" />
  <img src="https://img.shields.io/badge/Vite-646CFF?style=flat-square&logo=vite&logoColor=white" />
</p>

<p align="center">
  <img src="https://img.shields.io/badge/License-MIT-green.svg?style=flat-square" />
  <img src="https://img.shields.io/badge/PRs-Welcome-brightgreen.svg?style=flat-square" />
  <img src="https://img.shields.io/badge/Version-2.0.0-blue.svg?style=flat-square" />
  <img src="https://img.shields.io/badge/Status-Active-success.svg?style=flat-square" />
</p>

<br/>

<img src="docs/screenshots/hero.png" alt="SkillLinked Hero" width="100%" style="border-radius: 12px; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.5);"/>

</div>

---

## 📋 Table of Contents

- [✨ Overview](#-overview)
- [🖼️ Screenshots](#️-screenshots)
- [🔥 Features](#-features)
- [🛠️ Tech Stack](#️-tech-stack)
- [⚡ Quick Start](#-quick-start)
- [🗂️ Project Structure](#️-project-structure)
- [🔌 API Reference](#-api-reference)
- [🌐 Environment Variables](#-environment-variables)
- [🤝 Contributing](#-contributing)
- [📄 License](#-license)

---

## ✨ Overview

**SkillLinked** is a full-stack professional networking platform inspired by LinkedIn but built with a modern, premium SaaS design philosophy. It combines intelligent job matching, real-time messaging, and AI-assisted career guidance into a single, beautiful platform.

> *"Elevate Your Professional Future"* — connecting talent with opportunity through smart technology.

### 🎯 What Makes SkillLinked Different?

| Feature | Traditional Platforms | SkillLinked |
|---|---|---|
| Design | Outdated UI | ✅ Premium glassmorphism dark mode |
| Search | Basic keyword | ✅ Multi-field intelligent search |
| Messaging | Simple chat | ✅ Real-time Socket.io with read receipts |
| Job Matching | Manual browse | ✅ AI-powered recommendations |
| Auth | Email only | ✅ Multi-identifier (email, phone, username) |
| Admin | None | ✅ Full admin panel with analytics |

---

## 🖼️ Screenshots

<div align="center">

### 🏠 Landing Page
<img src="docs/screenshots/landing.png" alt="Landing Page" width="100%" style="border-radius:10px; margin-bottom:16px"/>

### 🔐 Authentication
<table>
  <tr>
    <td width="50%">
      <img src="docs/screenshots/login.png" alt="Login Page" width="100%" style="border-radius:10px"/>
      <p align="center"><em>Login Page</em></p>
    </td>
    <td width="50%">
      <img src="docs/screenshots/signup.png" alt="Signup Page" width="100%" style="border-radius:10px"/>
      <p align="center"><em>Signup Page</em></p>
    </td>
  </tr>
</table>

### 📊 Dashboard
<img src="docs/screenshots/dashboard.png" alt="Dashboard" width="100%" style="border-radius:10px; margin-bottom:16px"/>

### 🌐 Networking & Jobs
<table>
  <tr>
    <td width="50%">
      <img src="docs/screenshots/networking.png" alt="My Network" width="100%" style="border-radius:10px"/>
      <p align="center"><em>My Network</em></p>
    </td>
    <td width="50%">
      <img src="docs/screenshots/jobs.png" alt="Jobs Board" width="100%" style="border-radius:10px"/>
      <p align="center"><em>Jobs Board</em></p>
    </td>
  </tr>
</table>

### 💬 Messaging
<img src="docs/screenshots/messaging.png" alt="Messaging" width="100%" style="border-radius:10px; margin-bottom:16px"/>

### 🛡️ Admin Panel
<img src="docs/screenshots/admin.png" alt="Admin Panel" width="100%" style="border-radius:10px"/>

</div>

> 📸 **To add your own screenshots:** Save images to `docs/screenshots/` folder and name them as shown above.

---

## 🔥 Features

<details>
<summary><b>👤 User Authentication</b></summary>

- ✅ Register with full name, email, username, and phone
- ✅ Login with email **OR** username **OR** phone number **OR** full name
- ✅ Separate Admin login with role-based access
- ✅ JWT authentication (Access + Refresh tokens — 7-day sessions)
- ✅ Auto-logout with clean redirect on session expiry
- ✅ Remember me functionality

</details>

<details>
<summary><b>👤 Profile Management</b></summary>

- ✅ Upload and update profile picture
- ✅ Add/edit bio and professional headline
- ✅ Add skills with tag display
- ✅ Location, website, and social links
- ✅ Profile completion tracker with visual ring
- ✅ Resume upload support

</details>

<details>
<summary><b>🌐 Professional Networking</b></summary>

- ✅ Send/accept/reject connection requests
- ✅ View pending invitations
- ✅ "People you may know" suggestions
- ✅ Follower/following system
- ✅ Real-time connection notifications

</details>

<details>
<summary><b>💼 Job Board</b></summary>

- ✅ Browse and search job listings
- ✅ Filter by job type (Full-time, Part-time, Contract, Internship)
- ✅ Filter by workplace (Remote, Hybrid, On-site)
- ✅ Apply to jobs
- ✅ Track applications
- ✅ Company-posted jobs

</details>

<details>
<summary><b>💬 Real-time Messaging</b></summary>

- ✅ Direct messaging between connections
- ✅ Real-time delivery via Socket.io
- ✅ Unread message badges
- ✅ Chat list with last message preview
- ✅ Online/offline status

</details>

<details>
<summary><b>📢 Feed & Posts</b></summary>

- ✅ Create and share professional posts
- ✅ Like and comment on posts
- ✅ Activity feed from your network
- ✅ Notification system for interactions

</details>

<details>
<summary><b>🏢 Companies</b></summary>

- ✅ Company profiles
- ✅ Browse all registered companies
- ✅ Company can post jobs
- ✅ Separate company authentication

</details>

<details>
<summary><b>🤖 AI Career Assistant</b></summary>

- ✅ AI-powered resume analysis (coming soon)
- ✅ AI Daily Insights on dashboard
- ✅ Personalized job match recommendations

</details>

<details>
<summary><b>🛡️ Admin Panel</b></summary>

- ✅ Admin-only dashboard with analytics
- ✅ Manage users, companies, and jobs
- ✅ Real-time admin notifications via Socket.io
- ✅ New user/login activity feed
- ✅ Role-based access control

</details>

<details>
<summary><b>🎨 Design & UX</b></summary>

- ✅ Premium glassmorphism design system
- ✅ Full dark mode / light mode toggle
- ✅ Smooth Framer Motion animations
- ✅ Fully responsive (mobile, tablet, desktop)
- ✅ Skeleton loaders for all data
- ✅ Toast notifications

</details>

---

## 🛠️ Tech Stack

### Frontend
| Technology | Purpose |
|---|---|
| **React 18** | UI framework |
| **Vite** | Build tool & dev server |
| **Redux Toolkit** | Global state management |
| **React Router v6** | Client-side routing |
| **Tailwind CSS** | Utility-first styling |
| **Framer Motion** | Animations & transitions |
| **Socket.io Client** | Real-time communication |
| **Axios** | HTTP client |
| **React Icons** | Icon library |
| **date-fns** | Date formatting |

### Backend
| Technology | Purpose |
|---|---|
| **Node.js** | JavaScript runtime |
| **Express.js** | Web framework |
| **MongoDB** | NoSQL database |
| **Mongoose** | ODM for MongoDB |
| **Socket.io** | Real-time WebSocket server |
| **JWT** | Authentication tokens |
| **bcrypt.js** | Password hashing |
| **Multer** | File upload handling |
| **dotenv** | Environment variable management |

### Infrastructure
| Technology | Purpose |
|---|---|
| **MongoDB Atlas** | Cloud database |
| **Cloudinary** (optional) | Cloud image storage |

---

## ⚡ Quick Start

### Prerequisites
Make sure you have installed:
- [Node.js](https://nodejs.org/) `v18+`
- [MongoDB](https://www.mongodb.com/) or a MongoDB Atlas account
- npm or yarn

### 1️⃣ Clone the Repository

```bash
git clone https://github.com/yourusername/skilllinked.git
cd skilllinked
```

### 2️⃣ Setup Server

```bash
cd server

# Install dependencies
npm install

# Create .env file (copy from example)
cp .env.example .env
# Edit .env with your values (see Environment Variables section below)

# Start server in development mode
npm run dev
```

The server will run at: `http://localhost:5000`

### 3️⃣ Setup Client

```bash
cd client

# Install dependencies
npm install

# Create .env file
echo "VITE_API_BASE_URL=http://localhost:5000/api" > .env

# Start client in development mode
npm run dev
```

The client will run at: `http://localhost:5173`

### 4️⃣ Open Browser

Navigate to `http://localhost:5173` — you should see the SkillLinked landing page! 🎉

---

## 🗂️ Project Structure

```
skilllinked/
│
├── 📁 client/                    # React Frontend
│   ├── 📁 public/                # Static assets
│   └── 📁 src/
│       ├── 📁 components/        # Reusable UI components
│       │   ├── common/           # Button, Card, Modal, etc.
│       │   ├── layout/           # Navbar, Sidebar, Layouts
│       │   └── profile/          # Profile-specific components
│       ├── 📁 pages/             # Page components
│       │   ├── Landing/          # Home/marketing page
│       │   ├── Auth/             # Login, Signup
│       │   ├── Dashboard/        # User dashboard
│       │   ├── Feed/             # Social feed
│       │   ├── Jobs/             # Job board
│       │   ├── Messaging/        # Chat interface
│       │   ├── Networking/       # Connections
│       │   ├── Profile/          # User profile
│       │   ├── Companies/        # Company listings
│       │   ├── Search/           # Search results
│       │   ├── Notifications/    # Notifications
│       │   ├── AI/               # AI assistant
│       │   ├── Premium/          # Premium plans
│       │   └── Admin/            # Admin panel
│       ├── 📁 redux/             # State management
│       │   └── slices/           # Auth, Profile, Jobs, etc.
│       ├── 📁 services/          # API client (Axios)
│       ├── 📁 routes/            # App routing
│       └── 📁 layouts/           # Protected route wrapper
│
├── 📁 server/                    # Node.js Backend
│   ├── 📁 public/uploads/        # Uploaded profile pictures (gitignored)
│   └── 📁 src/
│       ├── 📁 config/            # DB & Cloudinary config
│       ├── 📁 controllers/       # Business logic
│       │   ├── authController.js
│       │   ├── profileController.js
│       │   ├── jobController.js
│       │   ├── connectionController.js
│       │   ├── messageController.js
│       │   └── adminController.js
│       ├── 📁 models/            # Mongoose schemas
│       │   ├── User.js
│       │   ├── Profile.js
│       │   ├── Job.js
│       │   ├── Connection.js
│       │   ├── Message.js
│       │   └── Admin.js
│       ├── 📁 routes/            # Express route definitions
│       ├── 📁 middlewares/       # Auth & error middleware
│       └── 📁 sockets/           # Socket.io event handlers
│
├── 📁 docs/screenshots/          # App screenshots for README
├── .gitignore
└── README.md
```

---

## 🔌 API Reference

### 🔐 Authentication

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| `POST` | `/api/auth/register/user` | Register new user | ❌ |
| `POST` | `/api/auth/register/company` | Register company | ❌ |
| `POST` | `/api/auth/login/user` | User login | ❌ |
| `POST` | `/api/auth/login/admin` | Admin login | ❌ |
| `POST` | `/api/auth/refresh` | Refresh access token | ❌ |
| `GET`  | `/api/auth/me` | Get current user | ✅ |
| `POST` | `/api/auth/logout` | Logout | ✅ |

### 👤 Profiles

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| `GET` | `/api/profiles/me` | Get my profile | ✅ |
| `POST` | `/api/profiles` | Create/update profile | ✅ |
| `PUT` | `/api/profiles/avatar` | Upload profile picture | ✅ |
| `POST` | `/api/profiles/skills` | Add a skill | ✅ |
| `DELETE` | `/api/profiles/skills/:skill` | Remove a skill | ✅ |
| `GET` | `/api/profiles/dashboard` | Get dashboard stats | ✅ |
| `GET` | `/api/profiles/:userId` | Get user profile by ID | ✅ |

### 💼 Jobs

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| `GET` | `/api/jobs` | Get all jobs (with filters) | ✅ |
| `POST` | `/api/jobs` | Post a new job | ✅ |
| `GET` | `/api/jobs/:id` | Get job by ID | ✅ |
| `POST` | `/api/jobs/:id/apply` | Apply to a job | ✅ |
| `GET` | `/api/jobs/applications/me` | My job applications | ✅ |

### 🌐 Connections

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| `GET` | `/api/connections` | Get my connections | ✅ |
| `GET` | `/api/connections/pending` | Pending requests | ✅ |
| `GET` | `/api/connections/suggestions` | People you may know | ✅ |
| `POST` | `/api/connections/request/:userId` | Send connection request | ✅ |
| `PUT` | `/api/connections/accept/:userId` | Accept request | ✅ |
| `DELETE` | `/api/connections/reject/:userId` | Reject request | ✅ |

### 💬 Messages

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| `GET` | `/api/chats` | Get all conversations | ✅ |
| `GET` | `/api/chats/:userId` | Get chat with user | ✅ |
| `POST` | `/api/chats/:userId` | Send a message | ✅ |

---

## 🌐 Environment Variables

Create a `.env` file in the `/server` directory:

```env
# Server
NODE_ENV=development
PORT=5000

# Database
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/skilllinked

# JWT Secrets (use strong random strings!)
JWT_SECRET=your_super_secret_jwt_key_minimum_32_chars
JWT_REFRESH_SECRET=your_super_secret_refresh_key_minimum_32_chars

# Cloudinary (optional – for cloud image uploads)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Admin Account (auto-created on first server start)
ADMIN_EMAIL=admin@yourdomain.com
ADMIN_PASSWORD=strongAdminPassword123!
ADMIN_NAME=Super Admin
```

Create a `.env` file in the `/client` directory:

```env
VITE_API_BASE_URL=http://localhost:5000/api
```

---

## 🚀 Deployment

### Deploy Backend (Railway / Render)

1. Push to GitHub
2. Connect to Railway or Render
3. Set all environment variables
4. Deploy — it auto-detects Node.js

### Deploy Frontend (Vercel / Netlify)

1. Connect your GitHub repo
2. Set build command: `cd client && npm run build`
3. Set publish directory: `client/dist`
4. Set env variable: `VITE_API_BASE_URL=https://your-backend-url.com/api`
5. Deploy!

---

## 🤝 Contributing

Contributions are always welcome! 🎉

```bash
# 1. Fork the repo
# 2. Create your feature branch
git checkout -b feature/AmazingFeature

# 3. Commit your changes
git commit -m 'feat: Add some AmazingFeature'

# 4. Push to the branch
git push origin feature/AmazingFeature

# 5. Open a Pull Request
```

Please follow these guidelines:
- Use meaningful commit messages (feat:, fix:, docs:, style:)
- Write clean, commented code
- Test your changes before submitting PR
- Update README if needed

---

## 🐛 Known Issues & Roadmap

### 🔧 Current Limitations
- [ ] Google/GitHub OAuth not yet connected
- [ ] AI Resume Analysis (UI ready, integration pending)
- [ ] Email verification flow

### 🗺️ Roadmap
- [ ] **v2.1** — Google OAuth integration
- [ ] **v2.2** — AI Resume scorer with real AI API
- [ ] **v2.3** — Video call feature via WebRTC
- [ ] **v2.4** — Premium subscription with Stripe
- [ ] **v2.5** — Mobile app (React Native)

---

## 📄 License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.

```
MIT License — Copyright (c) 2026 SkillLinked Team
Permission is hereby granted, free of charge, to any person obtaining a copy
of this software to use, copy, modify, merge, publish, distribute...
```

---

<div align="center">

### ⭐ Star this repo if you found it useful!

<p>
  Made with ❤️ and a lot of ☕ by the SkillLinked Team
</p>

<p>
  <a href="https://github.com/yourusername/skilllinked/issues">🐛 Report Bug</a> ·
  <a href="https://github.com/yourusername/skilllinked/issues">✨ Request Feature</a> ·
  <a href="#">🌐 Live Demo</a>
</p>

<img src="https://img.shields.io/github/stars/yourusername/skilllinked?style=social" />
<img src="https://img.shields.io/github/forks/yourusername/skilllinked?style=social" />

<br/><br/>

---

### 👩‍💻 Built By

<table align="center">
  <tr>
    <td align="center">
      <img src="https://avatars.githubusercontent.com/u/0?v=4" width="100px" alt="Rimsha" style="border-radius:50%; border: 3px solid #2563EB;"/><br/>
      <b>Rimsha</b><br/>
      <sub>🚀 Full-Stack Developer</sub><br/><br/>
      <a href="https://github.com/rimsha7221">
        <img src="https://img.shields.io/badge/GitHub-rimsha7221-181717?style=flat-square&logo=github" />
      </a>
    </td>
  </tr>
</table>

<br/>

> 💡 *"This project was designed and developed entirely by **Rimsha** — from the backend API to the premium UI design."*

<br/>

**© 2026 Rimsha · SkillLinked — All Rights Reserved**

</div>
