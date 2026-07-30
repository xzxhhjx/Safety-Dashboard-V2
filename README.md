# Safety Dashboard v3

Construction site safety observation analytics platform. Docker Compose self-hosted stack.

## Architecture

| Layer | Technology |
|-------|-----------|
| Frontend | React 19 + Vite 6 + Tailwind 4 + ECharts 5 |
| Backend | Fastify 5 + mysql2 + JWT |
| Database | MySQL 8 |
| AI | Gemini 2.5 Flash |
| Proxy | Nginx (Alpine) |

## Quick Start

### Prerequisites

- Docker & Docker Compose
- Gemini API key (optional, for AI classification)

### Setup

```bash
# 1. Create env file
cp .env.example .env
# Edit .env with your passwords and API key

# 2. Start all services
docker compose up -d

# 3. Open browser
# Dashboard: http://your-server-ip
# Admin:     http://your-server-ip/admin
```

### Default Admin

- Username: `admin`
- Password: `admin123`

## Project Structure

```
├── docker-compose.yml
├── init.sql                 # MySQL schema + default admin
├── .env.example
├── nginx/                   # Reverse proxy + static serve
│   ├── Dockerfile           #   Multi-stage: builds client + nginx
│   └── nginx.conf
├── server/                  # Fastify REST API
│   ├── Dockerfile
│   └── src/
│       ├── routes/          # auth, observations, stats, awards, feedback, upload, ai
│       ├── lib/             # gemini, classifier, storage
│       └── middleware/      # JWT auth
└── client/                  # React SPA
    └── src/
        ├── pages/           # Dashboard, Admin
        ├── components/      # Charts, DataTable, FilterBar, etc.
        └── hooks/           # useStats, useObservations, useAwards
```

## API Endpoints

### Public

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/observations/stats` | Aggregated chart data |
| GET | `/api/observations` | Paginated list (?page=1&pageSize=50) |
| GET | `/api/observations/:id` | Single observation |
| GET | `/api/awards` | Safety awards ranking |
| POST | `/api/feedback` | Submit feedback |

### Admin (JWT required)

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/auth/login` | Login → JWT token |
| POST | `/api/observations` | Batch insert |
| PUT | `/api/observations/:id` | Update one |
| PUT | `/api/awards` | Batch update awards |
| POST | `/api/upload/excel` | Upload & parse Excel |
| POST | `/api/ai/classify` | Single AI classification |
| POST | `/api/ai/classify-batch` | Batch AI classification |
