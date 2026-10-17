#!/bin/bash
# ============================================
# Net-On — Initial Setup Script
# ============================================

set -e

echo "🚀 Setting up Net-On development environment..."
echo ""

# 1. Copy environment file
if [ ! -f .env ]; then
  cp .env.example .env
  echo "✅ Created .env from .env.example"
  echo "⚠️  Please update .env with your actual values"
else
  echo "ℹ️  .env already exists"
fi

# 2. Install dependencies
echo ""
echo "📦 Installing dependencies..."
npm install

# 3. Start infrastructure
echo ""
echo "🐳 Starting PostgreSQL and Redis..."
docker compose up -d postgres redis

# Wait for PostgreSQL to be ready
echo "⏳ Waiting for PostgreSQL..."
sleep 5

# 4. Run database migrations
echo ""
echo "🗄️  Running database migrations..."
cd apps/api
npx prisma migrate dev --name init
npx prisma generate

# 5. Seed database
echo ""
echo "🌱 Seeding database..."
npx ts-node prisma/seed.ts
cd ../..

echo ""
echo "═══════════════════════════════════════════════"
echo "  ✅ Net-On setup complete!"
echo ""
echo "  Start development:"
echo "    npm run dev"
echo ""
echo "  Web UI:    http://localhost:3000"
echo "  API:       http://localhost:3001"
echo "  API Docs:  http://localhost:3001/api/docs"
echo "═══════════════════════════════════════════════"
