# GST SETU SYSTEM — Autonomous Tax Audit Swarm (ATAS) 🤖📊

An AI-powered, multi-agent autonomous tax audit swarm designed to streamline invoice auditing, ledger reconciliation, anomaly detection, and tax compliance checks.

---

## 🏛️ System Architecture

```text
                    ┌─────────────────────────────┐
                    │      GST SETU SYSTEM        │
                    │   AI-Powered GST Auditing   │
                    └──────────────┬──────────────┘
                                   │
                                   ▼
                    ┌─────────────────────────────┐
                    │     FastAPI Orchestrator    │
                    │        (Manager Agent)      │
                    │  • Receives Invoice & Data  │
                    │  • Coordinates Agents       │
                    │  • Controls Workflow        │
                    └──────────────┬──────────────┘
                                   │
                 ┌─────────────────┼─────────────────┐
                 │                 │                 │
                 ▼                 ▼                 ▼
       ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
       │ Agent 1         │ │ Agent 2         │ │ Agent 3         │
       │ Vision          │ │ Ledger          │ │ Tax             │
       │ Extractor       │ │ Detective       │ │ Inspector       │
       ├─────────────────┤ ├─────────────────┤ ├─────────────────┤
       │ Tool: Gemini    │ │ Tool: Database  │ │ Tool: ChromaDB  │
       │ Vision          │ │                 │ │ + RAG           │
       │                 │ │                 │ │                 │
       │ Task: Extract   │ │ Task: Cross-    │ │ Task: Verify    │
       │ invoice data    │ │ check vendor &  │ │ tax calculations│
       │ from messy      │ │ internal ledger │ │ against GST     │
       │ invoices        │ │ data            │ │ laws            │
       └────────┬────────┘ └────────┬────────┘ └────────┬────────┘
                │                   │                   │
                └───────────────────┼───────────────────┘
                                    │
                                    ▼
                       ┌─────────────────────────┐
                       │    Audit & Decision     │
                       │         Engine          │
                       ├─────────────────────────┤
                       │ • Valid Invoice         │
                       │ • Vendor Mismatch       │
                       │ • Tax Mismatch          │
                       │ • Suspicious Invoice    │
                       └────────────┬────────────┘
                                    │
                                    ▼
                       ┌─────────────────────────┐
                       │   Explainable Audit     │
                       │         Report          │
                       ├─────────────────────────┤
                       │ • Extracted Data        │
                       │ • Detected Anomalies    │
                       │ • Tax Calculation       │
                       │ • GST Law Citations     │
                       │ • Final Audit Status    │
                       └─────────────────────────┘
```

---

## 🔄 Audit Workflow Pipeline

```text
Invoice
   ↓
Vision Extractor
   ↓
Structured Invoice Data
   ↓
Ledger Detective
   ↓
Vendor Verification
   ↓
Tax Inspector + RAG
   ↓
GST Calculation & Law Verification
   ↓
Audit Decision
   ↓
Explainable Audit Report
```

---

## 🌟 Key Features

- **Multi-Agent Swarm Architecture**:
  - **Agent 1: Vision Extractor** – Extracts invoice data (vendor name, invoice number, line items, totals, dates) from PDFs and messy invoices using Gemini Vision models.
  - **Agent 2: Ledger Detective** – Cross-checks extracted invoices against historical ledger entries and bank transaction statements to flag discrepancies, ghost invoices, or price alterations.
  - **Agent 3: Tax Inspector (RAG)** – Queries ChromaDB vector store with tax regulations and GST/income tax codes to verify rate accuracy, calculate potential penalties, and cite specific legal clauses.
- **Interactive Full-Stack Dashboard**:
  - Audit overview with key health metrics, compliance scores, and risk heatmaps.
  - Granular invoice explorer, vendor risk profiling, and live audit logs.
  - Pipeline stepper showing real-time agent execution states and WebSocket updates.
  - Exportable audit reports and compliance logs.

---

## 🛠️ Tech Stack

```text
───────────────── TECH STACK ─────────────────

Backend       : Python + FastAPI
Vision        : Gemini Vision (google-generativeai)
Database      : PostgreSQL / MongoDB
RAG           : ChromaDB
Frontend      : React 19 + TypeScript + Vite + Tailwind CSS
Architecture  : Multi-Agent AI
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+ recommended)
- Python (v3.10+ recommended)
- Google Gemini API Key
- Neon PostgreSQL / Database connection string

---

### Backend Setup

1. **Navigate to the backend directory**:
   ```bash
   cd backend
   ```

2. **Create and activate a virtual environment**:
   ```bash
   # Windows
   python -m venv venv
   .\venv\Scripts\activate

   # Linux/macOS
   python3 -m venv venv
   source venv/bin/activate
   ```

3. **Install dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

4. **Configure environment variables**:
   Create a `.env` file in the `backend/` directory by copying `.env.example`:
   ```bash
   cp .env.example .env
   ```
   Fill in your configuration:
   ```env
   GEMINI_API_KEY=your_gemini_api_key_here
   NEON_DATABASE_URL=postgresql://user:password@host/dbname?sslmode=require
   ```

5. **Initialize database & RAG knowledge base**:
   ```bash
   python init_db.py
   python init_rag.py
   ```

6. **Run the FastAPI server**:
   ```bash
   uvicorn main:app --reload --port 8000
   ```
   API docs will be available at `http://localhost:8000/docs`.

---

### Frontend Setup

1. **Navigate to the frontend directory**:
   ```bash
   cd frontend
   ```

2. **Install frontend dependencies**:
   ```bash
   npm install
   ```

3. **Start the development server**:
   ```bash
   npm run dev
   ```
   Open `http://localhost:5173` in your browser.

---

## 🔒 Security & Privacy

- Sensitive environment variables (`.env`, `backend/.env`, `frontend/.env`) are excluded from version control via `.gitignore`.
- Always supply your own API keys and database credentials during deployment.

---

## 📄 License

This project is licensed under the MIT License.
