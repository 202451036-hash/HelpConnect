# HelpConnect | Emergency Disaster Response & Assistance Platform

HelpConnect is a mission-critical emergency assistance and disaster response platform designed to bridge the gap between people stranded during crises, volunteer first responders, and coordinating disaster response authorities in real time.

---

## 🚀 Key Features by User Role

### 1. 🆘 Affected Person Portal
- **Rapid Assistance Request Dispatch**: Submit requests for `Food Rations`, `Clean Water`, `Medical & First Aid`, `Temporary Shelter`, `Search & Rescue`, `Warm Clothing`, or `Other`.
- **Geolocation & Coordinate Locking**: Built-in HTML5 GPS detector to accurately locate stranded individuals and send latitude/longitude coordinates directly to responders.
- **Urgency Triaging**: Select priority from `Low`, `Medium`, `High`, to `Critical`.
- **Offline Cellular SMS SOS Beacon (Novel Resilience System)**: Dispatches critical SOS alerts even during total internet / Wi-Fi / mobile data blackouts. Automatically locks hardware GPS coordinates, formats a standardized distress payload (`HC#SOS#...`), and launches native device SMS pre-filled with recipient `112` / `1078`.
- **Real-Time Request Tracking**: Track submitted requests with visual timeline stepper showing status changes, timestamps, and assigned responder details.
- **Live Emergency Broadcasts**: Receive real-time disaster alerts issued by crisis management teams.

### 2. 🤝 Volunteer Responder Portal
- **Assigned Mission Command**: View and execute dispatches assigned specifically to your responder account.
- **Enforced Workflow Progression**: Secure status progression: `Assigned` &rarr; `In Progress` &rarr; `Resolved`.
- **Nearby Emergency Radar**: Geospatial scanner (`GET /api/requests/nearby`) calculating accurate Haversine distances (`distanceKm`) within an interactive 1–100 km radius slider.
- **Emergency Caller Integration**: Direct one-tap call action to reach affected victims.

### 3. 🛡️ Admin Operations Command Center
- **System-Wide Telemetry Dashboard**: Real-time metrics tracking Total Requests, Pending Triage, Resolved Missions, Registered Volunteers, and Active Alerts.
- **Visual Distribution Analytics**: Category breakdown (Food, Water, Medical, etc.) and lifecycle status pipeline bars.
- **Assistance Dispatch Center**: Full searchable and filterable requests table with status overrides and a **Volunteer Assignment Modal**.
- **Inbound Offline SMS Decoder**: Import and decode incoming distress SMS messages received by field control rooms over cellular networks, converting them instantly into active Critical SOS rescue tickets with locked GPS telemetry.
- **Disaster Broadcast Manager**: Issue urgent public warning broadcasts (`Flood`, `Fire`, `Earthquake`, `Cyclone`, `Landslide`, etc.) with customizable severity (`Critical`, `High`, `Medium`, `Low`) and one-click alert deactivation.

---

## 🛠️ Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | React 19, Vite, Lucide Icons, Vanilla CSS Emergency Design System, Google Fonts (*Plus Jakarta Sans* & *Outfit*) |
| **Backend** | Node.js, Express 5.0, MongoDB, Mongoose 8.0, JWT (`jsonwebtoken`), `bcryptjs`, `express-rate-limit`, `express-validator` |
| **Database** | MongoDB with automatic In-Memory fallback for immediate zero-config local development |

---

## ⚡ Quick Start & Local Execution

### 1. Start the Backend Server

```bash
cd backend
npm install
node server.js
```

- **Port**: `http://localhost:5001` (configured on 5001 to prevent conflicts with macOS AirPlay on port 5000).
- **Database**: Connects to `process.env.MONGODB_URI` or seamlessly boots an embedded In-Memory MongoDB server if local MongoDB is not running.
- **Demo Seed**: Automatically seeds demonstration users, sample disaster alerts, and assistance requests on first launch.

### 2. Start the Frontend Application

```bash
cd frontend
npm install
npm run dev
```

- **URL**: `http://localhost:3000`
- **Proxy**: `/api` routes are automatically forwarded to `http://localhost:5001`.

---

## 🔑 Demonstration Accounts

The platform includes convenient **quick demo login buttons** in the Sign In modal:

| Role | Email | Password | Primary Dashboard |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin@helpconnect.local` | `Password123!` | Command Analytics, Dispatch Center, Alert Manager |
| **Volunteer** | `volunteer@helpconnect.local` | `Password123!` | Assigned Missions, Nearby Radar |
| **Affected Person** | `affected@helpconnect.local` | `Password123!` | My Requests, Request Aid Form |

*(You can also register new accounts dynamically through the public registration interface).*

---

## 📡 API Endpoints Reference

### Authentication (`/api/auth`)
- `POST /api/auth/register` - Create user (`affected_person` or `volunteer`)
- `POST /api/auth/login` - Authenticate with rate limiting (10 attempts / 15m)
- `GET /api/auth/me` - Re-verify active token and get profile
- `GET /api/auth/volunteers` - Admin only: List all registered volunteers

### Assistance Requests (`/api/requests`)
- `POST /api/requests` - Submit new assistance request
- `POST /api/requests/sos` - Dispatch emergency SOS beacon (Water, Earth, Fire)
- `POST /api/requests/sms-ingest` - Admin/Volunteer: Decode & import inbound offline SMS distress beacon
- `GET /api/requests` - List requests (role-scoped, paginated, filterable by status/type/search)
- `GET /api/requests/nearby` - Geospatial discovery within radius (volunteer & admin)
- `GET /api/requests/:id` - Fetch single request with complete `statusHistory`
- `PATCH /api/requests/:id/assign` - Admin only: Assign request to a volunteer
- `PATCH /api/requests/:id/status` - Update status (enforces volunteer progression rules)

### Disaster Alerts (`/api/alerts`)
- `POST /api/alerts` - Admin only: Create new disaster warning broadcast
- `GET /api/alerts` - Fetch all active broadcasts (newest first)
- `PATCH /api/alerts/:id/deactivate` - Admin only: Deactivate an active alert

### Dashboard (`/api/dashboard`)
- `GET /api/dashboard` - Admin only: Telemetry stats and request breakdowns

---

## 🎨 Design System

HelpConnect features a mission-critical emergency theme:
- Deep night command background (`#0A0E17`, `#111827`, `#1A2234`) with radial ambient emergency glows.
- Glassmorphic panels with `backdrop-filter: blur(14px)`.
- Color-coded severity indicators (`Critical` crimson `#EF4444`, `High` orange `#F97316`, `Medium` amber `#F59E0B`, `Low` emerald `#10B981`).
- Fully responsive across desktop, tablet, and mobile views.
