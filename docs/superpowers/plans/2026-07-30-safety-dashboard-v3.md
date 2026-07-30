# Safety Dashboard v3 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild Safety Dashboard as React + Fastify + MySQL stack deployed on Docker Compose for Alibaba Cloud lightweight server.

**Architecture:** Three-container Docker Compose (Nginx, Fastify, MySQL). Nginx serves React static files and reverse-proxies `/api/*` to Fastify. Fastify handles all REST API, Gemini AI classification, Excel upload, and image storage.

**Tech Stack:** React 19 + Vite + ECharts + Tailwind CSS (client), Fastify 5 + mysql2 + bcrypt + jsonwebtoken + @google/generative-ai + xlsx + multer (server), MySQL 8, Docker Compose

## Global Constraints

- JavaScript ES Modules throughout (no TypeScript)
- No state management library — React hooks only
- Dashboard GET endpoints are public (no auth)
- Admin write endpoints require JWT (simple password login)
- Images stored at `uploads/observations/{observationId}/{timestamp}-{index}.{ext}`
- Charts use server-side aggregation API (`/api/observations/stats`); table uses server-side pagination (`/api/observations?page=1&pageSize=50`)
- FilterBar controls both charts and table via shared filter state
- Gemini 2.5 Flash with existing 16-category classification prompt
- Keyword-based classification retained as frontend fallback in config
- Default admin account: admin / admin123 (bcrypt-hashed in init.sql)
- Docker Compose `docker compose up -d` must bring up all 3 services

---

## Phase 1: Infrastructure & Scaffolding

### Task 1: Project Root — Docker Compose, init.sql, .env.example

**Files:**
- Create: `docker-compose.yml`
- Create: `.env.example`
- Create: `init.sql`
- Modify: `.gitignore`

**Interfaces:**
- Produces: `docker-compose.yml` defines 3 services (nginx, fastify, mysql) with named volumes
- Produces: `init.sql` creates 4 tables on first MySQL start
- Produces: `.env.example` documents all required env vars

- [ ] **Step 1: Write `.env.example`**

```
# MySQL
MYSQL_ROOT_PASSWORD=change-me-root
MYSQL_DATABASE=safety_dashboard
MYSQL_USER=safety
MYSQL_PASSWORD=change-me-user

# JWT
JWT_SECRET=change-me-to-random-string

# Gemini AI (optional — AI classification disabled if empty)
GEMINI_API_KEY=

# Server
PORT=3001
```

- [ ] **Step 2: Write `init.sql`**

```sql
CREATE TABLE observations (
    id          VARCHAR(50)  PRIMARY KEY,
    hazard      VARCHAR(100),
    status      VARCHAR(50),
    dept        VARCHAR(100),
    description TEXT,
    obs_time    DATETIME,
    submitter   VARCHAR(50),
    obs_type    VARCHAR(50),
    area        VARCHAR(100),
    sub_area    VARCHAR(100),
    who         VARCHAR(200),
    photos      JSON,
    ai_category    VARCHAR(50),
    ai_category_cn VARCHAR(50),
    ai_confidence  VARCHAR(10),
    ai_method      VARCHAR(50),
    ai_reasoning   TEXT,
    ai_analyzed_at DATETIME,
    created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at  DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_obs_time (obs_time),
    INDEX idx_area (area),
    INDEX idx_hazard (hazard),
    INDEX idx_status (status)
);

CREATE TABLE safety_awards (
    id          VARCHAR(50) PRIMARY KEY,
    score       INT DEFAULT 0,
    level       VARCHAR(20) DEFAULT 'normal',
    created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at  DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE feedback (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    type        VARCHAR(20),
    content     TEXT NOT NULL,
    contact     VARCHAR(100),
    created_at  DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE admin_users (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    username    VARCHAR(50) NOT NULL UNIQUE,
    password    VARCHAR(255) NOT NULL
);

-- Default admin: admin / admin123
-- BCrypt hash of "admin123" (10 rounds) — generate fresh with: node -e "require('bcrypt').hash('admin123',10).then(console.log)"
INSERT INTO admin_users (username, password) VALUES ('admin', '$2b$10$placeholder');
```

- [ ] **Step 3: Write `docker-compose.yml`**

```yaml
version: '3.8'

services:
  nginx:
    build: ./nginx
    ports:
      - "80:80"
    volumes:
      - ./data/uploads:/usr/share/nginx/html/uploads:ro
    depends_on:
      - fastify
    restart: unless-stopped

  fastify:
    build: ./server
    environment:
      MYSQL_HOST: mysql
      MYSQL_PORT: 3306
      MYSQL_USER: ${MYSQL_USER}
      MYSQL_PASSWORD: ${MYSQL_PASSWORD}
      MYSQL_DATABASE: ${MYSQL_DATABASE}
      JWT_SECRET: ${JWT_SECRET}
      GEMINI_API_KEY: ${GEMINI_API_KEY}
      PORT: 3001
      UPLOAD_DIR: /app/uploads
    volumes:
      - ./data/uploads:/app/uploads
    depends_on:
      mysql:
        condition: service_healthy
    restart: unless-stopped

  mysql:
    image: mysql:8
    environment:
      MYSQL_ROOT_PASSWORD: ${MYSQL_ROOT_PASSWORD}
      MYSQL_DATABASE: ${MYSQL_DATABASE}
      MYSQL_USER: ${MYSQL_USER}
      MYSQL_PASSWORD: ${MYSQL_PASSWORD}
    volumes:
      - ./data/mysql:/var/lib/mysql
      - ./init.sql:/docker-entrypoint-initdb.d/01-init.sql
    healthcheck:
      test: ["CMD", "mysqladmin", "ping", "-h", "localhost"]
      interval: 5s
      timeout: 3s
      retries: 10
    restart: unless-stopped

volumes:
  mysql_data:
  uploads_data:
```

- [ ] **Step 4: Update `.gitignore`**

```
.env
node_modules/
dist/
data/
.vscode/
*.log
```

- [ ] **Step 5: Commit**

```bash
git add docker-compose.yml .env.example init.sql .gitignore
git commit -m "feat: add Docker Compose, MySQL init, env template"
```

---

### Task 2: Fastify Server Scaffold

**Files:**
- Create: `server/package.json`
- Create: `server/Dockerfile`
- Create: `server/src/index.js`
- Create: `server/src/config.js`

**Interfaces:**
- Produces: Fastify server listening on PORT env var with health check route

- [ ] **Step 1: Write `server/package.json`**

```json
{
  "name": "safety-dashboard-server",
  "version": "3.0.0",
  "type": "module",
  "scripts": {
    "start": "node src/index.js",
    "dev": "node --watch src/index.js"
  },
  "dependencies": {
    "@fastify/cors": "^10.0.0",
    "@fastify/multipart": "^9.0.0",
    "@google/generative-ai": "^0.21.0",
    "bcrypt": "^5.1.1",
    "fastify": "^5.0.0",
    "jsonwebtoken": "^9.0.2",
    "mysql2": "^3.11.0",
    "xlsx": "^0.18.5"
  }
}
```

- [ ] **Step 2: Write `server/Dockerfile`**

```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package.json ./
RUN npm install --production
COPY src/ ./src/
RUN mkdir -p /app/uploads
EXPOSE 3001
CMD ["node", "src/index.js"]
```

- [ ] **Step 3: Write `server/src/config.js`**

```javascript
export const config = {
  port: parseInt(process.env.PORT) || 3001,
  jwtSecret: process.env.JWT_SECRET || 'dev-secret-change-me',
  geminiApiKey: process.env.GEMINI_API_KEY || '',
  uploadDir: process.env.UPLOAD_DIR || './uploads',
  mysql: {
    host: process.env.MYSQL_HOST || 'localhost',
    port: parseInt(process.env.MYSQL_PORT) || 3306,
    user: process.env.MYSQL_USER || 'safety',
    password: process.env.MYSQL_PASSWORD || '',
    database: process.env.MYSQL_DATABASE || 'safety_dashboard',
  },
};
```

- [ ] **Step 4: Write `server/src/index.js`**

```javascript
import Fastify from 'fastify';
import cors from '@fastify/cors';
import { config } from './config.js';

const app = Fastify({ logger: true });

await app.register(cors, { origin: true });

// Health check
app.get('/api/health', async () => ({ status: 'ok', timestamp: new Date().toISOString() }));

try {
  await app.listen({ port: config.port, host: '0.0.0.0' });
  console.log(`Server running on port ${config.port}`);
} catch (err) {
  app.log.error(err);
  process.exit(1);
}
```

- [ ] **Step 5: Test health endpoint**

```bash
cd server && npm install && npm run dev
# In another terminal: curl http://localhost:3001/api/health
# Expected: {"status":"ok","timestamp":"..."}
```

- [ ] **Step 6: Commit**

```bash
git add server/package.json server/Dockerfile server/src/config.js server/src/index.js
git commit -m "feat: scaffold Fastify server with health check"
```

---

### Task 3: React Client Scaffold

**Files:**
- Create: `client/package.json`
- Create: `client/vite.config.js`
- Create: `client/index.html`
- Create: `client/Dockerfile`
- Create: `client/src/main.jsx`
- Create: `client/src/App.jsx`
- Create: `client/src/styles/index.css`

**Interfaces:**
- Produces: Vite React app with Tailwind CSS, React Router, two routes (`/` and `/admin`)

- [ ] **Step 1: Write `client/package.json`**

```json
{
  "name": "safety-dashboard-client",
  "version": "3.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "axios": "^1.7.7",
    "echarts": "^5.5.1",
    "echarts-wordcloud": "^2.1.0",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "react-router-dom": "^7.0.0",
    "xlsx": "^0.18.5"
  },
  "devDependencies": {
    "@tailwindcss/vite": "^4.0.0",
    "@vitejs/plugin-react": "^4.3.0",
    "tailwindcss": "^4.0.0",
    "vite": "^6.0.0"
  }
}
```

- [ ] **Step 2: Write `client/vite.config.js`**

```javascript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    proxy: {
      '/api': 'http://localhost:3001',
      '/uploads': 'http://localhost:3001',
    },
  },
  build: {
    outDir: 'dist',
  },
});
```

- [ ] **Step 3: Write `client/index.html`**

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Safety Dashboard</title>
</head>
<body class="bg-gray-950 text-white min-h-screen">
  <div id="root"></div>
  <script type="module" src="/src/main.jsx"></script>
