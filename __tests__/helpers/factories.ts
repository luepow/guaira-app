import { User, Wallet, Transaction, OtpCode, Payment } from '@prisma/client';
import { generateUuid } from '../../app/lib/utils/crypto';

/**
 * Test Data Factories
 * Genera datos de prueba consistentes para los tests
 */

export class TestDataFactory {
  /**
   * Crea un usuario de prueba
   */
  static createUser(overrides?: Partial<User>): User {
    return {
      id: generateUuid(),
      phone: '+1234567890',
      password: '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyDfqXaL8Fae', // hashed "password123"
      name: 'Test User',
      email: 'test@example.com',
      emailVerified: new Date(),
      role: 'customer',
      avatar: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      ...overrides,
    };
  }

  /**
   * Crea una wallet de prueba
   */
  static createWallet(overrides?: Partial<Wallet>): Wallet {
    return {
      id: generateUuid(),
      userId: generateUuid(),
      balance: 100.0,
      currency: 'USD',
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date(),
      ...overrides,
    };
  }

  /**
   * Crea una transacción de prueba
   */
  static createTransaction(overrides?: Partial<Transaction>): Transaction {
    return {
      id: generateUuid(),
      userId: generateUuid(),
      walletId: generateUuid(),
      type: 'deposit',
      amount: 50.0,
      currency: 'USD',
      status: 'succeeded',
      description: 'Test transaction',
      metadata: null,
      idempotencyKey: generateUuid(),
      failureReason: null,
      sourceId: null,
      destinationId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      ...overrides,
    };
  }

  /**
   * Crea un código OTP de prueba
   */
  static createOtpCode(overrides?: Partial<OtpCode>): OtpCode {
    return {
      id: generateUuid(),
      userId: generateUuid(),
      email: 'test@example.com',
      code: '$2a$10$hashedOtpCode',
      purpose: 'login',
      expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutos
      attempts: 0,
      verified: false,
      ipAddress: '127.0.0.1',
      userAgent: 'Test Agent',
      createdAt: new Date(),
      ...overrides,
    };
  }

  /**
   * Crea un pago de prueba
   */
  static createPayment(overrides?: Partial<Payment>): Payment {
    return {
      id: generateUuid(),
      userId: generateUuid(),
      merchantId: generateUuid(),
      amount: 100.0,
      currency: 'USD',
      status: 'succeeded',
      description: 'Test payment',
      items: null,
      provider: 'wallet',
      providerId: null,
      metadata: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      ...overrides,
    };
  }

  /**
   * Crea múltiples usuarios
   */
  static createUsers(count: number, overrides?: Partial<User>): User[] {
    return Array.from({ length: count }, (_, i) =>
      this.createUser({
        email: `test${i}@example.com`,
        phone: `+123456789${i}`,
        name: `Test User ${i}`,
        ...overrides,
      })
    );
  }

  /**
   * Crea múltiples transacciones
   */
  static createTransactions(
    count: number,
    overrides?: Partial<Transaction>
  ): Transaction[] {
    return Array.from({ length: count }, (_, i) =>
      this.createTransaction({
        amount: (i + 1) * 10,
        description: `Test transaction ${i}`,
        ...overrides,
      })
    );
  }

  /**
   * Crea datos completos de usuario con wallet
   */
  static createUserWithWallet(
    userOverrides?: Partial<User>,
    walletOverrides?: Partial<Wallet>
  ): { user: User; wallet: Wallet } {
    const user = this.createUser(userOverrides);
    const wallet = this.createWallet({
      userId: user.id,
      ...walletOverrides,
    });

    return { user, wallet };
  }

  /**
   * Genera idempotency key único
   */
  static generateIdempotencyKey(): string {
    return `test-${generateUuid()}`;
  }

  /**
   * Genera email único para tests
   */
  static generateEmail(): string {
    return `test-${Date.now()}-${Math.random().toString(36).substring(7)}@example.com`;
  }

  /**
   * Genera teléfono único para tests
   */
  static generatePhone(): string {
    return `+1${Math.floor(1000000000 + Math.random() * 9000000000)}`;
  }
}
