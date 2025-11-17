import { RateLimiter, RateLimitPresets } from '../../../app/lib/utils/rate-limiter';
import { prismaMock } from '../../setup';
import { TestDataFactory } from '../../helpers/factories';

describe('RateLimiter', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('checkLimit', () => {
    it('TC-RATELIMIT-001: Debe permitir el primer intento', async () => {
      // Arrange
      const config = {
        identifier: '127.0.0.1',
        action: 'test_action',
        maxAttempts: 5,
        windowMs: 60000,
      };

      prismaMock.rateLimitLog.deleteMany.mockResolvedValue({ count: 0 });
      prismaMock.rateLimitLog.findMany.mockResolvedValue([]);
      prismaMock.rateLimitLog.create.mockResolvedValue({} as any);

      // Act
      const result = await RateLimiter.checkLimit(config);

      // Assert
      expect(result.allowed).toBe(true);
      expect(result.remainingAttempts).toBe(4);
      expect(result.currentCount).toBe(1);
      expect(prismaMock.rateLimitLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            identifier: config.identifier,
            action: config.action,
            count: 1,
            blocked: false,
          }),
        })
      );
    });

    it('TC-RATELIMIT-002: Debe bloquear después de exceder el límite', async () => {
      // Arrange
      const config = {
        identifier: '127.0.0.1',
        action: 'test_action',
        maxAttempts: 3,
        windowMs: 60000,
      };

      const existingLogs = [
        { count: 2, windowEnd: new Date(Date.now() + 30000) },
        { count: 1, windowEnd: new Date(Date.now() + 40000) },
      ];

      prismaMock.rateLimitLog.deleteMany.mockResolvedValue({ count: 0 });
      prismaMock.rateLimitLog.findMany.mockResolvedValue(existingLogs as any);
      prismaMock.rateLimitLog.create.mockResolvedValue({} as any);

      // Act
      const result = await RateLimiter.checkLimit(config);

      // Assert
      expect(result.allowed).toBe(false);
      expect(result.remainingAttempts).toBe(0);
      expect(result.currentCount).toBe(3);
      expect(prismaMock.rateLimitLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            blocked: true,
            metadata: expect.objectContaining({
              reason: 'Rate limit exceeded',
            }),
          }),
        })
      );
    });

    it('TC-RATELIMIT-003: Debe calcular remaining attempts correctamente', async () => {
      // Arrange
      const config = {
        identifier: '127.0.0.1',
        action: 'test_action',
        maxAttempts: 5,
        windowMs: 60000,
      };

      const existingLogs = [{ count: 2, windowEnd: new Date(Date.now() + 30000) }];

      prismaMock.rateLimitLog.deleteMany.mockResolvedValue({ count: 0 });
      prismaMock.rateLimitLog.findMany.mockResolvedValue(existingLogs as any);
      prismaMock.rateLimitLog.create.mockResolvedValue({} as any);

      // Act
      const result = await RateLimiter.checkLimit(config);

      // Assert
      expect(result.allowed).toBe(true);
      expect(result.remainingAttempts).toBe(2); // 5 max - 2 existing - 1 current = 2
      expect(result.currentCount).toBe(3);
    });

    it('TC-RATELIMIT-004: Debe limpiar logs antiguos', async () => {
      // Arrange
      const config = {
        identifier: '127.0.0.1',
        action: 'test_action',
        maxAttempts: 5,
        windowMs: 60000,
      };

      prismaMock.rateLimitLog.deleteMany.mockResolvedValue({ count: 3 });
      prismaMock.rateLimitLog.findMany.mockResolvedValue([]);
      prismaMock.rateLimitLog.create.mockResolvedValue({} as any);

      // Act
      await RateLimiter.checkLimit(config);

      // Assert
      expect(prismaMock.rateLimitLog.deleteMany).toHaveBeenCalledWith({
        where: {
          identifier: config.identifier,
          action: config.action,
          windowEnd: {
            lt: expect.any(Date),
          },
        },
      });
    });

    it('TC-RATELIMIT-005: Debe usar sliding window correctamente', async () => {
      // Arrange
      const config = {
        identifier: '127.0.0.1',
        action: 'test_action',
        maxAttempts: 3,
        windowMs: 60000,
      };

      const now = Date.now();
      const existingLogs = [
        { count: 1, windowEnd: new Date(now + 10000) },
        { count: 1, windowEnd: new Date(now + 20000) },
      ];

      prismaMock.rateLimitLog.deleteMany.mockResolvedValue({ count: 0 });
      prismaMock.rateLimitLog.findMany.mockResolvedValue(existingLogs as any);
      prismaMock.rateLimitLog.create.mockResolvedValue({} as any);

      // Act
      const result = await RateLimiter.checkLimit(config);

      // Assert
      expect(result.allowed).toBe(true); // 2 existing + 1 current = 3, justo en el límite
      expect(result.currentCount).toBe(3);
      expect(prismaMock.rateLimitLog.findMany).toHaveBeenCalledWith({
        where: {
          identifier: config.identifier,
          action: config.action,
          windowEnd: {
            gte: expect.any(Date),
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      });
    });

    it('TC-RATELIMIT-006: Debe manejar múltiples acciones independientemente', async () => {
      // Arrange
      const identifier = '127.0.0.1';
      const config1 = {
        identifier,
        action: 'login',
        maxAttempts: 5,
        windowMs: 60000,
      };
      const config2 = {
        identifier,
        action: 'otp_gen',
        maxAttempts: 5,
        windowMs: 60000,
      };

      prismaMock.rateLimitLog.deleteMany.mockResolvedValue({ count: 0 });
      prismaMock.rateLimitLog.findMany.mockResolvedValue([]);
      prismaMock.rateLimitLog.create.mockResolvedValue({} as any);

      // Act
      const result1 = await RateLimiter.checkLimit(config1);
      const result2 = await RateLimiter.checkLimit(config2);

      // Assert
      expect(result1.allowed).toBe(true);
      expect(result2.allowed).toBe(true);
      expect(prismaMock.rateLimitLog.create).toHaveBeenCalledTimes(2);
    });
  });

  describe('resetLimit', () => {
    it('TC-RATELIMIT-007: Debe resetear límites correctamente', async () => {
      // Arrange
      const identifier = '127.0.0.1';
      const action = 'test_action';

      prismaMock.rateLimitLog.deleteMany.mockResolvedValue({ count: 5 });

      // Act
      await RateLimiter.resetLimit(identifier, action);

      // Assert
      expect(prismaMock.rateLimitLog.deleteMany).toHaveBeenCalledWith({
        where: {
          identifier,
          action,
        },
      });
    });

    it('TC-RATELIMIT-008: Debe permitir intentos después de reset', async () => {
      // Arrange
      const identifier = '127.0.0.1';
      const action = 'test_action';
      const config = {
        identifier,
        action,
        maxAttempts: 5,
        windowMs: 60000,
      };

      // Reset
      prismaMock.rateLimitLog.deleteMany.mockResolvedValue({ count: 5 });
      await RateLimiter.resetLimit(identifier, action);

      // Check limit después de reset
      prismaMock.rateLimitLog.deleteMany.mockResolvedValue({ count: 0 });
      prismaMock.rateLimitLog.findMany.mockResolvedValue([]);
      prismaMock.rateLimitLog.create.mockResolvedValue({} as any);

      // Act
      const result = await RateLimiter.checkLimit(config);

      // Assert
      expect(result.allowed).toBe(true);
      expect(result.remainingAttempts).toBe(4);
    });
  });

  describe('isBlocked', () => {
    it('TC-RATELIMIT-009: Debe detectar cuando está bloqueado', async () => {
      // Arrange
      const identifier = '127.0.0.1';
      const action = 'test_action';

      prismaMock.rateLimitLog.findFirst.mockResolvedValue({
        id: '1',
        identifier,
        action,
        blocked: true,
        windowEnd: new Date(Date.now() + 30000),
      } as any);

      // Act
      const result = await RateLimiter.isBlocked(identifier, action);

      // Assert
      expect(result).toBe(true);
    });

    it('TC-RATELIMIT-010: Debe detectar cuando NO está bloqueado', async () => {
      // Arrange
      const identifier = '127.0.0.1';
      const action = 'test_action';

      prismaMock.rateLimitLog.findFirst.mockResolvedValue(null);

      // Act
      const result = await RateLimiter.isBlocked(identifier, action);

      // Assert
      expect(result).toBe(false);
    });

    it('TC-RATELIMIT-011: Debe ignorar bloqueos expirados', async () => {
      // Arrange
      const identifier = '127.0.0.1';
      const action = 'test_action';

      prismaMock.rateLimitLog.findFirst.mockResolvedValue(null);

      // Act
      const result = await RateLimiter.isBlocked(identifier, action);

      // Assert
      expect(result).toBe(false);
      expect(prismaMock.rateLimitLog.findFirst).toHaveBeenCalledWith({
        where: {
          identifier,
          action,
          blocked: true,
          windowEnd: {
            gte: expect.any(Date),
          },
        },
      });
    });
  });

  describe('RateLimitPresets', () => {
    it('TC-RATELIMIT-012: Debe tener preset OTP_GENERATION', () => {
      // Assert
      expect(RateLimitPresets.OTP_GENERATION).toBeDefined();
      expect(RateLimitPresets.OTP_GENERATION.maxAttempts).toBe(5);
      expect(RateLimitPresets.OTP_GENERATION.windowMs).toBe(15 * 60 * 1000);
    });

    it('TC-RATELIMIT-013: Debe tener preset OTP_VERIFICATION', () => {
      // Assert
      expect(RateLimitPresets.OTP_VERIFICATION).toBeDefined();
      expect(RateLimitPresets.OTP_VERIFICATION.maxAttempts).toBe(10);
      expect(RateLimitPresets.OTP_VERIFICATION.windowMs).toBe(15 * 60 * 1000);
    });

    it('TC-RATELIMIT-014: Debe tener preset LOGIN_ATTEMPT', () => {
      // Assert
      expect(RateLimitPresets.LOGIN_ATTEMPT).toBeDefined();
      expect(RateLimitPresets.LOGIN_ATTEMPT.maxAttempts).toBe(5);
      expect(RateLimitPresets.LOGIN_ATTEMPT.windowMs).toBe(15 * 60 * 1000);
    });

    it('TC-RATELIMIT-015: Debe tener preset PASSWORD_RESET', () => {
      // Assert
      expect(RateLimitPresets.PASSWORD_RESET).toBeDefined();
      expect(RateLimitPresets.PASSWORD_RESET.maxAttempts).toBe(3);
      expect(RateLimitPresets.PASSWORD_RESET.windowMs).toBe(60 * 60 * 1000);
    });

    it('TC-RATELIMIT-016: Debe tener preset API_CALL', () => {
      // Assert
      expect(RateLimitPresets.API_CALL).toBeDefined();
      expect(RateLimitPresets.API_CALL.maxAttempts).toBe(100);
      expect(RateLimitPresets.API_CALL.windowMs).toBe(60 * 1000);
    });

    it('TC-RATELIMIT-017: Debe tener preset WALLET_TRANSACTION', () => {
      // Assert
      expect(RateLimitPresets.WALLET_TRANSACTION).toBeDefined();
      expect(RateLimitPresets.WALLET_TRANSACTION.maxAttempts).toBe(10);
      expect(RateLimitPresets.WALLET_TRANSACTION.windowMs).toBe(60 * 1000);
    });

    it('TC-RATELIMIT-018: Debe tener preset PAYMENT_CREATION', () => {
      // Assert
      expect(RateLimitPresets.PAYMENT_CREATION).toBeDefined();
      expect(RateLimitPresets.PAYMENT_CREATION.maxAttempts).toBe(20);
      expect(RateLimitPresets.PAYMENT_CREATION.windowMs).toBe(60 * 1000);
    });
  });

  describe('Escenarios de integración', () => {
    it('TC-RATELIMIT-019: Debe bloquear ataque de fuerza bruta', async () => {
      // Arrange
      const config = {
        identifier: 'attacker@example.com',
        action: 'login_attempt',
        maxAttempts: 5,
        windowMs: 60000,
      };

      let currentCount = 0;
      prismaMock.rateLimitLog.deleteMany.mockResolvedValue({ count: 0 });
      prismaMock.rateLimitLog.findMany.mockImplementation(() => {
        const logs = Array.from({ length: currentCount }, (_, i) => ({
          count: 1,
          windowEnd: new Date(Date.now() + 30000),
        }));
        return Promise.resolve(logs as any);
      });
      prismaMock.rateLimitLog.create.mockImplementation(() => {
        currentCount++;
        return Promise.resolve({} as any);
      });

      // Act - Simular 10 intentos de login
      const results = [];
      for (let i = 0; i < 10; i++) {
        const result = await RateLimiter.checkLimit(config);
        results.push(result);
      }

      // Assert
      const allowedCount = results.filter((r) => r.allowed).length;
      const blockedCount = results.filter((r) => !r.allowed).length;

      expect(allowedCount).toBe(5); // Solo 5 permitidos
      expect(blockedCount).toBe(5); // 5 bloqueados
    });

    it('TC-RATELIMIT-020: Debe permitir ráfagas dentro del límite', async () => {
      // Arrange
      const config = {
        identifier: 'user@example.com',
        action: 'api_call',
        maxAttempts: 10,
        windowMs: 60000,
      };

      let currentCount = 0;
      prismaMock.rateLimitLog.deleteMany.mockResolvedValue({ count: 0 });
      prismaMock.rateLimitLog.findMany.mockImplementation(() => {
        const logs = Array.from({ length: currentCount }, (_, i) => ({
          count: 1,
          windowEnd: new Date(Date.now() + 30000),
        }));
        return Promise.resolve(logs as any);
      });
      prismaMock.rateLimitLog.create.mockImplementation(() => {
        currentCount++;
        return Promise.resolve({} as any);
      });

      // Act - Simular 5 llamadas rápidas
      const results = [];
      for (let i = 0; i < 5; i++) {
        const result = await RateLimiter.checkLimit(config);
        results.push(result);
      }

      // Assert
      const allAllowed = results.every((r) => r.allowed);
      expect(allAllowed).toBe(true);
    });
  });
});
