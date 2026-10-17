# 🌐 Net-On — ISP Management Platform

A production-grade ISP management platform for customer billing, network automation, and business analytics.

## Architecture

**Modular Monolith** built with:

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14 + TypeScript + Tailwind CSS + shadcn/ui |
| Backend | NestJS + TypeScript + Prisma ORM |
| Database | PostgreSQL 16 |
| Cache/Queue | Redis 7 + BullMQ |
| Network | MikroTik RouterOS API |
| Payments | M-Pesa Daraja API |
| Infrastructure | Docker + Docker Compose + Nginx |

## Quick Start

### Prerequisites

- Node.js >= 20.0.0
- npm >= 10.0.0
- Docker & Docker Compose

### 1. Clone & Setup

```bash
# Copy environment file
cp .env.example .env

# Install dependencies
npm install
```

### 2. Start Infrastructure

```bash
# Start PostgreSQL and Redis
docker compose up -d
```

### 3. Setup Database

```bash
# Run migrations
npm run db:migrate

# Seed initial data
npm run db:seed
```

### 4. Start Development

```bash
# Start API and Web concurrently
npm run dev
```

- **Web UI**: http://localhost:3000
- **API**: http://localhost:3001
- **API Docs**: http://localhost:3001/api/docs
- **Health**: http://localhost:3001/api/v1/health

## Project Structure

```
net-on/
├── apps/
│   ├── web/          # Next.js frontend
│   └── api/          # NestJS backend
├── packages/
│   ├── shared/       # Constants, enums, utilities
│   ├── types/        # Shared TypeScript types
│   └── config/       # Configuration defaults
├── infrastructure/
│   ├── docker/       # Dockerfiles
│   └── nginx/        # Nginx configuration
├── docs/             # Documentation
└── scripts/          # Utility scripts
```

## Development

```bash
npm run dev          # Start all apps in dev mode
npm run build        # Build all apps
npm run lint         # Lint all apps
npm run type-check   # TypeScript type checking
npm run db:studio    # Open Prisma Studio
```

## Documentation

- [Architecture](docs/architecture/)
- [API Documentation](docs/api/)
- [Database Schema](docs/database/)
- [Network Integration](docs/networking/)
- [Security](docs/security/)
- [Deployment](docs/deployment/)

## License

Proprietary — Net-On © 2026
