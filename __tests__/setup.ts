import { PrismaClient } from '@prisma/client';
import { mockDeep, mockReset, DeepMockProxy } from 'jest-mock-extended';

// Mock de Prisma Client
jest.mock('../app/lib/prisma', () => ({
  __esModule: true,
  default: mockDeep<PrismaClient>(),
}));

// Mock de Prisma para servicios
jest.mock('@prisma/client', () => ({
  __esModule: true,
  PrismaClient: jest.fn(() => mockDeep<PrismaClient>()),
  Prisma: {
    PrismaClientKnownRequestError: class PrismaClientKnownRequestError extends Error {
      code: string;
      constructor(message: string, code: string) {
        super(message);
        this.code = code;
        this.name = 'PrismaClientKnownRequestError';
      }
    },
  },
}));

// Variables globales para tests
declare global {
  var __PRISMA_MOCK__: DeepMockProxy<PrismaClient>;
}

const prismaMock = mockDeep<PrismaClient>();
global.__PRISMA_MOCK__ = prismaMock;

// Reset mocks antes de cada test
beforeEach(() => {
  mockReset(prismaMock);
});

// Cleanup después de cada test
afterEach(() => {
  jest.clearAllMocks();
});

// Manejo de consola para tests más limpios
const originalError = console.error;
const originalWarn = console.warn;

beforeAll(() => {
  console.error = jest.fn((...args) => {
    if (
      typeof args[0] === 'string' &&
      args[0].includes('Warning: ReactDOM.render')
    ) {
      return;
    }
    originalError.call(console, ...args);
  });

  console.warn = jest.fn((...args) => {
    if (
      typeof args[0] === 'string' &&
      args[0].includes('componentWillReceiveProps')
    ) {
      return;
    }
    originalWarn.call(console, ...args);
  });
});

afterAll(() => {
  console.error = originalError;
  console.warn = originalWarn;
});

// Configurar timezone para tests consistentes
process.env.TZ = 'UTC';

// Configurar variables de entorno para tests
process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test_db';
process.env.NEXTAUTH_SECRET = 'test-secret-key-for-testing-only';
process.env.NEXTAUTH_URL = 'http://localhost:3000';
process.env.ENCRYPTION_KEY = '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';
process.env.JWT_SECRET = 'test-jwt-secret';
process.env.SMTP_HOST = 'smtp.test.com';
process.env.SMTP_PORT = '587';
process.env.SMTP_USER = 'test@test.com';
process.env.SMTP_PASS = 'test-password';
process.env.SMTP_FROM = 'noreply@test.com';

export { prismaMock };
