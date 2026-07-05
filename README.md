# Project Analyser Monorepo

Project Analyser is an advanced codebase visualization, static analysis, and AI-assisted documentation platform. It parses codebases (via GitHub URL, ZIP file upload, or local directory paths) to construct architectural maps, trace execution flows, analyze structural health, and generate intelligent onboarding guides.

It is structured as a monorepo containing a Fastify backend, a Next.js frontend, and a shared module.

---

## 🚀 Key Features

*   **Multisource Repository Ingestion**:
    *   **GitHub**: Clones and analyzes public repositories directly.
    *   **ZIP File Upload**: Drag-and-drop repository packages.
    *   **Local Directory Path**: Direct system path scanning with security authorization filters.
*   **AST-based Static Analysis** (via `ts-morph`):
    *   Finds dead code candidates, unused exports, circular dependencies, and large files.
    *   Computes complexity hotspots and overall codebase health scores.
*   **Codebase Dependency Graph & Querying**:
    *   Builds interactive dependency graphs powered by `@xyflow/react` (React Flow) and `dagre`.
    *   Executes advanced graph queries: direct/transitive dependents and dependencies, BFS shortest path discovery between files, and central node detection.
*   **Architecture Layer Detector**:
    *   Classifies and groups files into layers (routes, controllers, services, repositories, databases, etc.).
*   **API Route Inspector & OpenAPI Exporter**:
    *   Identifies API endpoints, methods, middleware, and request lifecycles.
    *   Exports a dynamically generated OpenAPI 3.0 specification.
*   **AI Architect Summary & Developer Onboarding** (via Gemini API):
    *   Generates codebase stack summaries, requests life cycles, authentication reviews, and day-1 developer onboarding guides.
*   **Interactive Codebase Q&A Chat**:
    *   Uses a multi-agent orchestrator with Gemini to answer natural-language questions about the analyzed codebase.
*   **Execution Tracing**:
    *   Simulates and tracks requests as they traverse layers, databases, and controllers.
*   **Business Feature Flow & Subway Map**:
    *   Maps routes to features and visualizes them in an interactive metro-style layout.
*   **Architecture Comparison**:
    *   Compares different runs (e.g., branches or commits) to compute a detailed diff of added/removed/modified files, routes, and dependencies.

---

## 📂 Project Structure

```
projectAnalyser/
├── backend/            # Fastify server, BullMQ worker, and AST/AI analysis modules
├── frontend/           # Next.js app with React Flow, Framer Motion, Zustand & TanStack Query
├── packages/
│   └── shared/         # Shared interfaces, schema validations, and types
├── docker-compose.yml  # Docker environment configurations
└── package.json        # Monorepo workspaces definition
```

---

## 🛠️ Tech Stack

*   **Monorepo**: npm workspaces, TypeScript
*   **Frontend**: Next.js 16/React 19, Tailwind CSS v4, Zustand, Framer Motion, `@xyflow/react`, React Query
*   **Backend**: Node.js (ES Modules), Fastify, BullMQ, Redis, `ts-morph`, Simple Git, Adm-zip
*   **AI Integration**: `@google/generative-ai` (Gemini model series)

---

## ⚙️ Getting Started

### Prerequisites

Ensure you have the following installed on your machine:
*   [Node.js](https://nodejs.org/) (v18+ recommended)
*   [Redis](https://redis.io/) (for background queues and BullMQ)

### Installation

1. Clone or copy this workspace to your system.
2. In the root directory, install all workspace dependencies:
   ```bash
   npm install
   ```

### Configuration

Create a `.env` file inside the `backend` directory using the following variables:

```env
PORT=4000
REDIS_URL=redis://localhost:6379
NODE_ENV=development
STORAGE_DIR=C:/project_analyser_storage
GEMINI_API_KEY=your_gemini_api_key_here
ALLOWED_ORIGINS=http://localhost:3000
FRONTEND_URL=http://localhost:3000
```

### Running the Application

You can run both the frontend and backend in development mode concurrently using the root workspace scripts:

```bash
# Start backend API, BullMQ worker, and frontend Next.js server in parallel
npm run dev
```

Alternatively, you can run individual workspaces:

```bash
# Run Next.js Frontend
npm run dev --workspace=frontend

# Run Fastify API Server
npm run dev --workspace=backend
```

To build and check typescript compilation:
```bash
npm run typecheck
npm run build
```

---

## 🐳 Docker Deployment

The project provides a `docker-compose.yml` out-of-the-box, compiling and orchestrating Redis, the backend server, and the Next.js frontend in a containerized environment.

To spin up the containers:

```bash
docker-compose up --build
```

The services will be exposed at:
*   **Frontend**: `http://localhost:3000`
*   **Backend**: `http://localhost:4000`
*   **Redis**: `http://localhost:6379`
