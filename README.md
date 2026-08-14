<div align="center">

<img src="https://img.shields.io/badge/SkillLinked-3.0-2563EB?style=for-the-badge&logo=react&logoColor=white" alt="SkillLinked"/>

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
  <img src="https://img.shields.io/badge/Version-3.0.0-blue.svg?style=flat-square" alt="Version"/>
  <img src="https://img.shields.io/badge/Maintained%3F-Yes-success.svg?style=flat-square" alt="Maintained"/>
</p>

<br/>

<!-- Hero Image -->
<img src="docs/screenshots/landing.png" alt="SkillLinked Landing Page" width="100%" style="border-radius: 12px; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.5);"/>

</div>

---

## 📖 Table of Contents

- [About the Project](#-about-the-project)
- [Project Gallery](#-project-gallery)
- [Key Features](#-key-features)
- [Architecture & Tech Stack](#-architecture--tech-stack)
- [Project Structure](#-project-structure)
- [Getting Started](#-getting-started)
- [Environment Variables](#-environment-variables)
- [API Documentation](#-api-documentation)
- [License](#-license)

---

## 🌟 About the Project

**SkillLinked 3.0** is a modern, full-stack professional networking platform that bridges the gap between talent and opportunity. Drawing inspiration from industry leaders, SkillLinked introduces a premium user interface with **glassmorphism**, robust **AI-assisted career insights**, and seamless **real-time communication**. 

Whether you are an individual looking to expand your network, a company seeking top-tier candidates, or an administrator managing the platform, SkillLinked offers an intelligent, integrated ecosystem designed for growth.

---

## 📸 Project Gallery

Here are some glimpses of the stunning SkillLinked application interface. 

### AI Career Hub & Daily Insights
<img src="docs/screenshots/insights.png" alt="AI Daily Insights" width="100%" style="border-radius: 8px; margin-bottom: 20px;"/>

### Dashboard Overview
<img src="docs/screenshots/dashboard.png" alt="Dashboard Overview" width="100%" style="border-radius: 8px; margin-bottom: 20px;"/>

### Job Board & Search
<img src="docs/screenshots/jobs.png" alt="Job Search" width="100%" style="border-radius: 8px; margin-bottom: 20px;"/>

### Companies Directory
<img src="docs/screenshots/companies.png" alt="Companies Directory" width="100%" style="border-radius: 8px;"/>

---

## 🔥 Key Features

### 👤 User & Profile Management
- **Seamless Login:** Secure authentication using Google OAuth and standard Email/Password.
- **Role-Based Access Control:** Distinct experiences and panels for Users, Companies, and Admins.
- **Dynamic Profiles:** Comprehensive resume support, dynamic skill tagging, and interactive profile completion metrics.

### 💼 Career & AI Job Hub
- **AI-Powered Insights:** Smart career dashboard that analyzes your profile, resume, and market signals to deliver personalized recommendations.
- **Advanced Job Filtering:** Pinpoint opportunities by type (Full-time, Contract) and location (Remote, Hybrid).
- **Profile Analytics:** Real-time metrics on profile views, connections, and activity pulse.

### 💬 Seamless Communication
- **Real-Time Messaging:** Instant, lag-free chat powered by Socket.io.
- **Connection Management:** Discover network suggestions and efficiently manage follower/following dynamics.

### 🛡️ Security & Scalability
- **Robust Security:** JWT-based access and refresh tokens, bcrypt password hashing.
- **Data Protection:** Secrets securely managed through environment variables; robust error handling.

---

## 🛠 Architecture & Tech Stack

SkillLinked follows a robust, decoupled **Client-Server** architecture to ensure high scalability and optimal performance.

### 🖥️ Client (Frontend)
- **Core:** React 18, Vite
- **State Management:** Redux Toolkit
- **Routing:** React Router v6
- **Styling:** Tailwind CSS, Framer Motion (for fluid, dynamic animations)
- **Real-Time:** Socket.io Client
- **Authentication:** Google OAuth (`@react-oauth/google`)

### ⚙️ Server (Backend)
- **Core:** Node.js, Express.js
- **Database:** MongoDB & Mongoose (ODM)
- **Real-Time Engine:** Socket.io
- **Authentication:** JSON Web Tokens (JWT), bcrypt.js
- **File Management:** Multer & Cloudinary Integration

---

## 📂 Project Structure

A high-level overview of the repository structure:

```text
skilllinked/
├── client/                     # Frontend React Application
│   ├── public/                 # Static assets
│   ├── src/
│   │   ├── assets/             # Images, SVGs, etc.
│   │   ├── components/         # Reusable UI components
│   │   ├── features/           # Redux slices and state management
│   │   ├── pages/              # Route components (Dashboard, Login, etc.)
│   │   ├── services/           # API calls and Axios instances
│   │   ├── App.jsx             # Main application component
│   │   └── main.jsx            # React entry point
│   └── package.json
│
├── server/                     # Backend Express Application
│   ├── src/
│   │   ├── config/             # DB & third-party integrations
│   │   ├── controllers/        # Request handlers
│   │   ├── middlewares/        # Custom middlewares
│   │   ├── models/             # Mongoose schemas
│   │   ├── routes/             # API routes
│   │   └── server.js           # Express app entry point
│   └── package.json
│
├── docs/                       # Documentation and assets
│   └── screenshots/            # Project screenshots
└── README.md
```

---

## 🚀 Getting Started

Follow these instructions to set up the project locally on your machine.

### Prerequisites

Ensure you have the following installed:
- Node.js (v18.0.0 or higher)
- MongoDB (Local instance or MongoDB Atlas URI)
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone <REPOSITORY_URL>
   cd skilllinked
   ```

2. **Setup the Backend Server**
   ```bash
   cd server
   npm install
   npm run dev
   ```
   > The API will run on `http://localhost:5001/api`

3. **Setup the Frontend Client**
   ```bash
   cd ../client
   npm install
   npm run dev
   ```
   > The application will run on `http://localhost:5173`

---

## 🔐 Environment Variables

To keep your data secure, **NEVER** commit your `.env` files to GitHub. 

**`/server/.env`**
```env
PORT=5001
NODE_ENV=development
MONGO_URI=<YOUR_MONGODB_CONNECTION_STRING>
JWT_SECRET=<YOUR_SECURE_JWT_ACCESS_SECRET>
JWT_REFRESH_SECRET=<YOUR_SECURE_JWT_REFRESH_SECRET>
GOOGLE_CLIENT_ID=<YOUR_GOOGLE_CLIENT_ID>
```

**`/client/.env`**
```env
VITE_API_BASE_URL=http://localhost:5001/api
VITE_GOOGLE_CLIENT_ID=<YOUR_GOOGLE_CLIENT_ID>
```

---

## 📜 License

Distributed under the MIT License. See `LICENSE` for more information.

---

<div align="center">
  <br/>
  <h3>Developed by the SkillLinked Team</h3>
  <p>Innovating Professional Networking</p>
</div>
