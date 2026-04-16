# 🎓 NSMP — National Scholarship Matching Portal
**Full-Stack Application | Backend + Frontend Separate**

---

## 📁 Project Structure

```
nsmp/
├── backend/              ← Node.js + Express API
│   ├── data/
│   │   └── db.js         ← In-memory data store + 14 scholarships
│   ├── middleware/
│   │   └── auth.js       ← JWT auth + admin guard
│   ├── routes/
│   │   ├── auth.js       ← Register, Login, Profile
│   │   ├── scholarships.js ← CRUD + AI matching
│   │   ├── applications.js ← Apply, Status, Admin review
│   │   └── users.js      ← Students, Notifications, Analytics
│   ├── server.js         ← Express app entry
│   └── package.json
│
└── frontend/             ← React + Vite
    ├── src/
    │   ├── App.jsx       ← Routes + guards
    │   ├── main.jsx      ← Entry point
    │   ├── context/
    │   │   └── AuthContext.jsx    ← Auth state + JWT
    │   ├── utils/
    │   │   └── api.js    ← Axios + API helpers
    │   ├── components/
    │   │   ├── ui/index.jsx       ← 20+ reusable components
    │   │   ├── layout/AppLayout.jsx ← Sidebar + Topbar
    │   │   └── Chatbot.jsx        ← AI chatbot
    │   ├── pages/
    │   │   ├── Landing.jsx        ← Public homepage
    │   │   ├── Auth.jsx           ← Login + Register
    │   │   ├── student/
    │   │   │   ├── Dashboard.jsx  ← Student home
    │   │   │   ├── Browse.jsx     ← Browse scholarships
    │   │   │   └── StudentPages.jsx ← Matches, Applications, Profile, Docs
    │   │   └── admin/
    │   │       └── AdminPages.jsx ← All 6 admin pages
    │   └── styles/
    │       └── main.css   ← Complete design system
    ├── index.html
    ├── vite.config.js     ← Proxy to backend :5000
    └── package.json
```

---

## 🚀 Quick Start

### Terminal 1 — Backend
```bash
cd backend
npm install
node server.js
# Runs at http://localhost:5000
```

### Terminal 2 — Frontend
```bash
cd frontend
npm install
npm run dev
# Runs at http://localhost:3000
```

---

## 🔐 Login Credentials

| Role | Email | Password |
|------|-------|----------|
| **Admin** | admin@nsmp.gov.in | admin123 |
| **Student** | Register → OTP: **1234** | (your choice) |

---

## 🛠️ Tech Stack

| | Backend | Frontend |
|---|---------|---------|
| Language | Node.js | React 18 |
| Framework | Express.js | Vite 5 |
| Auth | JWT (jsonwebtoken) | Context API |
| Password | bcryptjs | — |
| HTTP | REST API | Axios |
| Fonts | — | Cabinet Grotesk + Satoshi |
| AI | — | Anthropic Claude API |

---

## 🌐 API Endpoints

### Auth
- `POST /api/auth/register` — Register new student
- `POST /api/auth/login` — Login and get JWT token
- `GET /api/auth/me` — Get current user
- `PUT /api/auth/profile` — Update profile

### Scholarships
- `GET /api/scholarships` — List with search/filter/sort
- `GET /api/scholarships/:id` — Single scholarship
- `GET /api/scholarships/match/me` — AI match for current user
- `POST /api/scholarships` — Create (admin only)
- `PUT /api/scholarships/:id` — Update (admin only)
- `DELETE /api/scholarships/:id` — Delete (admin only)

### Applications
- `GET /api/applications/my` — Student's applications
- `GET /api/applications` — All applications (admin)
- `POST /api/applications` — Apply to scholarship
- `PATCH /api/applications/:id/status` — Update status (admin)

### Users
- `GET /api/users` — All students (admin)
- `GET /api/users/analytics` — Portal analytics (admin)
- `GET /api/users/notifications` — My notifications
- `PATCH /api/users/notifications/:id/read` — Mark read
- `PATCH /api/users/notifications/read-all` — Mark all read

---

## ✨ Features

### Student Portal
- Register with OTP email verification (OTP: 1234 in demo)
- Profile with marks, category, income, course, state, disability
- Browse 14+ scholarships with search & multi-filter
- AI Smart Matching — 7-factor scoring algorithm
- One-click apply, track application timeline
- AI Chatbot (Claude API)
- Personalized AI scholarship strategy
- Document upload with checklist

### Admin Panel
- All student management + analytics dashboard
- Add, edit, delete scholarships
- Review/Approve/Reject applications with notes
- Fraud detection with AI analysis
- Real-time notification system
