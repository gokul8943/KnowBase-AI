import { vi } from 'vitest';

const createMockModel = () => ({
  findUnique: vi.fn(),
  findFirst: vi.fn(),
  findMany: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  updateMany: vi.fn(),
  delete: vi.fn(),
  deleteMany: vi.fn(),
  count: vi.fn(),
});

vi.mock('../config/prisma', () => ({
  prisma: {
    user: createMockModel(),
    refreshToken: createMockModel(),
    organization: createMockModel(),
    organizationMember: createMockModel(),
    workspace: createMockModel(),
    invitation: createMockModel(),
    $connect: vi.fn(),
    $disconnect: vi.fn(),
    $transaction: vi.fn((callback) => callback(vi.mocked(vi.fn()))),
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
