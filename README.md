# 🌿 CarbonTwin: Digital Sustainability Command Center

CarbonTwin is an enterprise-grade SaaS platform designed to monitor, simulate, and reduce the digital carbon footprint of modern organizations. It transforms abstract emissions data into actionable insights using AI-driven coaching and gamified engagement.

![CarbonTwin Dashboard Mockup](https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&q=80&w=1200)

## 🚀 Key Features

### 1. 📊 Real-Time Sustainability Dashboard
* **Dynamic Metrics**: Monitor Scope 2 (Digital Ops) and Scope 3 (Employee Lifestyle) emissions in real-time.
* **Impact Visualization**: Interactive charts showing carbon trends, cost savings, and efficiency grades.
* **Live Feed**: Instant updates as employees adopt sustainable digital habits.

### 2. 🤖 AI Eco-Coach (Powered by Groq)
* **Immersive Chat**: A full-page AI assistant (Llama 3.3) that analyzes your specific footprint.
* **Contextual Insights**: Get real-time advice on reducing tab bloat, optimizing AC usage, and digital hygiene.
* **Proactive Nudges**: Automated suggestions to improve your daily Eco-Score.

### 3. 🧪 What-If Simulator
* **Predictive Modeling**: Adjust sliders for video quality, thermostat settings, and open tabs to see projected annual savings.
* **Commit & Apply**: Instantly "Apply to Account" to transform simulations into real-world habit tracking.

### 4. 🏆 Competitive Leaderboard
* **Gamification**: Real-time rankings of employees based on their Eco-Scores and streaks.
* **Badges & Streaks**: Encourage long-term engagement with "Fire Streaks" and performance badges.
* **P2P Trading**: Trade sustainability points with peers to foster a collaborative green culture.

### 5. 📄 Enterprise ESG Reporting
* **Compliance Ready**: Generate ISO 14064-1 compliant CSV reports for auditing.
* **Detailed Logs**: Full activity logs including timestamps, employee impact, and cost-benefit analysis.

### 6. 🎨 Premium Professional UI
* **Dual Theme Support**: Switch between a sleek, high-contrast **Dark Mode** and a clean, professional **Off-White Light Mode**.
* **Glassmorphism Design**: Modern, responsive interface built with Tailwind CSS and Framer Motion.

---

## 🛠️ Technical Stack

**Frontend:**
* **React 18** (Vite)
* **Tailwind CSS** (Styling)
* **Lucide React** (Iconography)
* **Framer Motion** (Animations)
* **Shadcn UI** (Components)

**Backend:**
* **Node.js & Express**
* **MongoDB & Mongoose** (Data Persistence)
* **Redis** (Leaderboard & Metrics Caching)
* **Groq SDK** (High-speed AI Inference)

---

## ⚙️ Installation & Setup

### Prerequisites
* Node.js (v18+)
* MongoDB Atlas Cluster
* Redis Server (Local or Cloud)
* Groq API Key

### 1. Clone & Install
```bash
git clone https://github.com/amanshekhar0/carboncum.git
cd carbontwin
npm install
cd server && npm install
```

### 2. Environment Variables
Create a `.env` file in the `server/` directory:
```env
PORT=3001
MONGO_URI=your_mongodb_uri
GROQ_API_KEY=your_groq_key
REDIS_URL=redis://localhost:6379
FRONTEND_URL=http://localhost:5173
```

### 3. Run Development Servers
**Start Backend:**
```bash
cd server
npm run dev
```

**Start Frontend:**
```bash
cd ..
npm run dev
```

---

## 🛡️ Security & Deployment
* **JWT Authentication**: Secure user sessions.
* **Push Protection**: `.env` and secrets are protected via `.gitignore` and history cleansing.
* **Resilient Architecture**: Fallback MockDB service ensures the dashboard works even during database maintenance.

## 📄 License
Copyright © 2026 CarbonTwin Enterprise. All rights reserved.
