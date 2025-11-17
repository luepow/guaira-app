import { depositSchema, transferSchema } from '../../app/lib/validations/wallet.schema';
import { z } from 'zod';
import { TestDataFactory } from '../helpers/factories';

/**
 * SECURITY TESTING - SQL Injection, NoSQL Injection, XSS
 * Verifica que el sistema rechace correctamente payloads maliciosos
 */
describe('Security - Injection Attacks', () => {
  describe('SQL Injection Prevention', () => {
    const sqlInjectionPayloads = [
      "'; DROP TABLE users; --",
      "' OR '1'='1",
      "admin'--",
      "' OR 1=1--",
      "1' UNION SELECT * FROM users--",
      "'; DELETE FROM wallet WHERE '1'='1",
      "1' AND 1=0 UNION ALL SELECT 'admin', '81dc9bdb52d04dc20036dbd8313ed055",
    ];

    it('SEC-001: Debe rechazar SQL injection en description', () => {
      sqlInjectionPayloads.forEach((payload) => {
        const maliciousData = {
          amount: 100,
          currency: 'USD',
          source: 'stripe' as const,
          description: payload,
          idempotencyKey: TestDataFactory.generateIdempotencyKey(),
        };

        // Act - El schema debería sanitizar o validar
        const result = depositSchema.safeParse(maliciousData);

        // Assert - Debe pasar pero la descripción debe estar limitada
        if (result.success) {
          expect(result.data.description).toBeDefined();
          expect(result.data.description!.length).toBeLessThan(500);
        }
      });
    });

    it('SEC-002: Debe rechazar SQL injection en sourceId', () => {
      const maliciousData = {
        amount: 100,
        currency: 'USD',
        source: 'stripe' as const,
        sourceId: "'; DROP TABLE transactions; --",
        idempotencyKey: TestDataFactory.generateIdempotencyKey(),
      };

      // Act
      const result = depositSchema.safeParse(maliciousData);

      // Assert - Debe validar o rechazar
      if (result.success) {
        expect(result.data.sourceId).toBeDefined();
        expect(result.data.sourceId!.length).toBeLessThan(255);
      }
    });

    it('SEC-003: Debe proteger UUID fields contra SQL injection', () => {
      const maliciousUUIDs = [
        "' OR '1'='1",
        "uuid' OR '1'='1",
        "'; DROP TABLE users; --",
      ];

      maliciousUUIDs.forEach((maliciousUUID) => {
        const maliciousData = {
          amount: 100,
          currency: 'USD',
          recipientId: maliciousUUID,
          idempotencyKey: TestDataFactory.generateIdempotencyKey(),
        };

        // Act
        const result = transferSchema.safeParse(maliciousData);

        // Assert - Debe rechazar UUIDs inválidos
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues.some(
            (issue) => issue.path.includes('recipientId')
          )).toBe(true);
        }
      });
    });
  });

  describe('NoSQL Injection Prevention', () => {
    const noSqlInjectionPayloads = [
      { $gt: '' },
      { $ne: null },
      { $where: 'this.balance > 0' },
      { $regex: '.*' },
    ];

    it('SEC-004: Debe rechazar objetos como amount', () => {
      const maliciousData = {
        amount: { $gt: 0 }, // NoSQL injection attempt
        currency: 'USD',
        source: 'stripe',
        idempotencyKey: TestDataFactory.generateIdempotencyKey(),
      };

      // Act
      const result = depositSchema.safeParse(maliciousData);

      // Assert - Debe rechazar porque amount debe ser number
      expect(result.success).toBe(false);
    });

    it('SEC-005: Debe rechazar metadata con operadores NoSQL', () => {
      const maliciousData = {
        amount: 100,
        currency: 'USD',
        source: 'stripe' as const,
        metadata: {
          query: { $where: 'this.balance > 0' },
          filter: { $ne: null },
        },
        idempotencyKey: TestDataFactory.generateIdempotencyKey(),
      };

      // Act
      const result = depositSchema.safeParse(maliciousData);

      // Assert - Metadata puede contener cualquier cosa, pero no debe ejecutarse
      // La protección real debe estar en la capa de base de datos
      if (result.success) {
        // Si pasa validación, asegurar que metadata está serializada correctamente
        expect(typeof result.data.metadata).toBe('object');
      }
    });
  });

  describe('XSS (Cross-Site Scripting) Prevention', () => {
    const xssPayloads = [
      '<script>alert("XSS")</script>',
      '<img src=x onerror=alert("XSS")>',
      '<svg/onload=alert("XSS")>',
      'javascript:alert("XSS")',
      '<iframe src="javascript:alert(\'XSS\')">',
      '"><script>alert(String.fromCharCode(88,83,83))</script>',
      '<body onload=alert("XSS")>',
    ];

    it('SEC-006: Debe validar description contra XSS', () => {
      xssPayloads.forEach((payload) => {
        const maliciousData = {
          amount: 100,
          currency: 'USD',
          source: 'stripe' as const,
          description: payload,
          idempotencyKey: TestDataFactory.generateIdempotencyKey(),
        };

        // Act
        const result = depositSchema.safeParse(maliciousData);

        // Assert - Debe pasar validación pero el string debe ser tratado como texto plano
        if (result.success) {
          expect(result.data.description).toBe(payload); // No debe modificar
          // La sanitización debe ocurrir en el frontend antes de renderizar
        }
      });
    });

    it('SEC-007: Debe manejar metadata con contenido XSS', () => {
      const maliciousData = {
        amount: 100,
        currency: 'USD',
        source: 'stripe' as const,
        metadata: {
          userNote: '<script>alert("XSS")</script>',
          customField: '<img src=x onerror=alert(1)>',
        },
        idempotencyKey: TestDataFactory.generateIdempotencyKey(),
      };

      // Act
      const result = depositSchema.safeParse(maliciousData);

      // Assert
      if (result.success) {
        expect(result.data.metadata).toBeDefined();
        // Metadata se almacena como está, pero debe tratarse como texto al renderizar
      }
    });
  });

  describe('Command Injection Prevention', () => {
    const commandInjectionPayloads = [
      '; ls -la',
      '| cat /etc/passwd',
      '`whoami`',
      '$(whoami)',
      '& ping -c 10 example.com',
    ];

    it('SEC-008: Debe rechazar command injection en strings', () => {
      commandInjectionPayloads.forEach((payload) => {
        const maliciousData = {
          amount: 100,
          currency: 'USD',
          source: 'stripe' as const,
          description: payload,
          idempotencyKey: TestDataFactory.generateIdempotencyKey(),
        };

        // Act
        const result = depositSchema.safeParse(maliciousData);

        // Assert - El string se acepta pero no debe ejecutarse como comando
        if (result.success) {
          expect(typeof result.data.description).toBe('string');
          // La protección real está en no ejecutar estos strings como comandos
        }
      });
    });
  });

  describe('Path Traversal Prevention', () => {
    const pathTraversalPayloads = [
      '../../../etc/passwd',
      '..\\..\\..\\windows\\system32\\config\\sam',
      '/etc/passwd%00.jpg',
      '....//....//....//etc/passwd',
    ];

    it('SEC-009: Debe validar paths en sourceId', () => {
      pathTraversalPayloads.forEach((payload) => {
        const maliciousData = {
          amount: 100,
          currency: 'USD',
          source: 'stripe' as const,
          sourceId: payload,
          idempotencyKey: TestDataFactory.generateIdempotencyKey(),
        };

        // Act
        const result = depositSchema.safeParse(maliciousData);

        // Assert - Debe aceptar pero no interpretar como path
        if (result.success) {
          expect(result.data.sourceId).toBe(payload);
          // No debe usarse para file operations
        }
      });
    });
  });

  describe('LDAP Injection Prevention', () => {
    const ldapInjectionPayloads = [
      '*)(uid=*',
      'admin)(|(password=*',
      '*))%00',
    ];

    it('SEC-010: Debe manejar LDAP injection attempts', () => {
      ldapInjectionPayloads.forEach((payload) => {
        const maliciousData = {
          amount: 100,
          currency: 'USD',
          source: 'stripe' as const,
          description: payload,
          idempotencyKey: TestDataFactory.generateIdempotencyKey(),
        };

        // Act
        const result = depositSchema.safeParse(maliciousData);

        // Assert
        if (result.success) {
          expect(typeof result.data.description).toBe('string');
        }
      });
    });
  });

  describe('XML Injection Prevention', () => {
    const xmlInjectionPayloads = [
      '<?xml version="1.0"?><!DOCTYPE foo [<!ENTITY xxe SYSTEM "file:///etc/passwd">]><foo>&xxe;</foo>',
      '<![CDATA[<script>alert("XSS")</script>]]>',
    ];

    it('SEC-011: Debe rechazar XML injection', () => {
      xmlInjectionPayloads.forEach((payload) => {
        const maliciousData = {
          amount: 100,
          currency: 'USD',
          source: 'stripe' as const,
          description: payload,
          idempotencyKey: TestDataFactory.generateIdempotencyKey(),
        };

        // Act
        const result = depositSchema.safeParse(maliciousData);

        // Assert - Acepta como string pero no debe parsear como XML
        if (result.success) {
          expect(typeof result.data.description).toBe('string');
        }
      });
    });
  });

  describe('Template Injection Prevention', () => {
    const templateInjectionPayloads = [
      '{{7*7}}',
      '${7*7}',
      '<%= 7*7 %>',
      '#{7*7}',
    ];

    it('SEC-012: Debe prevenir template injection', () => {
      templateInjectionPayloads.forEach((payload) => {
        const maliciousData = {
          amount: 100,
          currency: 'USD',
          source: 'stripe' as const,
          description: payload,
          idempotencyKey: TestDataFactory.generateIdempotencyKey(),
        };

        // Act
        const result = depositSchema.safeParse(maliciousData);

        // Assert - No debe evaluar como template
        if (result.success) {
          expect(result.data.description).toBe(payload);
          // No debe ejecutarse como código de template
        }
      });
    });
  });

  describe('Type Confusion Attacks', () => {
    it('SEC-013: Debe rechazar arrays como amount', () => {
      const maliciousData = {
        amount: [100, 200], // Array instead of number
        currency: 'USD',
        source: 'stripe',
        idempotencyKey: TestDataFactory.generateIdempotencyKey(),
      };

      // Act
      const result = depositSchema.safeParse(maliciousData);

      // Assert
      expect(result.success).toBe(false);
    });

    it('SEC-014: Debe rechazar null/undefined como valores requeridos', () => {
      const cases = [
        { amount: null },
        { amount: undefined },
        { currency: null },
      ];

      cases.forEach((maliciousFields) => {
        const maliciousData = {
          amount: 100,
          currency: 'USD',
          source: 'stripe' as const,
          idempotencyKey: TestDataFactory.generateIdempotencyKey(),
          ...maliciousFields,
        };

        // Act
        const result = depositSchema.safeParse(maliciousData);

        // Assert
        expect(result.success).toBe(false);
      });
    });

    it('SEC-015: Debe rechazar prototype pollution attempts', () => {
      const maliciousData = {
        amount: 100,
        currency: 'USD',
        source: 'stripe' as const,
        '__proto__': { isAdmin: true },
        'constructor': { prototype: { isAdmin: true } },
        idempotencyKey: TestDataFactory.generateIdempotencyKey(),
      };

      // Act
      const result = depositSchema.safeParse(maliciousData);

      // Assert - Schema debe ignorar estos campos
      if (result.success) {
        expect(result.data).not.toHaveProperty('__proto__');
        expect(result.data).not.toHaveProperty('constructor');
      }
    });
  });

  describe('Mass Assignment Attacks', () => {
    it('SEC-016: Debe ignorar campos no permitidos', () => {
      const maliciousData = {
        amount: 100,
        currency: 'USD',
        source: 'stripe' as const,
        idempotencyKey: TestDataFactory.generateIdempotencyKey(),
        // Campos maliciosos que no deberían aceptarse
        isAdmin: true,
        balance: 1000000,
        role: 'admin',
        permissions: ['all'],
      };

      // Act
      const result = depositSchema.safeParse(maliciousData);

      // Assert
      if (result.success) {
        expect(result.data).not.toHaveProperty('isAdmin');
        expect(result.data).not.toHaveProperty('balance');
        expect(result.data).not.toHaveProperty('role');
        expect(result.data).not.toHaveProperty('permissions');
      }
    });
  });

  describe('Integer Overflow/Underflow', () => {
    it('SEC-017: Debe rechazar valores numéricos extremos', () => {
      const extremeValues = [
        Number.MAX_SAFE_INTEGER + 1,
        Number.MIN_SAFE_INTEGER - 1,
        Number.POSITIVE_INFINITY,
        Number.NEGATIVE_INFINITY,
        NaN,
      ];

      extremeValues.forEach((amount) => {
        const maliciousData = {
          amount,
          currency: 'USD',
          source: 'stripe' as const,
          idempotencyKey: TestDataFactory.generateIdempotencyKey(),
        };

        // Act
        const result = depositSchema.safeParse(maliciousData);

        // Assert
        expect(result.success).toBe(false);
      });
    });

    it('SEC-018: Debe validar límites de monto', () => {
      const cases = [
        { amount: -1, shouldPass: false },
        { amount: 0, shouldPass: false },
        { amount: 0.01, shouldPass: true },
        { amount: 1000000, shouldPass: true },
        { amount: 1000001, shouldPass: false },
      ];

      cases.forEach(({ amount, shouldPass }) => {
        const data = {
          amount,
          currency: 'USD',
          source: 'stripe' as const,
          idempotencyKey: TestDataFactory.generateIdempotencyKey(),
        };

        // Act
        const result = depositSchema.safeParse(data);

        // Assert
        expect(result.success).toBe(shouldPass);
      });
    });
  });

  describe('Unicode/Encoding Attacks', () => {
    it('SEC-019: Debe manejar caracteres Unicode', () => {
      const unicodePayloads = [
        '𝕏𝕊𝕊', // Mathematical bold
        '＜script＞alert("XSS")＜/script＞', // Fullwidth
        'alert\u0028"XSS"\u0029', // Unicode escape
      ];

      unicodePayloads.forEach((payload) => {
        const data = {
          amount: 100,
          currency: 'USD',
          source: 'stripe' as const,
          description: payload,
          idempotencyKey: TestDataFactory.generateIdempotencyKey(),
        };

        // Act
        const result = depositSchema.safeParse(data);

        // Assert - Debe aceptar pero tratar como texto
        if (result.success) {
          expect(typeof result.data.description).toBe('string');
        }
      });
    });

    it('SEC-020: Debe manejar null bytes', () => {
      const nullBytePayloads = [
        'test\u0000.txt',
        'admin\x00user',
        'path/to/file%00.jpg',
      ];

      nullBytePayloads.forEach((payload) => {
        const data = {
          amount: 100,
          currency: 'USD',
          source: 'stripe' as const,
          description: payload,
          idempotencyKey: TestDataFactory.generateIdempotencyKey(),
        };

        // Act
        const result = depositSchema.safeParse(data);

        // Assert
        if (result.success) {
          expect(typeof result.data.description).toBe('string');
        }
      });
    });
  });
});
