# Eliminition
A Multi-Platform Safety Suite for Parents, Guardians, and Families

Eliminition is a platform-agnostic collection of web and mobile applications designed to help protect children and dependents. The suite provides tools for communication, safety awareness, identification, and location tracking.

---

## 📦 Overview

Eliminition consists of four integrated applications, each addressing a different aspect of child safety:

1. **Secure Communication Tool** - Encrypted messaging for discreet help-seeking
2. **Location Safety Map** - Data-driven regional safety analysis
3. **Personal Identification Vault** - Secure repository for dependent information
4. **Activity & Location Tracking** - Guardian visibility and emergency context

Each application operates independently while contributing to a unified safety ecosystem.

---

## 🔐 Features

### 1. Secure Communication Tool
A discreet, encrypted communication channel that allows individuals to reach out for help without drawing attention.

- Hidden or silent messaging modes
- Secure routing to guardians or authorities
- Designed for situations where the user fears being monitored

### 2. Location Safety Map
A data-driven map that helps families understand safety risks in specific cities or regions.

**Data sources:**
- U.S. Census data
- Local law enforcement records
- Federal law enforcement databases
- Missing persons databases
- Crime statistics with filtering options

This tool supports informed decision-making for travel, relocation, and daily routines.

### 3. Personal Identification Vault
A secure repository for storing essential identity information about a dependent.

**Current capabilities:**
- Basic personal details (name, date of birth, address)
- Contact information for teachers, caregivers, and regular points of interaction

**Future enhancements:**
- Medical records
- Fingerprints
- DNA reports
- Additional documentation useful to law enforcement

### 4. Activity & Location Tracking
A monitoring tool that provides guardians with visibility into a dependent's movement history.

- Offer context during emergencies
- Provide law enforcement with accurate location history
- Increase peace of mind through transparent tracking

---

## 🛠 Tech Stack

- **Frontend**: JavaScript, Kotlin (56.3%)
- **Backend**: Python (26.2%)
- **Markup & Styling**: HTML (8.9%), CSS (8.6%)

---

## 🧱 Architecture

```
Backend (Azure) ──→ API / Auth ──→ Web App (React / VS Code)
     ↓
  REST / GraphQL
     ↓
Mobile App (Android Studio)
     ↓
  Shared Packages (Business Logic / Schemas / API Contracts)
     ↓
Infrastructure (Azure / CI/CD)
     ↓
Data Storage / Security / Monitoring
```

### ☁️ Azure Deployment Architecture

```
┌─────────────────────────────────────────┐
│         CI/CD Pipeline                  │
│  GitHub Actions → Azure Deployment      │
└─────────────────────────────────────────┘
         ↓
┌─────────────────────────────────────────┐
│         Backend - Azure                 │
├─────────────────────────────────────────┤
│ • Azure Functions API                   │
│ • API Management                        │
│ • Key Vault                             │
│ • Service Bus                           │
│ • Blob Storage                          │
│ • Cosmos DB                             │
└─────────────────────────────────────────┘
         ↓
┌─────────────────────────────────────────┐
│      Infrastructure & Monitoring        │
├─────────────────────────────────────────┤
│ • Azure Monitor                         │
│ • Application Insights                  │
│ • Log Analytics                         │
└─────────────────────────────────────────┘
```

---

## 📁 Repository Structure

```
eliminition/
├── apps/
│   ├── backend/        # Azure Functions / API
│   ├── web/            # Web application (React)
│   └── mobile/         # Android application (Kotlin)
│
├── packages/
│   ├── api-contracts/  # OpenAPI specs & generated clients
│   ├── business-logic/ # Shared domain logic(Python, JS)
│   ├── schemas/        # Validation & data schemas
│   ├── utils/          # Shared utilities
│   └── config/         # Shared linting & formatting configs
│
├── infra/
│   ├── azure/          # Infrastructure-as-code
│   └── ci/             # CI/CD pipelines
│
├── docs/               # Architecture & onboarding
└── README.md
```

---

## ⚙️ Installation & Setup

### Prerequisites
- Node.js (v18+)
- Android Studio (latest)
- Visual Studio Code
- Azure CLI

### Steps

1. **Clone the repository:**
   ```bash
   git clone https://github.com/<your-org>/eliminition.git
   cd eliminition
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure environment variables:**
   ```bash
   cp .env.example .env
   ```

4. **Start the backend server:**
   
   The FastAPI backend runs on `http://localhost:8000`
   
   **Option A: Using VS Code Tasks (Recommended)**
   - Press `Ctrl+Shift+P` (or `Cmd+Shift+P` on Mac)
   - Search for "Tasks: Run Task"
   - Select "Start Backend Server"
   
   **Option B: Manual command**
   ```bash
   # From the project root
   .venv/Scripts/python.exe -m uvicorn apps.childSafetyBackend.main:app --host 0.0.0.0 --port 8000 --reload
   ```
   
   The backend will:
   - Run with auto-reload enabled (changes reflected instantly)
   - Be accessible at `http://0.0.0.0:8000`
   - Expose API documentation at `http://localhost:8000/docs`
   - Provide health check at `http://localhost:8000/health`

5. **Start the web app server:**

   The web app server runs on `http://localhost:3000`

   **Option A: Using VS Code Tasks (Recommended)**
   - Press `Ctrl+Shift+P` (or `Cmd+Shift+P` on Mac)
   - Search for "Tasks: Run Task"
   - Select "Start Web Server (npm.cmd)"

   **Option B: Manual command**
   ```bash
   # From the project root
   cd apps/childSafetyWeb
   npm.cmd run start
   ```

6. **Open the initial page from the running server:**

   - Open `http://localhost:3000` in your browser
   - Do not open `index.html` directly from file explorer (file://), because API requests will fail

7. **Run frontend and backend together (optional):**

   - Use VS Code task "Start Frontend & Backend"

8. **Start development servers (monorepo):**
   ```bash
   npm run dev
   ```

---

## � Backend API

The FastAPI backend provides RESTful endpoints for all applications:

### Available Endpoints

- **Health Check**: `GET /health`
- **Heatmap Overlay**: `GET /v1/heatmaps/overlay?city=Columbus&state=OH&radius_km=8&crime_type=all`
- **Location Resolution**: `GET /v1/locations:resolve?city=Columbus&state=OH`
- **Vault**: Various endpoints under `/v1/vault/*`
- **Tracker**: Various endpoints under `/v1/tracker/*`
- **Communication**: Various endpoints under `/v1/communication/*`

### API Documentation

Interactive API documentation is available at: `http://localhost:8000/docs`

---

## �🚀 Roadmap

- [ ] Expand secure communication features
- [ ] Integrate additional law enforcement data sources
- [ ] Add advanced identity storage (medical, biometric)
- [ ] Enhance tracking accuracy and reporting
- [ ] Introduce guardian dashboards and alerting systems

---

## 🔒 Security & Privacy

Eliminition is designed with privacy and data protection at its core:
- All sensitive data is encrypted at rest and in transit
- Access controls ensure only authorized guardians and verified authorities can view or share information
- Regular security audits and compliance checks

---

## 🤝 Contributing

Contributions are welcome! Please follow these guidelines:

1. Open an issue or submit a pull request to discuss proposed changes
2. Follow the existing code style and linting rules
3. Write clear commit messages
4. Include tests for new features

---

## 📄 License

(Add your license information here.)

---

## 🧠 Mission Statement

Empowering families with technology that safeguards the vulnerable and strengthens community trust.
