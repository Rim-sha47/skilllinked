<div align="center">

<img src="https://img.shields.io/badge/SkillLinked-2.0-2563EB?style=for-the-badge&logo=data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCI+PHBhdGggZmlsbD0id2hpdGUiIGQ9Ik0xMiAyQzYuNDggMiAyIDYuNDggMiAxMnM0LjQ4IDEwIDEwIDEwIDEwLTQuNDggMTAtMTBTMTcuNTIgMiAxMiAyem0tMiAxNWwtNS01IDEuNDEtMS40MUwxMCAxNC4xN2w3LjU5LTcuNTlMMTkgOGwtOSA5eiIvPjwvc3ZnPg==&logoColor=white" alt="SkillLinked"/>

<h1>🚀 SkillLinked</h1>

<p align="center">
  <strong>The Next-Generation AI-Powered Professional Networking Platform</strong><br/>
  <em>Intelligent networking · AI-driven job matching · Premium SaaS aesthetics</em>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react&logoColor=black" alt="React"/>
  <img src="https://img.shields.io/badge/Node.js-Express-339933?style=flat-square&logo=node.js&logoColor=white" alt="Node JS"/>
  <img src="https://img.shields.io/badge/MongoDB-Atlas-47A248?style=flat-square&logo=mongodb&logoColor=white" alt="MongoDB"/>
  <img src="https://img.shields.io/badge/Redux_Toolkit-764ABC?style=flat-square&logo=redux&logoColor=white" alt="Redux"/>
  <img src="https://img.shields.io/badge/Socket.io-Real--time-010101?style=flat-square&logo=socket.io&logoColor=white" alt="Socket IO"/>
  <img src="https://img.shields.io/badge/TailwindCSS-3.0-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white" alt="Tailwind CSS"/>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/License-MIT-green.svg?style=flat-square" alt="License"/>
  <img src="https://img.shields.io/badge/PRs-Welcome-brightgreen.svg?style=flat-square" alt="PRs Welcome"/>
  <img src="https://img.shields.io/badge/Version-2.0.0-blue.svg?style=flat-square" alt="Version"/>
  <img src="https://img.shields.io/badge/Maintained%3F-Yes-success.svg?style=flat-square" alt="Maintained"/>
</p>

<br/>

<img src="docs/screenshots/hero.png" alt="SkillLinked Hero" width="100%" style="border-radius: 12px; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.5);"/>

</div>

---

## 📖 Table of Contents

