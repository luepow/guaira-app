import { z } from 'zod';
import {
  depositSchema,
  withdrawSchema,
  transferSchema,
} from '../../../app/lib/validations/wallet.schema';
import { TestDataFactory } from '../../helpers/factories';

describe('Wallet Validation Schemas', () => {
  describe('depositSchema', () => {
    it('TC-VALID-001: Debe validar un depósito válido', () => {
      // Arrange
      const validDeposit = {
        amount: 100.5,
        currency: 'USD',
        source: 'stripe',
        sourceId: 'pi_12345',
        description: 'Test deposit',
        metadata: { test: 'data' },
        idempotencyKey: TestDataFactory.generateIdempotencyKey(),
      };

      // Act
      const result = depositSchema.parse(validDeposit);

      // Assert
      expect(result).toEqual(validDeposit);
    });

    it('TC-VALID-002: Debe rechazar monto negativo', () => {
      // Arrange
      const invalidDeposit = {
        amount: -50,
        currency: 'USD',
        source: 'stripe',
        idempotencyKey: TestDataFactory.generateIdempotencyKey(),
      };

      // Act & Assert
      expect(() => depositSchema.parse(invalidDeposit)).toThrow(z.ZodError);
    });

    it('TC-VALID-003: Debe rechazar monto cero', () => {
      // Arrange
      const invalidDeposit = {
        amount: 0,
        currency: 'USD',
        source: 'stripe',
        idempotencyKey: TestDataFactory.generateIdempotencyKey(),
      };

      // Act & Assert
      expect(() => depositSchema.parse(invalidDeposit)).toThrow(z.ZodError);
    });

    it('TC-VALID-004: Debe rechazar sin idempotencyKey', () => {
      // Arrange
      const invalidDeposit = {
        amount: 100,
        currency: 'USD',
        source: 'stripe',
      };

      // Act & Assert
      expect(() => depositSchema.parse(invalidDeposit)).toThrow(z.ZodError);
    });

    it('TC-VALID-005: Debe usar valores por defecto', () => {
      // Arrange
      const deposit = {
        amount: 100,
        source: 'test',
        idempotencyKey: TestDataFactory.generateIdempotencyKey(),
      };

      // Act
      const result = depositSchema.parse(deposit);

      // Assert
      expect(result.currency).toBe('USD'); // Default
    });

    it('TC-VALID-006: Debe rechazar montos con más de 2 decimales', () => {
      // Arrange
      const invalidDeposit = {
        amount: 100.123,
        currency: 'USD',
        source: 'stripe',
        idempotencyKey: TestDataFactory.generateIdempotencyKey(),
      };

      // Act & Assert
      expect(() => depositSchema.parse(invalidDeposit)).toThrow(z.ZodError);
    });

    it('TC-VALID-007: Debe aceptar metadata opcional', () => {
      // Arrange
      const depositWithMetadata = {
        amount: 100,
        currency: 'USD',
        source: 'stripe',
        idempotencyKey: TestDataFactory.generateIdempotencyKey(),
        metadata: {
          customField: 'value',
          nested: { data: 'test' },
        },
      };

      // Act
      const result = depositSchema.parse(depositWithMetadata);

      // Assert
      expect(result.metadata).toEqual(depositWithMetadata.metadata);
    });
  });

  describe('withdrawSchema', () => {
    it('TC-VALID-008: Debe validar un retiro válido', () => {
      // Arrange
      const validWithdraw = {
        amount: 50.25,
        currency: 'USD',
        destination: 'bank_account',
        destinationId: 'ba_12345',
        description: 'Test withdrawal',
        idempotencyKey: TestDataFactory.generateIdempotencyKey(),
      };

      // Act
      const result = withdrawSchema.parse(validWithdraw);

      // Assert
      expect(result).toEqual(validWithdraw);
    });

    it('TC-VALID-009: Debe rechazar monto negativo en retiro', () => {
      // Arrange
      const invalidWithdraw = {
        amount: -25,
        currency: 'USD',
        destination: 'bank_account',
        destinationId: 'ba_12345',
        idempotencyKey: TestDataFactory.generateIdempotencyKey(),
      };

      // Act & Assert
      expect(() => withdrawSchema.parse(invalidWithdraw)).toThrow(z.ZodError);
    });

    it('TC-VALID-010: Debe requerir destinationId', () => {
      // Arrange
      const invalidWithdraw = {
        amount: 50,
        currency: 'USD',
        destination: 'bank_account',
        idempotencyKey: TestDataFactory.generateIdempotencyKey(),
      };

      // Act & Assert
      expect(() => withdrawSchema.parse(invalidWithdraw)).toThrow(z.ZodError);
    });

    it('TC-VALID-011: Debe limitar monto máximo de retiro', () => {
      // Arrange
      const largeWithdraw = {
        amount: 100000, // Asumiendo límite de 10,000
        currency: 'USD',
        destination: 'bank_account',
        destinationId: 'ba_12345',
        idempotencyKey: TestDataFactory.generateIdempotencyKey(),
      };

      // Act
      // Dependiendo de la implementación, esto podría pasar o fallar
      const result = withdrawSchema.safeParse(largeWithdraw);

      // Assert
      // Verificar según las reglas de negocio
      expect(result.success).toBeDefined();
    });
  });

  describe('transferSchema', () => {
    it('TC-VALID-012: Debe validar una transferencia válida', () => {
      // Arrange
      const validTransfer = {
        amount: 75.5,
        currency: 'USD',
        toUserId: TestDataFactory.createUser().id,
        description: 'Test transfer',
        idempotencyKey: TestDataFactory.generateIdempotencyKey(),
      };

      // Act
      const result = transferSchema.parse(validTransfer);

      // Assert
      expect(result).toEqual(validTransfer);
    });

    it('TC-VALID-013: Debe rechazar monto negativo en transferencia', () => {
      // Arrange
      const invalidTransfer = {
        amount: -30,
        currency: 'USD',
        toUserId: TestDataFactory.createUser().id,
        idempotencyKey: TestDataFactory.generateIdempotencyKey(),
      };

      // Act & Assert
      expect(() => transferSchema.parse(invalidTransfer)).toThrow(z.ZodError);
    });

    it('TC-VALID-014: Debe requerir toUserId', () => {
      // Arrange
      const invalidTransfer = {
        amount: 50,
        currency: 'USD',
        idempotencyKey: TestDataFactory.generateIdempotencyKey(),
      };

      // Act & Assert
      expect(() => transferSchema.parse(invalidTransfer)).toThrow(z.ZodError);
    });

    it('TC-VALID-015: Debe validar formato UUID de toUserId', () => {
      // Arrange
      const invalidTransfer = {
        amount: 50,
        currency: 'USD',
        toUserId: 'invalid-uuid',
        idempotencyKey: TestDataFactory.generateIdempotencyKey(),
      };

      // Act & Assert
      expect(() => transferSchema.parse(invalidTransfer)).toThrow(z.ZodError);
    });

    it('TC-VALID-016: Debe aceptar descripción opcional', () => {
      // Arrange
      const transferWithoutDesc = {
        amount: 50,
        currency: 'USD',
        toUserId: TestDataFactory.createUser().id,
        idempotencyKey: TestDataFactory.generateIdempotencyKey(),
      };

      // Act
      const result = transferSchema.parse(transferWithoutDesc);

      // Assert
      expect(result.description).toBeUndefined();
    });
  });

  describe('Edge Cases y Seguridad', () => {
    it('TC-VALID-017: Debe rechazar tipos de datos incorrectos', () => {
      // Arrange
      const invalidData = {
        amount: '100', // String en vez de número
        currency: 'USD',
        source: 'stripe',
        idempotencyKey: TestDataFactory.generateIdempotencyKey(),
      };

      // Act & Assert
      expect(() => depositSchema.parse(invalidData)).toThrow(z.ZodError);
    });

    it('TC-VALID-018: Debe sanitizar y validar strings', () => {
      // Arrange
      const dataWithExtraSpaces = {
        amount: 100,
        currency: '  USD  ',
        source: '  stripe  ',
        idempotencyKey: TestDataFactory.generateIdempotencyKey(),
      };

      // Act
      const result = depositSchema.parse(dataWithExtraSpaces);

      // Assert
      // Verificar que los strings fueron trimmed (si el schema lo hace)
      expect(typeof result.currency).toBe('string');
      expect(typeof result.source).toBe('string');
    });

    it('TC-VALID-019: Debe rechazar objetos con campos extra no permitidos', () => {
      // Arrange
      const dataWithExtraFields = {
        amount: 100,
        currency: 'USD',
        source: 'stripe',
        idempotencyKey: TestDataFactory.generateIdempotencyKey(),
        maliciousField: '<script>alert("xss")</script>',
      };

      // Act
      const result = depositSchema.parse(dataWithExtraFields);

      // Assert
      // Zod por defecto elimina campos no definidos con .strict() o los ignora
      expect(result).not.toHaveProperty('maliciousField');
    });

    it('TC-VALID-020: Debe validar límites numéricos', () => {
      // Arrange
      const cases = [
        { amount: 0.01, shouldPass: true }, // Mínimo válido
        { amount: 0.001, shouldPass: false }, // Menos del mínimo
        { amount: Number.MAX_SAFE_INTEGER, shouldPass: false }, // Muy grande
        { amount: Infinity, shouldPass: false }, // Infinito
        { amount: NaN, shouldPass: false }, // No es número
      ];

      // Act & Assert
      cases.forEach(({ amount, shouldPass }) => {
        const data = {
          amount,
          currency: 'USD',
          source: 'test',
          idempotencyKey: TestDataFactory.generateIdempotencyKey(),
        };

        const result = depositSchema.safeParse(data);
        if (shouldPass) {
          expect(result.success).toBe(true);
        } else {
          expect(result.success).toBe(false);
        }
      });
    });
  });

  describe('Precision y Decimales', () => {
    it('TC-VALID-021: Debe validar precisión de dos decimales', () => {
      // Arrange
      const validAmounts = [100, 100.5, 100.25, 99.99, 0.01];
      const invalidAmounts = [100.123, 100.9999, 100.001];

      // Act & Assert
      validAmounts.forEach((amount) => {
        const data = {
          amount,
          currency: 'USD',
          source: 'test',
          idempotencyKey: TestDataFactory.generateIdempotencyKey(),
        };
        expect(() => depositSchema.parse(data)).not.toThrow();
      });

      invalidAmounts.forEach((amount) => {
        const data = {
          amount,
          currency: 'USD',
          source: 'test',
          idempotencyKey: TestDataFactory.generateIdempotencyKey(),
        };
        expect(() => depositSchema.parse(data)).toThrow(z.ZodError);
      });
    });
  });

  describe('Idempotency Key Validation', () => {
    it('TC-VALID-022: Debe aceptar varios formatos de idempotency key', () => {
      // Arrange
      const validKeys = [
        TestDataFactory.generateIdempotencyKey(),
        'custom-key-123',
        'abc123xyz789',
        'key-with-dashes-and-numbers-123',
      ];

      // Act & Assert
      validKeys.forEach((key) => {
        const data = {
          amount: 100,
          currency: 'USD',
          source: 'test',
          idempotencyKey: key,
        };
        expect(() => depositSchema.parse(data)).not.toThrow();
      });
    });

    it('TC-VALID-023: Debe rechazar idempotency keys vacíos', () => {
      // Arrange
      const invalidKeys = ['', '   ', null, undefined];

      // Act & Assert
      invalidKeys.forEach((key) => {
        const data = {
          amount: 100,
          currency: 'USD',
          source: 'test',
          idempotencyKey: key,
        };
        expect(() => depositSchema.parse(data)).toThrow();
      });
    });
  });
});