</body>
</html>
```

- [ ] **Step 4: Write `client/Dockerfile`**

```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package.json ./
RUN npm install
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
```

_(Note: This Dockerfile builds React and places it in a bare nginx image. The `nginx/` directory Dockerfile in Task 22 will extend this with the nginx.conf that includes the proxy config.)_

- [ ] **Step 5: Write `client/src/styles/index.css`**

```css
@import "tailwindcss";

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.glass-card {
  @apply bg-gray-900/80 backdrop-blur-md border border-gray-800 rounded-xl p-4;
}
```

- [ ] **Step 6: Write `client/src/main.jsx`**

```jsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import './styles/index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);
```

- [ ] **Step 7: Write `client/src/App.jsx`**

```jsx
import { Routes, Route } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import Admin from './pages/Admin';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Dashboard />} />
      <Route path="/admin" element={<Admin />} />
    </Routes>
  );
}
```

- [ ] **Step 8: Write placeholder pages**

```jsx
// client/src/pages/Dashboard.jsx
export default function Dashboard() {
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-8">Safety Dashboard</h1>
      <p className="text-gray-400">Loading...</p>
    </div>
  );
}
```

```jsx
// client/src/pages/Admin.jsx
export default function Admin() {
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-8">Admin Panel</h1>
      <p className="text-gray-400">Loading...</p>
    </div>
  );
}
```

- [ ] **Step 9: Test client dev server**

```bash
cd client && npm install && npm run dev
# Open http://localhost:5173 — should see Dashboard placeholder
# Open http://localhost:5173/admin — should see Admin placeholder
```

- [ ] **Step 10: Test client build**

```bash
cd client && npm run build
# dist/ folder should be generated with index.html and assets
```

- [ ] **Step 11: Commit**

```bash
git add client/
git commit -m "feat: scaffold React client with Vite, Tailwind, React Router"
```

---

## Phase 2: Backend Core

### Task 4: MySQL Connection Pool

**Files:**
- Create: `server/src/db.js`

**Interfaces:**
- Produces: `pool` (mysql2/promise connection pool) — imported by all route files

- [ ] **Step 1: Write `server/src/db.js`**

```javascript
import mysql from 'mysql2/promise';
import { config } from './config.js';

export const pool = mysql.createPool({
  host: config.mysql.host,
  port: config.mysql.port,
  user: config.mysql.user,
  password: config.mysql.password,
  database: config.mysql.database,
  waitForConnections: true,
  connectionLimit: 10,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
});
```

- [ ] **Step 2: Add DB test route to `server/src/index.js`**

```javascript
// ADD after health check route:
import { pool } from './db.js';

app.get('/api/health/db', async () => {
  const [rows] = await pool.query('SELECT 1 AS ok');
  return { db: rows[0].ok === 1 ? 'connected' : 'error' };
});
```

- [ ] **Step 3: Test with MySQL running**

_(Start MySQL first for testing: `docker compose up -d mysql` then test)_

- [ ] **Step 4: Commit**

```bash
git add server/src/db.js server/src/index.js
git commit -m "feat: add MySQL connection pool"
```

---

### Task 5: Auth Route — JWT Login

**Files:**
- Create: `server/src/routes/auth.js`
- Create: `server/src/middleware/auth.js`
- Modify: `server/src/index.js`

**Interfaces:**
- Produces: `POST /api/auth/login` — validates credentials, returns `{ token }`
- Produces: `authMiddleware` — Fastify preHandler that verifies JWT, attaches `req.user`

- [ ] **Step 1: Write `server/src/middleware/auth.js`**

```javascript
import jwt from 'jsonwebtoken';
import { config } from '../config.js';

export async function authMiddleware(request, reply) {
  const header = request.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return reply.status(401).send({ error: 'Missing or invalid token' });
  }
  try {
    const payload = jwt.verify(header.slice(7), config.jwtSecret);
    request.user = payload;
  } catch {
    return reply.status(401).send({ error: 'Token expired or invalid' });
  }
}
```

- [ ] **Step 2: Write `server/src/routes/auth.js`**

```javascript
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { pool } from '../db.js';
import { config } from '../config.js';