- [About the Project](#-about-the-project)
- [Key Features](#-key-features)
- [Architecture & Tech Stack](#-architecture--tech-stack)
- [Getting Started](#-getting-started)
- [Environment Variables](#-environment-variables)
- [API Documentation](#-api-documentation)
- [Roadmap & Future Scope](#-roadmap--future-scope)
- [Contributing](#-contributing)
- [License](#-license)

---

## 🌟 About the Project

**SkillLinked** is a modern, full-stack professional networking platform that bridges the gap between talent and opportunity. Drawing inspiration from industry leaders like LinkedIn, SkillLinked introduces a premium user interface with **glassmorphism**, robust **AI-assisted career insights**, and seamless **real-time communication**. 

Whether you are an individual looking to expand your network or a company seeking top-tier candidates, SkillLinked offers an intelligent, integrated ecosystem designed for growth.

---

## 🔥 Key Features

### 👤 User & Profile Management
- **Multi-Identifier Login:** Authenticate seamlessly using Email, Username, Phone, or Full Name.
- **Role-Based Access Control:** Distinct experiences and panels for Users, Companies, and Admins.
- **Dynamic Profiles:** Comprehensive resume support, dynamic skill tagging, and interactive profile completion rings.

### 💼 Career & Job Hub
- **AI-Powered Matching:** Intelligent job recommendations tailored to your profile and skills.
- **Advanced Filtering:** Pinpoint opportunities by type (Full-time, Contract, etc.) and location (Remote, Hybrid, On-site).
- **Application Tracking:** Built-in workflow to track and manage active job applications.

### 💬 Seamless Communication
- **Real-Time Messaging:** Instant, lag-free chat powered by Socket.io, featuring unread badges and online statuses.
- **Professional Feed:** Create, share, and interact with professional posts across your network.
- **Connection Management:** Discover "People you may know" and manage follower/following dynamics intelligently.

### 🛡️ Admin & Security
- **Comprehensive Analytics Dashboard:** Real-time metrics and management tools for platform administrators.
- **Robust Security:** JWT-based access and refresh tokens, bcrypt password hashing, and API rate limiting.

---

## 🛠 Architecture & Tech Stack

SkillLinked follows a decoupled Client-Server architecture to ensure scalability and optimal performance.

### Client (Frontend)
- **Core:** React 18, Vite
- **State Management:** Redux Toolkit
- **Routing:** React Router v6
- **Styling:** Tailwind CSS, Framer Motion (for fluid animations)
- **Real-Time:** Socket.io Client
- **HTTP Client:** Axios

### Server (Backend)
- **Core:** Node.js, Express.js
- **Database:** MongoDB & Mongoose (ODM)
- **Real-Time Engine:** Socket.io
- **Authentication:** JSON Web Tokens (JWT), bcrypt.js
- **File Management:** Multer & Cloudinary Integration

---

## 🚀 Getting Started

Follow these instructions to set up the project locally on your machine.

### Prerequisites

Ensure you have the following installed:
- [Node.js](https://nodejs.org/en/download/) (v18.0.0 or higher)
- [MongoDB](https://www.mongodb.com/try/download/community) (Local instance or MongoDB Atlas URI)
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/rimsha7221/skilllinked.git
   cd skilllinked
   ```

2. **Setup the Backend Server**
   ```bash
   cd server
   npm install
   # Configure environment variables (see below)
   npm run dev
   ```
   > The API will be accessible at `http://localhost:5000/api`

3. **Setup the Frontend Client**
   ```bash
   cd ../client
   npm install
   # Configure environment variables (see below)
   npm run dev
   ```
   > The application will be accessible at `http://localhost:5173`

---

## 🔐 Environment Variables

You will need to create `.env` files in both the `server` and `client` directories.

**`/server/.env`**
```env
NODE_ENV=development
PORT=5000

# Database
MONGO_URI=your_mongodb_connection_string

# Authentication Secrets
JWT_SECRET=your_jwt_access_secret
JWT_REFRESH_SECRET=your_jwt_refresh_secret

# Cloudinary Integration (Optional)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Super Admin Provisioning
ADMIN_EMAIL=admin@skilllinked.com
ADMIN_PASSWORD=supersecretadminpassword
ADMIN_NAME=Super Admin
```

**`/client/.env`**
```env
VITE_API_BASE_URL=http://localhost:5000/api
```

---

## 📡 API Documentation

Below is a high-level overview of the exposed RESTful endpoints.

### Authentication & Authorization
- `POST /api/auth/register/user` - Register a new user
- `POST /api/auth/login/user` - Authenticate a user and receive tokens
- `POST /api/auth/refresh` - Obtain a new access token
- `POST /api/auth/logout` - Invalidate current session

### Profile & Networking
- `GET /api/profiles/me` - Fetch authenticated user profile
- `POST /api/connections/request/:userId` - Send a network connection request
- `GET /api/connections/suggestions` - Discover potential connections

### Job Board
- `GET /api/jobs` - Retrieve job listings with applied filters
- `POST /api/jobs/:id/apply` - Submit an application for a specific job

> For the complete and detailed API specifications, please refer to the Postman/Swagger documentation (Coming Soon).

---

## 🗺 Roadmap & Future Scope

- [ ] **v2.1**: Full integration of OAuth 2.0 (Google & GitHub).
- [ ] **v2.2**: AI-Powered Resume Scoring using OpenAI APIs.
- [ ] **v2.3**: In-app Video Conferencing via WebRTC for remote interviews.
- [ ] **v2.4**: Premium Tier Subscription model powered by Stripe.
- [ ] **v2.5**: Cross-platform Mobile Application using React Native.

---

## 🤝 Contributing

We welcome contributions from the open-source community! To contribute:

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📜 License

Distributed under the MIT License. See `LICENSE` for more information.

---

<div align="center">
  <br/>
  <h3>👩‍💻 Developed with ❤️ by Rimsha</h3>
  <p>Full-Stack Developer | Innovator</p>
  
  <a href="https://github.com/rimsha7221">
    <img src="https://img.shields.io/badge/GitHub-rimsha7221-181717?style=flat-square&logo=github" alt="GitHub Profile" />
  </a>
</div>
