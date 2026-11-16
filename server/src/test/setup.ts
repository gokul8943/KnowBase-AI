import { vi } from 'vitest';

vi.mock('../config/prisma', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    refreshToken: {
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
      deleteMany: vi.fn(),
    },
    $connect: vi.fn(),
    $disconnect: vi.fn(),
    $queryRaw: vi.fn(),
  },
}));

vi.mock('../config/redis', () => ({
  redis: {
    connect: vi.fn(),
    quit: vi.fn(),
    ping: vi.fn(),
    on: vi.fn(),
  },
}));

process.env.NODE_ENV = 'test';
process.env.JWT_ACCESS_SECRET = 'test-access-secret-key-min-32-characters-long';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-key-min-32-characters-long';
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test';
