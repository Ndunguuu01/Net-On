# Net-On — Migration & Database Operations Guide

## Overview
Database schema changes in Net-On are managed via **Prisma Migrate**.

## Environment Setup
Make sure `DATABASE_URL` in `.env` points to your PostgreSQL instance:

```env
DATABASE_URL=postgresql://neton:neton_dev_password@localhost:5432/neton?schema=public
```

## Common Commands

### 1. Development Migration (Create & Apply)
```bash
# From workspace root
npm run db:migrate

# Or directly in apps/api
cd apps/api
npx prisma migrate dev --name <migration_name>
```

### 2. Production Migration (Apply Pending)
```bash
cd apps/api
npx prisma migrate deploy
```

### 3. Database Seeding
```bash
# Seed initial settings
npm run db:seed
```

### 4. Prisma Studio (GUI)
```bash
npm run db:studio
```

## Migration Safeguards
1. **Never drop financial tables** (`invoices`, `payments`, `subscriptions`).
2. **Always test migrations on dev first**.
3. **Keep migrations idempotent and backward-compatible**.
