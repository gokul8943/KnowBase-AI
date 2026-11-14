# KnowBase AI – AI-powered Enterprise Knowledge Assistant

## Project Structure

```
knowbase-ai/
├── client/                 # Frontend (React + Vite + TypeScript)
├── server/                 # Backend (Express + TypeScript + Prisma)
├── docker-compose.yml      # PostgreSQL + Redis
├── README.md
└── .gitignore
```

## Quick Start

### Prerequisites

- Node.js 20+
- Docker & Docker Compose
- pnpm (recommended) or npm

### Installation

```bash
# Install dependencies for both client and server
cd client && pnpm install
cd ../server && pnpm install

# Start database services
docker-compose up -d

# Run database migrations
cd server && pnpm prisma migrate dev

# Start development servers
# Terminal 1 - Backend
cd server && pnpm dev

# Terminal 2 - Frontend
cd client && pnpm dev
```

### Environment Variables

#### Server (.env)

```env
# Database
DATABASE_URL="postgresql://knowbase:knowbase@localhost:5432/knowbase?schema=public"

# JWT
JWT_ACCESS_SECRET="your-access-secret-min-32-chars"
JWT_REFRESH_SECRET="your-refresh-secret-min-32-chars"
JWT_ACCESS_EXPIRES_IN="15m"
JWT_REFRESH_EXPIRES_IN="7d"

# Server
PORT=3000
NODE_ENV=development
CLIENT_URL="http://localhost:5173"

# Redis (for refresh token storage)
REDIS_URL="redis://localhost:6379"

# Rate limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

#### Client (.env)

```env
VITE_API_URL="http://localhost:3000"
```

## Available Scripts

### Server

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start development server with hot reload |
| `pnpm build` | Build for production |
| `pnpm start` | Start production server |
| `pnpm lint` | Run ESLint |
| `pnpm format` | Format with Prettier |
| `pnpm test` | Run tests |
| `pnpm test:watch` | Run tests in watch mode |
| `pnpm prisma:generate` | Generate Prisma Client |
| `pnpm prisma:migrate` | Run migrations |
| `pnpm prisma:studio` | Open Prisma Studio |

### Client

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start development server |
| `pnpm build` | Build for production |
| `pnpm preview` | Preview production build |
| `pnpm lint` | Run ESLint |
| `pnpm format` | Format with Prettier |
| `pnpm test` | Run tests |

## API Documentation

Swagger UI available at: `http://localhost:3000/api-docs`

## Tech Stack

### Frontend
- React 18 + TypeScript
- Vite
- Tailwind CSS + shadcn/ui
- React Router v6
- TanStack Query v5
- Axios
- React Hook Form + Zod

### Backend
- Node.js 20 + Express + TypeScript
- Prisma ORM + PostgreSQL
- JWT (access + refresh tokens)
- bcrypt
- Zod validation
- Swagger/OpenAPI
- Helmet, CORS, Rate Limiting

### Testing
- Vitest
- Supertest

## License

MIT