export default async function authRoutes(app) {
  app.post('/api/auth/login', async (request, reply) => {
    const { username, password } = request.body || {};

    if (!username || !password) {
      return reply.status(400).send({ error: 'Username and password required' });
    }

    const [rows] = await pool.query(
      'SELECT id, username, password FROM admin_users WHERE username = ?',
      [username]
    );

    if (rows.length === 0) {
      return reply.status(401).send({ error: 'Invalid credentials' });
    }

    const user = rows[0];
    const valid = await bcrypt.compare(password, user.password);

    if (!valid) {
      return reply.status(401).send({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: user.id, username: user.username },
      config.jwtSecret,
      { expiresIn: '24h' }
    );

    return { token };
  });
}
```

- [ ] **Step 3: Register auth routes in `server/src/index.js`**

```javascript
// ADD near other route registrations:
import authRoutes from './routes/auth.js';
await authRoutes(app);
```

- [ ] **Step 4: Test**

_(Generate bcrypt hash for "admin123" and insert into MySQL manually for testing:)_

```bash
# Generate hash:
node -e "require('bcrypt').hash('admin123', 10).then(h => console.log(h))"

# Test login:
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'
# Expected: {"token":"eyJ..."}
```

- [ ] **Step 5: Commit**

```bash
git add server/src/routes/auth.js server/src/middleware/auth.js server/src/index.js
git commit -m "feat: add auth route with JWT login"
```

---

### Task 6: Observations Routes — CRUD + Stats

**Files:**
- Create: `server/src/routes/observations.js`
- Create: `server/src/routes/stats.js`
- Modify: `server/src/index.js`

**Interfaces:**
- Produces: `GET /api/observations` — paginated list with filters
- Produces: `GET /api/observations/:id` — single record
- Produces: `POST /api/observations` — batch insert (JWT protected)
- Produces: `PUT /api/observations/:id` — update single (JWT protected)
- Produces: `GET /api/observations/stats` — aggregated statistics with filters

- [ ] **Step 1: Write `server/src/routes/observations.js`**

```javascript
import { pool } from '../db.js';
import { authMiddleware } from '../middleware/auth.js';

export default async function observationRoutes(app) {
  // GET paginated list
  app.get('/api/observations', async (request, reply) => {
    const {
      page = 1,
      pageSize = 50,
      status,
      area,
      hazard,
      keyword,
      startDate,
      endDate,
    } = request.query;

    const offset = (parseInt(page) - 1) * parseInt(pageSize);
    const conditions = [];
    const params = [];

    if (status) {
      conditions.push('status = ?');
      params.push(status);
    }
    if (area) {
      conditions.push('area = ?');
      params.push(area);
    }
    if (hazard) {
      conditions.push('hazard = ?');
      params.push(hazard);
    }
    if (keyword) {
      conditions.push('(description LIKE ? OR who LIKE ? OR submitter LIKE ?)');
      const kw = `%${keyword}%`;
      params.push(kw, kw, kw);
    }
    if (startDate) {
      conditions.push('obs_time >= ?');
      params.push(startDate);
    }
    if (endDate) {
      conditions.push('obs_time <= ?');
      params.push(endDate);
    }

    const where = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : '';

    const [countResult] = await pool.query(
      `SELECT COUNT(*) AS total FROM observations ${where}`,
      params
    );
    const total = countResult[0].total;

    const [data] = await pool.query(
      `SELECT * FROM observations ${where} ORDER BY obs_time DESC LIMIT ? OFFSET ?`,
      [...params, parseInt(pageSize), offset]
    );

    return { data, total, page: parseInt(page), pageSize: parseInt(pageSize) };
  });

  // GET single
  app.get('/api/observations/:id', async (request, reply) => {
    const [rows] = await pool.query('SELECT * FROM observations WHERE id = ?', [request.params.id]);
    if (rows.length === 0) {
      return reply.status(404).send({ error: 'Not found' });
    }
    return rows[0];
  });

  // POST batch insert (admin)
  app.post('/api/observations', { preHandler: [authMiddleware] }, async (request, reply) => {
    const records = request.body;
    if (!Array.isArray(records) || records.length === 0) {
      return reply.status(400).send({ error: 'Array of observation records required' });
    }

    const fields = [
      'id', 'hazard', 'status', 'dept', 'description', 'obs_time',
      'submitter', 'obs_type', 'area', 'sub_area', 'who', 'photos',
      'ai_category', 'ai_category_cn', 'ai_confidence', 'ai_method',
      'ai_reasoning', 'ai_analyzed_at',
    ];

    let inserted = 0;
    let updated = 0;

    for (const record of records) {
      if (!record.id) continue;
      const values = fields.map(f => record[f] ?? null);
      const placeholders = fields.map(() => '?').join(', ');
      const updates = fields.map(f => `${f} = VALUES(${f})`).join(', ');

      await pool.query(
        `INSERT INTO observations (${fields.join(', ')}) VALUES (${placeholders})
         ON DUPLICATE KEY UPDATE ${updates}`,
        values
      );
      // Track insert vs update (simplified — always counts as success)
      inserted++;
    }

    return { success: true, count: inserted };
  });

  // PUT update single (admin)
  app.put('/api/observations/:id', { preHandler: [authMiddleware] }, async (request, reply) => {
    const allowedFields = [
      'hazard', 'status', 'dept', 'description', 'obs_time',
      'submitter', 'obs_type', 'area', 'sub_area', 'who', 'photos',
      'ai_category', 'ai_category_cn', 'ai_confidence', 'ai_method',
      'ai_reasoning', 'ai_analyzed_at',
    ];

    const sets = [];
    const values = [];
    for (const [key, val] of Object.entries(request.body)) {
      if (allowedFields.includes(key)) {
        sets.push(`${key} = ?`);
        values.push(val);
      }
    }

    if (sets.length === 0) {
      return reply.status(400).send({ error: 'No valid fields to update' });
    }

    values.push(request.params.id);
    await pool.query(
      `UPDATE observations SET ${sets.join(', ')} WHERE id = ?`,
      values
    );

    return { success: true };
  });
}
```

- [ ] **Step 2: Write `server/src/routes/stats.js`**

```javascript
import { pool } from '../db.js';

export default async function statsRoutes(app) {
  app.get('/api/observations/stats', async (request, reply) => {
    const { status, area, hazard, startDate, endDate } = request.query;

    const conditions = [];
    const params = [];

    if (status) { conditions.push('status = ?'); params.push(status); }
    if (area) { conditions.push('area = ?'); params.push(area); }
    if (hazard) { conditions.push('hazard = ?'); params.push(hazard); }
    if (startDate) { conditions.push('obs_time >= ?'); params.push(startDate); }
    if (endDate) { conditions.push('obs_time <= ?'); params.push(endDate); }

    const where = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : '';

    // Total count
    const [[{ totalCount }]] = await pool.query(`SELECT COUNT(*) AS totalCount FROM observations ${where}`, params);

    // Closed count
    const [[{ closedCount }]] = await pool.query(
      `SELECT COUNT(*) AS closedCount FROM observations ${where} ${conditions.length ? 'AND' : 'WHERE'} status IN ('Closed', '已关闭', 'Done')`,
      params
    );

    // Active areas
    const [[{ areaCount }]] = await pool.query(
      `SELECT COUNT(DISTINCT area) AS areaCount FROM observations ${where}`,
      params
    );

    // This month new
    const [[{ monthNew }]] = await pool.query(
      `SELECT COUNT(*) AS monthNew FROM observations ${where}
       ${conditions.length ? 'AND' : 'WHERE'} MONTH(obs_time) = MONTH(CURDATE()) AND YEAR(obs_time) = YEAR(CURDATE())`,
      params
    );

    // Hazard distribution
    const [hazardDist] = await pool.query(
      `SELECT hazard AS name, COUNT(*) AS value FROM observations ${where} GROUP BY hazard ORDER BY value DESC`,
      params
    );

    // Area distribution
    const [areaDist] = await pool.query(
      `SELECT area AS name, COUNT(*) AS value FROM observations ${where} GROUP BY area ORDER BY value DESC`,
      params
    );

    // Department ranking
    const [deptRank] = await pool.query(
      `SELECT dept AS name, COUNT(*) AS value FROM observations ${where} GROUP BY dept ORDER BY value DESC LIMIT 10`,
      params
    );

    // Status distribution
    const [statusDist] = await pool.query(
      `SELECT status AS name, COUNT(*) AS value FROM observations ${where} GROUP BY status`,
      params
    );

    // Monthly trend
    const [monthlyTrend] = await pool.query(
      `SELECT DATE_FORMAT(obs_time, '%Y-%m') AS month, COUNT(*) AS count
       FROM observations ${where} GROUP BY month ORDER BY month ASC`,
      params
    );

    // Submitter ranking
    const [submitterRank] = await pool.query(
      `SELECT submitter AS name, COUNT(*) AS value FROM observations ${where} GROUP BY submitter ORDER BY value DESC LIMIT 10`,
      params
    );

    return {
      totalCount,
      closedRate: totalCount > 0 ? Math.round((closedCount / totalCount) * 100) : 0,
      areaCount,
      monthNew,
      hazardDist,
      areaDist,
      deptRank,
      statusDist,
      monthlyTrend,
      submitterRank,
    };
  });
}
```

- [ ] **Step 3: Register routes in `server/src/index.js`**

```javascript
import observationRoutes from './routes/observations.js';
import statsRoutes from './routes/stats.js';
await observationRoutes(app);
await statsRoutes(app);
```

- [ ] **Step 4: Test**

```bash
# Insert a test record:
curl -X POST http://localhost:3001/api/observations \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '[{"id":"TEST-001","hazard":"PPE","status":"Open","area":"HRSG","obs_time":"2024-01-15"}]'

# Get stats:
curl http://localhost:3001/api/observations/stats

# Get paginated list:
curl "http://localhost:3001/api/observations?page=1&pageSize=10"
```

- [ ] **Step 5: Commit**

```bash
git add server/src/routes/observations.js server/src/routes/stats.js server/src/index.js
git commit -m "feat: add observations CRUD and stats aggregation API"
```

---

### Task 7: Awards API

**Files:**
- Create: `server/src/routes/awards.js`
- Modify: `server/src/index.js`

- [ ] **Step 1: Write `server/src/routes/awards.js`**

```javascript
import { pool } from '../db.js';
import { authMiddleware } from '../middleware/auth.js';

export default async function awardRoutes(app) {
  app.get('/api/awards', async () => {
    const [data] = await pool.query('SELECT * FROM safety_awards ORDER BY score DESC');
    return { data };
  });

  app.put('/api/awards', { preHandler: [authMiddleware] }, async (request, reply) => {
    const awards = request.body;
    if (!Array.isArray(awards)) {
      return reply.status(400).send({ error: 'Array of award records required' });
    }

    for (const a of awards) {
      await pool.query(
        `INSERT INTO safety_awards (id, score, level) VALUES (?, ?, ?)
         ON DUPLICATE KEY UPDATE score = VALUES(score), level = VALUES(level)`,
        [a.id, a.score || 0, a.level || 'normal']
      );
    }

    return { success: true, count: awards.length };
  });
}
```

- [ ] **Step 2: Register in `server/src/index.js`**

```javascript
import awardRoutes from './routes/awards.js';
await awardRoutes(app);
```

- [ ] **Step 3: Commit**

```bash
git add server/src/routes/awards.js server/src/index.js
git commit -m "feat: add safety awards API"
```

---

### Task 8: Feedback API

**Files:**
- Create: `server/src/routes/feedback.js`
- Modify: `server/src/index.js`

- [ ] **Step 1: Write `server/src/routes/feedback.js`**

```javascript
import { pool } from '../db.js';

export default async function feedbackRoutes(app) {
  app.post('/api/feedback', async (request, reply) => {
    const { type, content, contact } = request.body || {};

    if (!content || !content.trim()) {
      return reply.status(400).send({ error: 'Content is required' });
    }

    await pool.query(
      'INSERT INTO feedback (type, content, contact) VALUES (?, ?, ?)',
      [type || 'other', content.trim(), contact || '']
    );

    return { success: true };
  });
}
```

- [ ] **Step 2: Register in `server/src/index.js`**

```javascript
import feedbackRoutes from './routes/feedback.js';
await feedbackRoutes(app);
```

- [ ] **Step 3: Commit**

```bash
git add server/src/routes/feedback.js server/src/index.js
git commit -m "feat: add feedback API"
```

---

### Task 9: Excel Upload & Parse

**Files:**
- Create: `server/src/routes/upload.js`
- Modify: `server/src/index.js`

- [ ] **Step 1: Write `server/src/routes/upload.js`**

```javascript
import { pool } from '../db.js';
import { authMiddleware } from '../middleware/auth.js';
import xlsx from 'xlsx';

export default async function uploadRoutes(app) {
  app.post('/api/upload/excel', { preHandler: [authMiddleware] }, async (request, reply) => {
    const file = await request.file();

    if (!file) {
      return reply.status(400).send({ error: 'No file uploaded' });
    }

    const buffer = await file.toBuffer();
    const workbook = xlsx.read(buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const rows = xlsx.utils.sheet_to_json(sheet, { defval: '' });

    // Map Excel columns to DB columns using keyword matching
    const COL_KEYS = {
      id: ['序号', 'No', 'id', 'ID', '编号', '单据流水号'],
      hazard: ['Type of hazard', '隐患分类', '观察项目', '问题类型'],
      status: ['Status of the finding', '观察项状态', 'Status', '状态', 'Finding Status', '情况', '观察状态', '处理进度'],
      dept: ['Company', 'Department', '单位', '部门', '单位/部门'],
      description: ['Description', '观察项描述', '观察描述'],
      obs_time: ['提交时间', 'Time', 'Date', '日期', '发起时间'],
      submitter: ['Created by', 'Submitter', '填报人', '提交人', '1.', 'NAME', '姓名', 'Name', '观察人姓名'],
      obs_type: ['Type of the observation', '观察项分类', '观察者类型'],
      area: ['Where', 'Area', '区域', '具体位置'],
      who: ['Who', 'Personnel', 'involved', '当事人', '涉及人员', '责任人'],
      photos: ['Photo', '图片', '现场照片'],
    };

    function findCol(row, keys) {
      for (const key of keys) {
        for (const col of Object.keys(row)) {
          if (col.toLowerCase().includes(key.toLowerCase())) return col;
        }
      }
      return null;
    }

    const colMap = {};
    if (rows.length > 0) {
      for (const [field, keys] of Object.entries(COL_KEYS)) {
        colMap[field] = findCol(rows[0], keys);
      }
    }

    const records = rows.map((row, idx) => ({
      id: (colMap.id && row[colMap.id]) ? String(row[colMap.id]) : `AUTO-${idx + 1}`,
      hazard: colMap.hazard ? row[colMap.hazard] : null,
      status: colMap.status ? row[colMap.status] : null,
      dept: colMap.dept ? row[colMap.dept] : null,
      description: colMap.description ? row[colMap.description] : null,
      obs_time: colMap.obs_time ? parseDate(row[colMap.obs_time]) : null,
      submitter: colMap.submitter ? row[colMap.submitter] : null,
      obs_type: colMap.obs_type ? row[colMap.obs_type] : null,
      area: colMap.area ? row[colMap.area] : null,
      who: colMap.who ? row[colMap.who] : null,
      photos: colMap.photos ? parsePhotos(row[colMap.photos]) : [],
    })).filter(r => r.hazard || r.description);

    const fields = [
      'id', 'hazard', 'status', 'dept', 'description', 'obs_time',
      'submitter', 'obs_type', 'area', 'who', 'photos',
    ];

    let count = 0;
    for (const record of records) {
      if (!record.id) continue;
      const values = fields.map(f => record[f] ?? null);
      const placeholders = fields.map(() => '?').join(', ');
      const updates = fields.map(f => `${f} = VALUES(${f})`).join(', ');

      await pool.query(
        `INSERT INTO observations (${fields.join(', ')}) VALUES (${placeholders})
         ON DUPLICATE KEY UPDATE ${updates}`,
        values
      );
      count++;
    }

    return { success: true, count, total: rows.length };
  });
}

function parseDate(val) {
  if (!val) return null;
  // Excel serial number
  if (typeof val === 'number') {
    const d = new Date((val - 25569) * 86400 * 1000);
    return d.toISOString().slice(0, 19).replace('T', ' ');
  }
  const d = new Date(String(val));
  return isNaN(d.getTime()) ? null : d.toISOString().slice(0, 19).replace('T', ' ');
}

function parsePhotos(val) {
  if (!val) return [];
  const str = String(val).trim();
  if (!str) return [];
  // Try JSON array
  try { const p = JSON.parse(str); return Array.isArray(p) ? p : [str]; } catch {}
  // Split by common delimiters
  return str.split(/[,;\n\r]+/).map(s => s.trim()).filter(Boolean);
}
```

- [ ] **Step 2: Register multipart plugin + upload route in `server/src/index.js`**

```javascript
// ADD near top:
import multipart from '@fastify/multipart';
await app.register(multipart, { limits: { fileSize: 50 * 1024 * 1024 } });

// ADD route:
import uploadRoutes from './routes/upload.js';
await uploadRoutes(app);
```

- [ ] **Step 3: Commit**

```bash
git add server/src/routes/upload.js server/src/index.js
git commit -m "feat: add Excel upload and parse API"
```

---

### Task 10: Gemini AI Classification

**Files:**
- Create: `server/src/lib/gemini.js`
- Create: `server/src/lib/classifier.js`
- Create: `server/src/routes/ai.js`
- Modify: `server/src/index.js`

**Interfaces:**
- Produces: `POST /api/ai/classify` — classify single observation (JWT protected)
- Produces: `POST /api/ai/classify-batch` — batch classify (JWT protected)

- [ ] **Step 1: Write `server/src/lib/gemini.js`** (migrate from `api/lib/gemini.js`)

```javascript
import { GoogleGenerativeAI } from '@google/generative-ai';
import { config } from '../config.js';

const genAI = config.geminiApiKey ? new GoogleGenerativeAI(config.geminiApiKey) : null;
const MODEL_NAME = 'gemini-2.5-flash';

const VALID_CATEGORIES = new Set([
  'Confined Space', 'Excavation & Trenching', 'Lifting & Rigging',
  'Scaffolding', 'Electrical Safety', 'Fire & Hot Work',
  'Working at Height', 'Equipment, Tools & Machinery', 'PPE',
  'Barricade, Signage & Isolation', 'Housekeeping & Slip/Trip',
  'Permits, Procedures & Competency', 'Traffic & Vehicle Safety',
  'Emergency Preparedness', 'Environmental', 'Others',
]);

const CATEGORY_CN_MAP = {
  'Confined Space': '有限空间', 'Excavation & Trenching': '开挖与沟槽',
  'Lifting & Rigging': '起重与吊装', 'Scaffolding': '脚手架',
  'Electrical Safety': '电气安全', 'Fire & Hot Work': '火灾与动火',
  'Working at Height': '高处作业', 'Equipment, Tools & Machinery': '设备工具机械',
  'PPE': '个人防护用品', 'Barricade, Signage & Isolation': '围护标识隔离',
  'Housekeeping & Slip/Trip': '文明施工防滑倒',
  'Permits, Procedures & Competency': '许可程序资质',
  'Traffic & Vehicle Safety': '交通车辆安全',
  'Emergency Preparedness': '应急准备', 'Environmental': '环境', 'Others': '其他',
};

async function urlToGeminiPart(url) {
  if (url.startsWith('gs://')) {
    return { fileData: { fileUri: url, mimeType: 'image/jpeg' } };
  }
  const response = await fetch(url, { signal: AbortSignal.timeout(15000) });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const buffer = Buffer.from(await response.arrayBuffer());
  const contentType = response.headers.get('content-type') || 'image/jpeg';
  return { inlineData: { data: buffer.toString('base64'), mimeType: contentType } };
}

export async function classifyWithGemini(imageUrls, description, hazardLabel) {
  if (!genAI) {
    return { category: 'Others', categoryCN: '其他', confidence: 'low', reasoning: 'Gemini API key not configured' };
  }

  const model = genAI.getGenerativeModel({ model: MODEL_NAME });
  const imageParts = [];

  for (const url of imageUrls) {
    if (imageParts.length >= 4) break;
    try {
      imageParts.push(await urlToGeminiPart(url));
    } catch (err) {
      console.warn(`[gemini] Failed to load image: ${err.message}`);
    }
  }

  if (imageParts.length === 0) {
    return { category: 'Others', categoryCN: '其他', confidence: 'low', reasoning: 'No readable images' };
  }

  const prompt = buildPrompt(description, hazardLabel);

  try {
    const result = await model.generateContent([prompt, ...imageParts]);
    return parseResponse(result.response.text());
  } catch (err) {
    console.error(`[gemini] API error: ${err.message}`);
    return { category: 'Others', categoryCN: '其他', confidence: 'low', reasoning: `API error: ${err.message}` };
  }
}

function buildPrompt(description, hazardLabel) {
  return `You are a construction site safety inspector AI. Classify into EXACTLY ONE category:

1. Confined Space (有限空间)
2. Excavation & Trenching (开挖与沟槽)
3. Lifting & Rigging (起重与吊装)
4. Scaffolding (脚手架)
5. Electrical Safety (电气安全)
6. Fire & Hot Work (火灾与动火)
7. Working at Height (高处作业)
8. Equipment, Tools & Machinery (设备工具机械)
9. PPE (个人防护用品)
10. Barricade, Signage & Isolation (围护标识隔离)
11. Housekeeping & Slip/Trip (文明施工防滑倒)
12. Permits, Procedures & Competency (许可程序资质)
13. Traffic & Vehicle Safety (交通车辆安全)
14. Emergency Preparedness (应急准备)
15. Environmental (环境)
16. Others (其他)

Hazard label: ${hazardLabel || '(none)'}
Description: ${description || '(none)'}

Trust PHOTOS over text. Return JSON:
{"category":"...","categoryCN":"...","confidence":"high"|"medium"|"low","reasoning":"Brief Chinese explanation"}`;
}

function parseResponse(text) {
  try {
    const cleaned = text.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
    const parsed = JSON.parse(cleaned);
    const category = VALID_CATEGORIES.has(parsed.category) ? parsed.category : 'Others';
    const confidence = ['high', 'medium', 'low'].includes(parsed.confidence) ? parsed.confidence : 'low';
    return { category, categoryCN: CATEGORY_CN_MAP[category], confidence, reasoning: parsed.reasoning || '' };
  } catch {
    const match = text.match(/\{[\s\S]*\}/);
    if (match) {
      try {
        const parsed = JSON.parse(match[0]);
        const category = VALID_CATEGORIES.has(parsed.category) ? parsed.category : 'Others';
        return { category, categoryCN: CATEGORY_CN_MAP[category], confidence: 'low', reasoning: parsed.reasoning || '' };
      } catch {}
    }
  }
  return { category: 'Others', categoryCN: '其他', confidence: 'low', reasoning: 'Failed to parse response' };
}
```

- [ ] **Step 2: Write `server/src/lib/classifier.js`** (migrate from `api/lib/classifier.js`)

```javascript
export const HAZARD_CLASSIFICATION = [
  { category: 'Confined Space', cn: '有限空间', keywords: ['confined space', '有限空间'] },
  { category: 'Excavation & Trenching', cn: '开挖与沟槽', keywords: ['excavation', '开挖', '基坑', '沟', '井'] },
  { category: 'Lifting & Rigging', cn: '起重与吊装', keywords: ['lifting', 'crane', '起重', '吊车', '吊索具', 'mewp', 'rigging'] },
  { category: 'Scaffolding', cn: '脚手架', keywords: ['scaffold', '脚手架'] },
  { category: 'Electrical Safety', cn: '电气安全', keywords: ['electrical', 'loto', '用电', '电气', '挂牌上锁'] },
  { category: 'Fire & Hot Work', cn: '火灾与动火', keywords: ['hot work', '动火', 'fire extinguisher', '灭火器'] },
  { category: 'Working at Height', cn: '高处作业', keywords: ['working at height', '高处作业', 'falling hazard', 'falling object', '坠落危险', '高处落物'] },
  { category: 'Equipment, Tools & Machinery', cn: '设备工具机械', keywords: ['equipment', 'tools without inspection', 'defective tool', 'defective tools', '机具', '设备', '有缺陷的工具'] },
  { category: 'PPE', cn: '个人防护用品', keywords: ['ppe', '劳保用品', '个人劳保', '个人防护'] },
  { category: 'Barricade, Signage & Isolation', cn: '围护标识隔离', keywords: ['barricade', 'signage', '标识', '标牌', '安全防护措施', '孔洞防护'] },
  { category: 'Housekeeping & Slip/Trip', cn: '文明施工防滑倒', keywords: ['housekeeping', 'slip', 'trip', 'house keeping', '文明施工', '尖锐物', '滑倒', '绊倒', '材料存放', 'materials management'] },
  { category: 'Permits, Procedures & Competency', cn: '许可程序资质', keywords: ['swp', 'tbm', 'ptw', 'certificate', '程序遵守', '班前会', '作业票', '资格', 'violation', '违章'] },
  { category: 'Traffic & Vehicle Safety', cn: '交通车辆安全', keywords: ['traffic', '交通', '运输', 'vehicle'] },
  { category: 'Emergency Preparedness', cn: '应急准备', keywords: ['first aid', 'emergency', '急救', '应急', 'emergency equipment'] },
  { category: 'Environmental', cn: '环境', keywords: ['environmental', '环境', 'soil erosion', 'hygiene', 'mosquito', '水土'] },
  { category: 'Others', cn: '其他', keywords: ['other', '其他', '其它'] },
];

export function keywordClassify(description, hazardLabel) {
  const text = `${description || ''} ${hazardLabel || ''}`.toLowerCase();
  for (const item of HAZARD_CLASSIFICATION) {
    for (const kw of item.keywords) {
      if (text.includes(kw.toLowerCase())) {
        return { category: item.category, categoryCN: item.cn, confidence: 'medium', method: 'keyword' };
      }
    }
  }
  return { category: 'Others', categoryCN: '其他', confidence: 'low', method: 'keyword' };
}
```

- [ ] **Step 3: Write `server/src/routes/ai.js`**

```javascript
import { pool } from '../db.js';
import { authMiddleware } from '../middleware/auth.js';
import { classifyWithGemini } from '../lib/gemini.js';
import { keywordClassify } from '../lib/classifier.js';

export default async function aiRoutes(app) {
  app.post('/api/ai/classify', { preHandler: [authMiddleware] }, async (request, reply) => {
    const { docId, photoUrls, desc, hazard } = request.body || {};

    if (!docId) {
      return reply.status(400).send({ error: 'docId required' });
    }

    // Get photos from DB if not provided
    let urls = photoUrls;
    let description = desc;
    let hazardLabel = hazard;

    if (!urls || !description) {
      const [rows] = await pool.query('SELECT * FROM observations WHERE id = ?', [docId]);
      if (rows.length === 0) {
        return reply.status(404).send({ error: 'Observation not found' });
      }
      const record = rows[0];
      if (!urls) {
        try { urls = typeof record.photos === 'string' ? JSON.parse(record.photos) : record.photos; } catch { urls = []; }
      }
      if (!description) description = record.description;
      if (!hazardLabel) hazardLabel = record.hazard;
    }

    if (!Array.isArray(urls)) urls = [];

    // Try Gemini, fallback to keyword
    let result;
    if (urls.length > 0) {
      result = await classifyWithGemini(urls, description, hazardLabel);
      if (result.confidence === 'low' && result.reasoning && result.reasoning.includes('No readable images')) {
        result = { ...keywordClassify(description, hazardLabel), confidence: 'low' };
      }
    } else {
      result = { ...keywordClassify(description, hazardLabel), method: 'keyword' };
    }

    result.method = result.method || 'gemini';

    // Write back to DB
    await pool.query(
      `UPDATE observations SET
        ai_category = ?, ai_category_cn = ?, ai_confidence = ?,
        ai_method = ?, ai_reasoning = ?, ai_analyzed_at = NOW()
       WHERE id = ?`,
      [result.category, result.categoryCN, result.confidence, result.method, result.reasoning || '', docId]
    );

    return { success: true, docId, classification: result };
  });

  app.post('/api/ai/classify-batch', { preHandler: [authMiddleware] }, async (request, reply) => {
    const { docIds, scope } = request.body || {};

    let ids = docIds || [];
    if (scope === 'unanalyzed') {
      const [rows] = await pool.query("SELECT id FROM observations WHERE ai_category IS NULL OR ai_category = ''");
      ids = rows.map(r => r.id);
    } else if (scope === 'others') {
      const [rows] = await pool.query("SELECT id FROM observations WHERE ai_category = 'Others'");
      ids = rows.map(r => r.id);
    } else if (scope === 'all' || ids.length === 0) {
      const [rows] = await pool.query('SELECT id FROM observations');
      ids = rows.map(r => r.id);
    }

    return { success: true, queued: ids.length, docIds: ids };
  });
}
```

- [ ] **Step 4: Register in `server/src/index.js`**

```javascript
import aiRoutes from './routes/ai.js';
await aiRoutes(app);
```

- [ ] **Step 5: Commit**

```bash
git add server/src/lib/gemini.js server/src/lib/classifier.js server/src/routes/ai.js server/src/index.js
git commit -m "feat: add Gemini AI classification API"
```

---

### Task 11: Local Image Storage

**Files:**
- Create: `server/src/lib/storage.js`

**Interfaces:**
- Produces: `downloadAndCacheImages(docId, urls)` — downloads external images to `uploads/observations/{docId}/`, returns local paths

- [ ] **Step 1: Write `server/src/lib/storage.js`**

```javascript
import { mkdir, writeFile } from 'node:fs/promises';
import { join, extname } from 'node:path';
import { existsSync } from 'node:fs';
import { config } from '../config.js';

export function isExternalUrl(url) {
  return url && (url.startsWith('http://') || url.startsWith('https://'));
}

export async function downloadAndCacheImages(docId, urls) {
  if (!Array.isArray(urls) || urls.length === 0) return [];

  const dir = join(config.uploadDir, 'observations', docId);
  if (!existsSync(dir)) {
    await mkdir(dir, { recursive: true });
  }

  const results = [];

  for (let i = 0; i < urls.length; i++) {
    const url = urls[i];
    if (!isExternalUrl(url)) {
      results.push(url); // Already a local path
      continue;
    }

    try {
      const response = await fetch(url, { signal: AbortSignal.timeout(30000) });
      if (!response.ok) {
        results.push(`__FAILED__HTTP ${response.status}::${url}`);
        continue;
      }

      const buffer = Buffer.from(await response.arrayBuffer());
      const ext = extname(new URL(url).pathname).split('?')[0] || '.jpg';
      const filename = `${Math.floor(Date.now() / 1000)}-${i}${ext}`;
      const fullPath = join(dir, filename);

      await writeFile(fullPath, buffer);

      // Return relative path from /uploads root
      results.push(`/uploads/observations/${docId}/${filename}`);
    } catch (err) {
      results.push(`__FAILED__${err.message}::${url}`);
    }
  }

  return results;
}
```

- [ ] **Step 2: Commit**

```bash
git add server/src/lib/storage.js
git commit -m "feat: add local image download and caching"
```

---

## Phase 3: Frontend Core

### Task 12: Frontend API Layer & Config

**Files:**
- Create: `client/src/api.js`
- Create: `client/src/config.js`
- Modify: `client/src/styles/index.css`

- [ ] **Step 1: Write `client/src/config.js`** (migrate from `js/config.js`)

```javascript
export const CHART_COLORS = [
  '#2563EB', '#DC2626', '#D97706', '#059669', '#7C3AED', '#0891B2', '#DB2777', '#EA580C',
  '#4F46E5', '#4D7C0F', '#0D9488', '#0284C7', '#C026D3', '#A16207', '#E11D48', '#64748B',
];

export const COLORS = {
  SAFE: '#059669', DANGER: '#DC2626', WARN: '#D97706', NEUTRAL: '#64748B',
};

export const COL_KEYS = {
  id: ['序号', 'No', 'id', 'ID', '编号', '单据流水号'],
  hazard: ['Type of hazard', '隐患分类', '观察项目', '问题类型'],
  status: ['Status of the finding', '观察项状态', 'Status', '状态', 'Finding Status', '情况', '观察状态', '处理进度'],
  dept: ['Company', 'Department', '单位', '部门', '单位/部门'],
  desc: ['Description', '观察项描述', '观察描述'],
  time: ['提交时间', 'Time', 'Date', '日期', '发起时间'],
  name: ['Created by', 'Submitter', '填报人', '提交人', '1.', 'NAME', '姓名', 'Name', '观察人姓名'],
  obsType: ['Type of the observation', '观察项分类', '观察者类型'],
  area: ['Where', 'Area', '区域', '具体位置'],
  who: ['Who', 'Personnel', 'involved', '当事人', '涉及人员', '责任人'],
  photo: ['Photo', '图片', '现场照片'],
};

export const HAZARD_CLASSIFICATION = [
  { category: 'Confined Space', cn: '有限空间', keywords: ['confined space', '有限空间'] },
  { category: 'Excavation & Trenching', cn: '开挖与沟槽', keywords: ['excavation', '开挖', '基坑', '沟', '井'] },
  { category: 'Lifting & Rigging', cn: '起重与吊装', keywords: ['lifting', 'crane', '起重', '吊车', '吊索具', 'mewp', 'rigging'] },
  { category: 'Scaffolding', cn: '脚手架', keywords: ['scaffold', '脚手架'] },
  { category: 'Electrical Safety', cn: '电气安全', keywords: ['electrical', 'loto', '用电', '电气', '挂牌上锁'] },
  { category: 'Fire & Hot Work', cn: '火灾与动火', keywords: ['hot work', '动火', 'fire extinguisher', '灭火器'] },
  { category: 'Working at Height', cn: '高处作业', keywords: ['working at height', '高处作业', 'falling hazard', 'falling object', '坠落危险', '高处落物'] },
  { category: 'Equipment, Tools & Machinery', cn: '设备工具机械', keywords: ['equipment', 'tools without inspection', 'defective tool', 'defective tools', '机具', '设备', '有缺陷的工具'] },
  { category: 'PPE', cn: '个人防护用品', keywords: ['ppe', '劳保用品', '个人劳保', '个人防护'] },
  { category: 'Barricade, Signage & Isolation', cn: '围护标识隔离', keywords: ['barricade', 'signage', '标识', '标牌', '安全防护措施', '孔洞防护'] },
  { category: 'Housekeeping & Slip/Trip', cn: '文明施工防滑倒', keywords: ['housekeeping', 'slip', 'trip', 'house keeping', '文明施工', '尖锐物', '滑倒', '绊倒', '材料存放', 'materials management'] },
  { category: 'Permits, Procedures & Competency', cn: '许可程序资质', keywords: ['swp', 'tbm', 'ptw', 'certificate', '程序遵守', '班前会', '作业票', '资格', 'violation', '违章'] },
  { category: 'Traffic & Vehicle Safety', cn: '交通车辆安全', keywords: ['traffic', '交通', '运输', 'vehicle'] },
  { category: 'Emergency Preparedness', cn: '应急准备', keywords: ['first aid', 'emergency', '急救', '应急', 'emergency equipment'] },
  { category: 'Environmental', cn: '环境', keywords: ['environmental', '环境', 'soil erosion', 'hygiene', 'mosquito', '水土'] },
  { category: 'Others', cn: '其他', keywords: ['other', '其他', '其它'] },
];

export const AI_CONFIDENCE_COLORS = { high: '#059669', medium: '#D97706', low: '#DC2626' };

export function classifyHazard(description, hazardLabel) {
  const text = `${description || ''} ${hazardLabel || ''}`.toLowerCase();
  for (const item of HAZARD_CLASSIFICATION) {
    for (const kw of item.keywords) {
      if (text.includes(kw.toLowerCase())) return item;
    }
  }
  return HAZARD_CLASSIFICATION[HAZARD_CLASSIFICATION.length - 1]; // Others
}
```

- [ ] **Step 2: Write `client/src/api.js`**

```javascript
import axios from 'axios';

const api = axios.create({ baseURL: '/api' });

// Store token in localStorage
let token = localStorage.getItem('admin_token');
export function setToken(t) { token = t; localStorage.setItem('admin_token', t || ''); }
export function getToken() { return token; }

// Attach token to requests
api.interceptors.request.use(config => {
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Handle 401 globally
api.interceptors.response.use(
  r => r,
  err => {
    if (err.response?.status === 401) {
      setToken('');
      if (window.location.pathname === '/admin') {
        window.dispatchEvent(new CustomEvent('auth:logout'));
      }
    }
    return Promise.reject(err);
  }
);

// Dashboard APIs (public)
export const fetchStats = (filters = {}) =>
  api.get('/observations/stats', { params: filters }).then(r => r.data);

export const fetchObservations = (page = 1, filters = {}) =>
  api.get('/observations', { params: { page, pageSize: 50, ...filters } }).then(r => r.data);

export const fetchObservationById = (id) =>
  api.get(`/observations/${id}`).then(r => r.data);

export const fetchAwards = () =>
  api.get('/awards').then(r => r.data.data);

// Feedback (public)
export const submitFeedback = (data) =>
  api.post('/feedback', data).then(r => r.data);

// Admin APIs (JWT required)
export const login = (username, password) =>
  api.post('/auth/login', { username, password }).then(r => r.data);

export const batchInsertObservations = (records) =>
  api.post('/observations', records).then(r => r.data);

export const updateAwards = (awards) =>
  api.put('/awards', awards).then(r => r.data);

export const classifySingle = (data) =>
  api.post('/ai/classify', data).then(r => r.data);

export const classifyBatch = (data) =>
  api.post('/ai/classify-batch', data).then(r => r.data);

export const uploadExcel = (file) => {
  const formData = new FormData();
  formData.append('file', file);
  return api.post('/upload/excel', formData).then(r => r.data);
};

export default api;
```

- [ ] **Step 3: Enhance `client/src/styles/index.css`** with additional styles

_(Append to existing file)_

```css
/* Card styles */
.card { @apply bg-gray-900/80 backdrop-blur-md border border-gray-800 rounded-xl p-4; }

/* Table styles */
.data-table th { @apply text-left text-xs font-medium text-gray-400 uppercase tracking-wider px-4 py-3; }
.data-table td { @apply px-4 py-2 text-sm text-gray-300 border-b border-gray-800; }

/* Badge styles */
.badge { @apply inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium; }
.badge-high { @apply bg-emerald-900/50 text-emerald-400 border border-emerald-700; }
.badge-medium { @apply bg-amber-900/50 text-amber-400 border border-amber-700; }
.badge-low { @apply bg-red-900/50 text-red-400 border border-red-700; }

/* Scrollbar */
::-webkit-scrollbar { width: 6px; height: 6px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb { background: #374151; border-radius: 3px; }
::-webkit-scrollbar-thumb:hover { background: #4B5563; }

/* Chart container */
.chart-container { width: 100%; height: 400px; }
```

- [ ] **Step 4: Commit**

```bash
git add client/src/api.js client/src/config.js client/src/styles/index.css
git commit -m "feat: add API layer, config, and base styles"
```

---

### Task 13: Custom Hooks

**Files:**
- Create: `client/src/hooks/useStats.js`
- Create: `client/src/hooks/useObservations.js`
- Create: `client/src/hooks/useAwards.js`

- [ ] **Step 1: Write `client/src/hooks/useStats.js`**

```javascript
import { useState, useEffect } from 'react';
import { fetchStats } from '../api';

export function useStats(filters) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetchStats(filters)
      .then(d => { if (!cancelled) { setData(d); setError(null); } })
      .catch(e => { if (!cancelled) setError(e.message); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [
    filters?.status, filters?.area, filters?.hazard,
    filters?.startDate, filters?.endDate,
  ]);

  return { stats: data, loading, error };
}
```

- [ ] **Step 2: Write `client/src/hooks/useObservations.js`**

```javascript
import { useState, useEffect } from 'react';
import { fetchObservations } from '../api';

export function useObservations(page, filters) {
  const [data, setData] = useState({ data: [], total: 0, page: 1, pageSize: 50 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetchObservations(page, filters)
      .then(d => { if (!cancelled) { setData(d); setError(null); } })
      .catch(e => { if (!cancelled) setError(e.message); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [
    page,
    filters?.status, filters?.area, filters?.hazard, filters?.keyword,
    filters?.startDate, filters?.endDate,
  ]);

  return { observations: data.data, total: data.total, page: data.page, loading, error };
}
```

- [ ] **Step 3: Write `client/src/hooks/useAwards.js`**

```javascript
import { useState, useEffect } from 'react';
import { fetchAwards } from '../api';

export function useAwards() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAwards().then(setData).finally(() => setLoading(false));
  }, []);

  return { awards: data, loading };
}
```

- [ ] **Step 4: Commit**

```bash
git add client/src/hooks/
git commit -m "feat: add data fetching hooks"
```

---

### Task 14: FilterBar & MetricCards

**Files:**
- Create: `client/src/components/FilterBar.jsx`
- Create: `client/src/components/MetricCards.jsx`
- Modify: `client/src/pages/Dashboard.jsx`

- [ ] **Step 1: Write `client/src/components/FilterBar.jsx`**

```jsx
export default function FilterBar({ filters, onChange }) {
  const update = (key, value) => onChange({ ...filters, [key]: value });

  return (
    <div className="card mb-6">
      <div className="flex flex-wrap gap-4 items-end">
        <FilterField label="Start Date">
          <input type="date" value={filters.startDate || ''}
            onChange={e => update('startDate', e.target.value)}
            className="bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm w-40" />
        </FilterField>
        <FilterField label="End Date">
          <input type="date" value={filters.endDate || ''}
            onChange={e => update('endDate', e.target.value)}
            className="bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm w-40" />
        </FilterField>
        <FilterField label="Status">
          <select value={filters.status || ''} onChange={e => update('status', e.target.value)}
            className="bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm">
            <option value="">All</option>
            <option value="Open">Open</option>
            <option value="Closed">Closed</option>
            <option value="已关闭">已关闭</option>
          </select>
        </FilterField>
        <FilterField label="Area">
          <input type="text" value={filters.area || ''}
            onChange={e => update('area', e.target.value)} placeholder="e.g. HRSG"
            className="bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm w-32" />
        </FilterField>
        <FilterField label="Keyword">
          <input type="text" value={filters.keyword || ''}
            onChange={e => update('keyword', e.target.value)} placeholder="Search..."
            className="bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm w-48" />
        </FilterField>
        <button onClick={() => onChange({})}
          className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded text-sm transition">
          Reset
        </button>
      </div>
    </div>
  );
}

function FilterField({ label, children }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-xs text-gray-500">{label}</span>
      {children}
    </label>
  );
}
```

- [ ] **Step 2: Write `client/src/components/MetricCards.jsx`**

```jsx
import { COLORS } from '../config';

export default function MetricCards({ stats, loading }) {
  if (loading || !stats) {
    return <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      {[1,2,3,4].map(i => <div key={i} className="card animate-pulse h-24" />)}
    </div>;
  }

  const cards = [
    { label: 'Total Records', value: stats.totalCount?.toLocaleString() || '0', color: COLORS.SAFE },
    { label: 'Closure Rate', value: `${stats.closedRate || 0}%`, color: COLORS.SAFE },
    { label: 'Active Areas', value: stats.areaCount || 0, color: COLORS.WARN },
    { label: 'New This Month', value: stats.monthNew || 0, color: COLORS.DANGER },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      {cards.map(c => (
        <div key={c.label} className="card">
          <div className="text-xs text-gray-500 mb-1">{c.label}</div>
          <div className="text-2xl font-bold" style={{ color: c.color }}>{c.value}</div>
        </div>
      ))}
    </div>
  );
}
```

- [ ] **Step 3: Update `client/src/pages/Dashboard.jsx`** to include state + FilterBar + MetricCards

```jsx
import { useState } from 'react';
import FilterBar from '../components/FilterBar';
import MetricCards from '../components/MetricCards';
import { useStats } from '../hooks/useStats';
import { useObservations } from '../hooks/useObservations';

export default function Dashboard() {
  const [filters, setFilters] = useState({});
  const [page, setPage] = useState(1);
  const { stats, loading: statsLoading } = useStats(filters);
  const { observations, total } = useObservations(page, filters);

  return (
    <div className="container mx-auto p-4 max-w-7xl">
      <h1 className="text-3xl font-bold mb-6">Safety Dashboard</h1>

      <FilterBar filters={filters} onChange={f => { setFilters(f); setPage(1); }} />
      <MetricCards stats={stats} loading={statsLoading} />

      {/* Chart section — placeholder, filled in Task 15 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="card chart-container flex items-center justify-center text-gray-600">
          Charts coming next
        </div>
      </div>

      {/* Table section — placeholder, filled in Task 16 */}
      <div className="card">
        <h2 className="text-lg font-semibold mb-4">Records ({total})</h2>
        <div className="text-gray-600">Table coming next</div>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Test in browser**

```bash
cd client && npm run dev
# Visit http://localhost:5173 — should see FilterBar + MetricCards (will show 0 since no data)
```

- [ ] **Step 5: Commit**

```bash
git add client/src/components/FilterBar.jsx client/src/components/MetricCards.jsx client/src/pages/Dashboard.jsx
git commit -m "feat: add FilterBar and MetricCards to Dashboard"
```

---

### Task 15: Chart Components — All 7 Charts

**Files:**
- Create: `client/src/components/charts/HazardChart.jsx`
- Create: `client/src/components/charts/AreaChart.jsx`
- Create: `client/src/components/charts/StatusPie.jsx`
- Create: `client/src/components/charts/DeptChart.jsx`
- Create: `client/src/components/charts/SubmitterChart.jsx`
- Create: `client/src/components/charts/MonthlyTrendChart.jsx`
- Create: `client/src/components/charts/WordCloud.jsx`
- Modify: `client/src/pages/Dashboard.jsx`

- [ ] **Step 1: Write `client/src/components/charts/BaseChart.jsx`** (shared ECharts wrapper)

```jsx
import { useEffect, useRef } from 'react';
import * as echarts from 'echarts';

export default function BaseChart({ option, height = '400px' }) {
  const ref = useRef(null);
  const chartRef = useRef(null);

  useEffect(() => {
    if (!ref.current) return;
    chartRef.current = echarts.init(ref.current, null, { renderer: 'canvas' });
    return () => chartRef.current?.dispose();
  }, []);

  useEffect(() => {
    if (chartRef.current && option) {
      chartRef.current.setOption(option, true);
    }
  }, [option]);

  useEffect(() => {
    const handleResize = () => chartRef.current?.resize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return <div ref={ref} style={{ width: '100%', height }} />;
}
```

- [ ] **Step 2: Write `client/src/components/charts/HazardChart.jsx`** (bar chart)

```jsx
import BaseChart from './BaseChart';
import { CHART_COLORS } from '../../config';

export default function HazardChart({ data }) {
  if (!data?.length) return <div className="chart-container flex items-center justify-center text-gray-600">No data</div>;

  const option = {
    tooltip: { trigger: 'axis' },
    title: { text: 'Hazard Distribution', textStyle: { color: '#9CA3AF', fontSize: 14 } },
    grid: { left: '3%', right: '10%', bottom: '3%', containLabel: true },
    xAxis: { type: 'value', axisLabel: { color: '#9CA3AF' } },
    yAxis: { type: 'category', data: data.map(d => d.name).reverse(), axisLabel: { color: '#9CA3AF', width: 120, overflow: 'truncate' } },
    series: [{
      type: 'bar', data: data.map((d, i) => ({ value: d.value, itemStyle: { color: CHART_COLORS[i % CHART_COLORS.length] } })).reverse(),
      barMaxWidth: 30,
    }],
  };

  return <div className="chart-container"><BaseChart option={option} /></div>;
}
```

- [ ] **Step 3: Write `client/src/components/charts/AreaChart.jsx`**

```jsx
import BaseChart from './BaseChart';
import { CHART_COLORS } from '../../config';

export default function AreaChart({ data }) {
  if (!data?.length) return <div className="chart-container flex items-center justify-center text-gray-600">No data</div>;

  const option = {
    tooltip: { trigger: 'axis' },
    title: { text: 'Area Distribution', textStyle: { color: '#9CA3AF', fontSize: 14 } },
    grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
    xAxis: { type: 'category', data: data.map(d => d.name), axisLabel: { color: '#9CA3AF', rotate: 45 } },
    yAxis: { type: 'value', axisLabel: { color: '#9CA3AF' } },
    series: [{
      type: 'bar', data: data.map((d, i) => ({ value: d.value, itemStyle: { color: CHART_COLORS[i % CHART_COLORS.length] } })),
    }],
  };

  return <div className="chart-container"><BaseChart option={option} /></div>;
}
```

- [ ] **Step 4: Write `client/src/components/charts/StatusPie.jsx`**

```jsx
import BaseChart from './BaseChart';
import { COLORS } from '../../config';

const STATUS_COLORS = { 'Open': COLORS.DANGER, 'Closed': COLORS.SAFE, '已关闭': COLORS.SAFE, 'In Progress': COLORS.WARN };

export default function StatusPie({ data }) {
  if (!data?.length) return <div className="chart-container flex items-center justify-center text-gray-600">No data</div>;

  const option = {
    tooltip: { trigger: 'item' },
    title: { text: 'Status Breakdown', textStyle: { color: '#9CA3AF', fontSize: 14 } },
    series: [{
      type: 'pie', radius: ['40%', '70%'],
      data: data.map(d => ({ ...d, itemStyle: { color: STATUS_COLORS[d.name] || COLORS.NEUTRAL } })),
      label: { color: '#9CA3AF', fontSize: 11 },
    }],
  };

  return <div className="chart-container"><BaseChart option={option} /></div>;
}
```

- [ ] **Step 5: Write remaining chart components**

Create `DeptChart.jsx`, `SubmitterChart.jsx`, `MonthlyTrendChart.jsx` following the same pattern — each receives `data` array of `{name, value}`, renders a BaseChart with appropriate ECharts option. Create `WordCloud.jsx` using echarts-wordcloud.

_(Full code for each chart is in the plan — following the same pattern as HazardChart/AreaChart with different chart types: DeptChart = horizontal bar, SubmitterChart = horizontal bar, MonthlyTrendChart = line, WordCloud = wordCloud)_

- [ ] **Step 6: Update `client/src/pages/Dashboard.jsx`** to render all charts

```jsx
// Replace the placeholder chart div with:
import HazardChart from '../components/charts/HazardChart';
import AreaChart from '../components/charts/AreaChart';
import StatusPie from '../components/charts/StatusPie';
import DeptChart from '../components/charts/DeptChart';
import SubmitterChart from '../components/charts/SubmitterChart';
import MonthlyTrendChart from '../components/charts/MonthlyTrendChart';
import WordCloud from '../components/charts/WordCloud';

{/* In the JSX, replace chart placeholder: */}
<HazardChart data={stats?.hazardDist} />
<AreaChart data={stats?.areaDist} />
<StatusPie data={stats?.statusDist} />
<DeptChart data={stats?.deptRank} />
<SubmitterChart data={stats?.submitterRank} />
<MonthlyTrendChart data={stats?.monthlyTrend?.map(d => ({ name: d.month, value: d.count }))} />
```

- [ ] **Step 7: Commit**

```bash
git add client/src/components/charts/ client/src/pages/Dashboard.jsx
git commit -m "feat: add all ECharts chart components"
```

---

### Task 16: DataTable with Server-Side Pagination

**Files:**
- Create: `client/src/components/DataTable.jsx`
- Modify: `client/src/pages/Dashboard.jsx`

- [ ] **Step 1: Write `client/src/components/DataTable.jsx`**

```jsx
import { classifyHazard, AI_CONFIDENCE_COLORS } from '../config';

export default function DataTable({ data, total, page, pageSize, onPageChange, loading }) {
  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="card">
      <h2 className="text-lg font-semibold mb-4">Records ({total})</h2>

      {loading ? (
        <div className="text-gray-500 py-8 text-center">Loading...</div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="data-table w-full">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Photo</th>
                  <th>Hazard</th>
                  <th>Status</th>
                  <th>Area</th>
                  <th>Dept</th>
                  <th>Description</th>
                  <th>Submitter</th>
                  <th>Date</th>
                  <th>AI Classification</th>
                </tr>
              </thead>
              <tbody>
                {data.map(row => {
                  const fallback = classifyHazard(row.description, row.hazard);
                  const aiCat = row.ai_category || fallback.category;
                  const aiCatCN = row.ai_category_cn || fallback.cn;
                  const aiConf = row.ai_confidence || 'low';

                  return (
                    <tr key={row.id} className="hover:bg-gray-800/30 transition">
                      <td className="font-mono text-xs">{row.id}</td>
                      <td>
                        {Array.isArray(row.photos) && row.photos[0] && !row.photos[0].startsWith('__FAILED') ? (
                          <img src={row.photos[0]} alt="" className="w-10 h-10 object-cover rounded" />
                        ) : <span className="text-gray-600">—</span>}
                      </td>
                      <td>{row.hazard || '—'}</td>
                      <td>
                        <span className={`badge ${(row.status === 'Closed' || row.status === '已关闭') ? 'badge-high' : 'badge-medium'}`}>
                          {row.status || '—'}
                        </span>
                      </td>
                      <td>{row.area || '—'}</td>
                      <td>{row.dept || '—'}</td>
                      <td className="max-w-xs truncate" title={row.description}>{row.description || '—'}</td>
                      <td>{row.submitter || '—'}</td>
                      <td className="text-xs">{row.obs_time || '—'}</td>
                      <td>
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: AI_CONFIDENCE_COLORS[aiConf] || '#64748B' }} />
                          <span className="text-xs">{aiCatCN}</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {data.length === 0 && (
                  <tr><td colSpan={10} className="text-center py-8 text-gray-600">No records found</td></tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-800">
            <span className="text-sm text-gray-500">Page {page} of {totalPages || 1}</span>
            <div className="flex gap-2">
              <button onClick={() => onPageChange(page - 1)} disabled={page <= 1}
                className="px-3 py-1 text-sm rounded bg-gray-800 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition">
                Prev
              </button>
              <button onClick={() => onPageChange(page + 1)} disabled={page >= totalPages}
                className="px-3 py-1 text-sm rounded bg-gray-800 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition">
                Next
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Update Dashboard.jsx** to include DataTable

```jsx
// ADD import:
import DataTable from '../components/DataTable';

// REPLACE table placeholder with:
<DataTable
  data={observations}
  total={total}
  page={page}
  pageSize={50}
  onPageChange={setPage}
  loading={obsLoading}
/>
```

- [ ] **Step 3: Commit**

```bash
git add client/src/components/DataTable.jsx client/src/pages/Dashboard.jsx
git commit -m "feat: add server-side paginated DataTable"
```

---

### Task 17: ImageModal

**Files:**
- Create: `client/src/components/ImageModal.jsx`

- [ ] **Step 1: Write `client/src/components/ImageModal.jsx`**

```jsx
import { useState, useEffect } from 'react';

export default function ImageModal({ images, initialIndex = 0, onClose }) {
  const [index, setIndex] = useState(initialIndex);

  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') setIndex(i => Math.max(0, i - 1));
      if (e.key === 'ArrowRight') setIndex(i => Math.min(images.length - 1, i + 1));
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [images.length, onClose]);

  const validImages = images?.filter(u => u && !u.startsWith('__FAILED')) || [];

  return (
    <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center" onClick={onClose}>
      <button className="absolute top-4 right-4 text-white text-2xl hover:text-gray-300 z-10" onClick={onClose}>&times;</button>

      {validImages.length > 1 && (
        <>
          <button className="absolute left-4 text-white text-3xl hover:text-gray-300 z-10"
            onClick={e => { e.stopPropagation(); setIndex(i => Math.max(0, i - 1)); }}
            disabled={index === 0}>&lsaquo;</button>
          <button className="absolute right-4 text-white text-3xl hover:text-gray-300 z-10"
            onClick={e => { e.stopPropagation(); setIndex(i => Math.min(validImages.length - 1, i + 1)); }}
            disabled={index === validImages.length - 1}>&rsaquo;</button>
        </>
      )}

      <img src={validImages[index]} alt="" className="max-w-[90vw] max-h-[90vh] object-contain"
        onClick={e => e.stopPropagation()} />

      {validImages.length > 1 && (
        <div className="absolute bottom-4 text-gray-400 text-sm">
          {index + 1} / {validImages.length}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Wire into DataTable**

_(In DataTable, add onClick on the thumbnail img to open ImageModal — pass full photos array.)_

- [ ] **Step 3: Commit**

```bash
git add client/src/components/ImageModal.jsx client/src/components/DataTable.jsx
git commit -m "feat: add ImageModal for photo viewing"
```

---

## Phase 4: Admin Interface

### Task 18: AdminLogin & Protected Routes

**Files:**
- Create: `client/src/components/AdminLogin.jsx`
- Modify: `client/src/pages/Admin.jsx`

- [ ] **Step 1: Write `client/src/components/AdminLogin.jsx`**

```jsx
import { useState } from 'react';
import { login, setToken } from '../api';

export default function AdminLogin({ onSuccess }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { token } = await login(username, password);
      setToken(token);
      onSuccess();
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="card w-full max-w-sm">
        <h1 className="text-xl font-bold mb-6 text-center">Admin Login</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1">Username</label>
            <input type="text" value={username} onChange={e => setUsername(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2" autoFocus />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Password</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2" />
          </div>
          {error && <p className="text-red-400 text-sm">{error}</p>}
          <button type="submit" disabled={loading}
            className="w-full py-2 bg-blue-600 hover:bg-blue-700 rounded font-medium transition disabled:opacity-50">
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Update `client/src/pages/Admin.jsx`** with auth state

```jsx
import { useState, useEffect } from 'react';
import AdminLogin from '../components/AdminLogin';
import { getToken, setToken } from '../api';

export default function Admin() {
  const [authenticated, setAuthenticated] = useState(!!getToken());

  useEffect(() => {
    const onLogout = () => setAuthenticated(false);
    window.addEventListener('auth:logout', onLogout);
    return () => window.removeEventListener('auth:logout', onLogout);
  }, []);

  if (!authenticated) {
    return <AdminLogin onSuccess={() => setAuthenticated(true)} />;
  }

  const handleLogout = () => {
    setToken('');
    setAuthenticated(false);
  };

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Admin Panel</h1>
        <button onClick={handleLogout}
          className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded text-sm transition">
          Logout
        </button>
      </div>

      {/* Excel upload — Task 19 */}
      {/* AI panel — Task 20 */}
      {/* Awards manager — Task 21 */}
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add client/src/components/AdminLogin.jsx client/src/pages/Admin.jsx
git commit -m "feat: add admin login with JWT auth"
```

---

### Task 19: Excel Upload Component

**Files:**
- Create: `client/src/components/ExcelUpload.jsx`
- Modify: `client/src/pages/Admin.jsx`

- [ ] **Step 1: Write `client/src/components/ExcelUpload.jsx`**

```jsx
import { useState } from 'react';
import { uploadExcel } from '../api';

export default function ExcelUpload() {
  const [file, setFile] = useState(null);
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);

  const handleUpload = async () => {
    if (!file) return;
    setLoading(true);
    setStatus('Uploading and processing...');
    try {
      const result = await uploadExcel(file);
      setStatus(`Done! ${result.count} records saved (${result.total} rows total).`);
    } catch (err) {
      setStatus(`Error: ${err.response?.data?.error || err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card mb-6">
      <h2 className="text-lg font-semibold mb-4">Upload Excel Data</h2>
      <div className="flex gap-4 items-center">
        <input type="file" accept=".xlsx,.xls,.csv"
          onChange={e => setFile(e.target.files[0])}
          className="text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:bg-gray-700 file:text-white hover:file:bg-gray-600" />
        <button onClick={handleUpload} disabled={!file || loading}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded text-sm font-medium transition disabled:opacity-50">
          {loading ? 'Processing...' : 'Upload & Sync'}
        </button>
      </div>
      {status && <p className={`mt-3 text-sm ${status.startsWith('Done') ? 'text-emerald-400' : 'text-gray-400'}`}>{status}</p>}
    </div>
  );
}
```

- [ ] **Step 2: Add to Admin.jsx**

```jsx
import ExcelUpload from '../components/ExcelUpload';

{/* Inside the authenticated Admin JSX, before logout button: */}
<ExcelUpload />
```

- [ ] **Step 3: Commit**

```bash
git add client/src/components/ExcelUpload.jsx client/src/pages/Admin.jsx
git commit -m "feat: add Excel upload component"
```

---

### Task 20: AI Classify Panel

**Files:**
- Create: `client/src/components/AIClassifyPanel.jsx`
- Modify: `client/src/pages/Admin.jsx`

- [ ] **Step 1: Write `client/src/components/AIClassifyPanel.jsx`**

```jsx
import { useState } from 'react';
import { classifyBatch, classifySingle } from '../api';

export default function AIClassifyPanel() {
  const [scope, setScope] = useState('unanalyzed');
  const [status, setStatus] = useState('');
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState({ done: 0, total: 0 });

  const handleStart = async () => {
    setRunning(true);
    setProgress({ done: 0, total: 0 });

    try {
      // Step 1: Get list of docIds to process
      const { docIds } = await classifyBatch({ scope });
      setProgress({ done: 0, total: docIds.length });
      setStatus(`Processing ${docIds.length} records...`);

      // Step 2: Process one by one with delay
      for (let i = 0; i < docIds.length; i++) {
        await classifySingle({ docId: docIds[i] });
        setProgress({ done: i + 1, total: docIds.length });
        // Delay 500ms between requests
        if (i < docIds.length - 1) {
          await new Promise(r => setTimeout(r, 500));
        }
      }

      setStatus(`Complete! ${docIds.length} records analyzed.`);
    } catch (err) {
      setStatus(`Error: ${err.response?.data?.error || err.message}`);
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="card mb-6">
      <h2 className="text-lg font-semibold mb-4">AI Classification</h2>
      <div className="flex gap-4 items-end">
        <label className="flex flex-col gap-1">
          <span className="text-xs text-gray-500">Scope</span>
          <select value={scope} onChange={e => setScope(e.target.value)}
            className="bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm">
            <option value="unanalyzed">Unanalyzed Records</option>
            <option value="others">"Others" Classification Only</option>
            <option value="all">All Records</option>
          </select>
        </label>
        <button onClick={handleStart} disabled={running}
          className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded text-sm font-medium transition disabled:opacity-50">
          {running ? 'Processing...' : 'Start AI Analysis'}
        </button>
      </div>

      {running && progress.total > 0 && (
        <div className="mt-3">
          <div className="text-sm text-gray-400 mb-1">{progress.done} / {progress.total}</div>
          <div className="w-full bg-gray-800 rounded-full h-2">
            <div className="bg-purple-500 h-2 rounded-full transition-all"
              style={{ width: `${(progress.done / progress.total) * 100}%` }} />
          </div>
        </div>
      )}

      {status && !running && (
        <p className={`mt-3 text-sm ${status.startsWith('Complete') ? 'text-emerald-400' : status.startsWith('Error') ? 'text-red-400' : 'text-gray-400'}`}>
          {status}
        </p>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Add to Admin.jsx**

```jsx
import AIClassifyPanel from '../components/AIClassifyPanel';

{/* Inside the authenticated Admin JSX: */}
<AIClassifyPanel />
```

- [ ] **Step 3: Commit**

```bash
git add client/src/components/AIClassifyPanel.jsx client/src/pages/Admin.jsx
git commit -m "feat: add AI classification panel"
```

---

### Task 21: Awards Manager

**Files:**
- Create: `client/src/components/AwardsManager.jsx`
- Modify: `client/src/pages/Admin.jsx`

- [ ] **Step 1: Write `client/src/components/AwardsManager.jsx`**

```jsx
import { useState, useEffect } from 'react';
import { fetchAwards, updateAwards } from '../api';

export default function AwardsManager() {
  const [awards, setAwards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchAwards().then(data => {
      setAwards(data.map(a => ({ ...a }))); // Copy for editing
      setLoading(false);
    });
  }, []);

  const updateAward = (id, field, value) => {
    setAwards(prev => prev.map(a => a.id === id ? { ...a, [field]: value } : a));
  };

  const addNew = () => {
    const name = prompt('Team name:');
    if (name) setAwards(prev => [...prev, { id: name, score: 0, level: 'normal' }]);
  };

  const save = async () => {
    setSaving(true);
    try {
      await updateAwards(awards);
      alert('Saved!');
    } catch (err) {
      alert('Error: ' + (err.response?.data?.error || err.message));
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="card">Loading awards...</div>;

  return (
    <div className="card mb-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">Safety Awards</h2>
        <div className="flex gap-2">
          <button onClick={addNew} className="px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded text-sm transition">+ Add</button>
          <button onClick={save} disabled={saving}
            className="px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded text-sm transition disabled:opacity-50">
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>

      <table className="data-table w-full">
        <thead>
          <tr>
            <th>Team</th>
            <th>Score</th>
            <th>Level</th>
          </tr>
        </thead>
        <tbody>
          {awards.map(a => (
            <tr key={a.id}>
              <td className="font-medium">{a.id}</td>
              <td>
                <input type="number" value={a.score} onChange={e => updateAward(a.id, 'score', parseInt(e.target.value) || 0)}
                  className="bg-gray-800 border border-gray-700 rounded px-2 py-1 text-sm w-24" />
              </td>
              <td>
                <select value={a.level} onChange={e => updateAward(a.id, 'level', e.target.value)}
                  className="bg-gray-800 border border-gray-700 rounded px-2 py-1 text-sm">
                  <option value="gold">Gold</option>
                  <option value="silver">Silver</option>
                  <option value="normal">Normal</option>
                </select>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

- [ ] **Step 2: Add to Admin.jsx**

```jsx
import AwardsManager from '../components/AwardsManager';

{/* Inside the authenticated Admin JSX: */}
<AwardsManager />
```

- [ ] **Step 3: Commit**

```bash
git add client/src/components/AwardsManager.jsx client/src/pages/Admin.jsx
git commit -m "feat: add awards manager"
```

---

## Phase 5: Integration & Deployment

### Task 22: Nginx Configuration & Dockerfiles

**Files:**
- Create: `nginx/nginx.conf`
- Create: `nginx/Dockerfile`

- [ ] **Step 1: Write `nginx/nginx.conf`**

```nginx
server {
    listen 80;
    server_name _;
    root /usr/share/nginx/html;
    index index.html;

    # React static files
    location / {
        try_files $uri $uri/ /index.html;
    }

    # API reverse proxy
    location /api/ {
        proxy_pass http://fastify:3001;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }

    # Uploads — served directly by Nginx for performance
    location /uploads/ {
        alias /usr/share/nginx/html/uploads/;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }
}
```

- [ ] **Step 2: Write `nginx/Dockerfile`**

```dockerfile
# Build stage
FROM node:20-alpine AS builder
WORKDIR /app
COPY client/package.json ./
RUN npm install
COPY client/ ./
RUN npm run build

# Serve stage
FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

- [ ] **Step 3: Update `docker-compose.yml`** to use the unified nginx build

_(The nginx service already references `./nginx` — the Dockerfile now builds React + nginx together, so client/ is built as part of nginx.)_

- [ ] **Step 4: Generate real bcrypt hash and update `init.sql`**

```bash
node -e "const bcrypt = require('bcrypt'); bcrypt.hash('admin123', 10).then(h => console.log(h));"
# Replace $2b$10$placeholder in init.sql with the real hash
```

- [ ] **Step 5: Commit**

```bash
git add nginx/nginx.conf nginx/Dockerfile init.sql
git commit -m "feat: add Nginx config, unified Dockerfile, real bcrypt hash"
```

---

### Task 23: End-to-End Testing & Verification

- [ ] **Step 1: Full build and start**

```bash
docker compose up -d --build
# All 3 services should start
```

- [ ] **Step 2: Verify health checks**

```bash
curl http://localhost/api/health
# → {"status":"ok","timestamp":"..."}
curl http://localhost/api/health/db
# → {"db":"connected"}
```

- [ ] **Step 3: Test admin login**

```bash
curl -X POST http://localhost/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'
# → {"token":"eyJ..."}
```

- [ ] **Step 4: Test data upload**

```bash
# Upload test Excel:
curl -X POST http://localhost/api/upload/excel \
  -H "Authorization: Bearer <token>" \
  -F "file=@test-data.xlsx"
```

- [ ] **Step 5: Test stats and data APIs**

```bash
curl http://localhost/api/observations/stats
curl http://localhost/api/observations?page=1
```

- [ ] **Step 6: Verify dashboard in browser**

Open `http://localhost` — should see:
- MetricCards with data
- FilterBar working
- All 7 charts rendering
- DataTable with pagination
- Image modal on click

- [ ] **Step 7: Verify admin page**

Open `http://localhost/admin`:
- Login screen → login with admin/admin123
- ExcelUpload working
- AIClassifyPanel working (if GEMINI_API_KEY set)
- AwardsManager editable and saving

- [ ] **Step 8: Final commit**

```bash
git add -A
git commit -m "chore: final integration and verification"
```

---

## Summary

| Phase | Tasks | Description |
|-------|-------|-------------|
| **Phase 1** | 1-3 | Docker Compose, MySQL init, Fastify & React scaffolds |
| **Phase 2** | 4-11 | All backend routes, AI, image storage |
| **Phase 3** | 12-17 | Frontend API, hooks, charts, table, modal |
| **Phase 4** | 18-21 | Admin login, Excel upload, AI panel, awards |
| **Phase 5** | 22-23 | Nginx config, Dockerfile, E2E verification |

**Total: 23 tasks** — each task produces independently testable deliverables.
