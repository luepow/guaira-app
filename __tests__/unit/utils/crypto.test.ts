import * as crypto from '../../../app/lib/utils/crypto';

describe('Crypto Utils', () => {
  describe('generateOtp', () => {
    it('TC-CRYPTO-001: Debe generar un OTP de 6 dígitos', () => {
      // Act
      const otp = crypto.generateOtp();

      // Assert
      expect(otp).toHaveLength(6);
      expect(otp).toMatch(/^\d{6}$/);
    });

    it('TC-CRYPTO-002: Debe generar OTPs únicos', () => {
      // Act
      const otps = Array.from({ length: 100 }, () => crypto.generateOtp());
      const uniqueOtps = new Set(otps);

      // Assert
      expect(uniqueOtps.size).toBeGreaterThan(90); // Al menos 90% únicos
    });

    it('TC-CRYPTO-003: Debe generar OTPs en el rango válido', () => {
      // Act
      const otps = Array.from({ length: 100 }, () => crypto.generateOtp());

      // Assert
      otps.forEach((otp) => {
        const num = parseInt(otp, 10);
        expect(num).toBeGreaterThanOrEqual(100000);
        expect(num).toBeLessThan(1000000);
      });
    });
  });

  describe('hashOtp & verifyOtp', () => {
    it('TC-CRYPTO-004: Debe hashear y verificar OTP correctamente', async () => {
      // Arrange
      const otp = '123456';

      // Act
      const hash = await crypto.hashOtp(otp);
      const isValid = await crypto.verifyOtp(otp, hash);

      // Assert
      expect(hash).not.toBe(otp);
      expect(hash).toHaveLength(60); // bcrypt hash length
      expect(isValid).toBe(true);
    });

    it('TC-CRYPTO-005: Debe rechazar OTP incorrecto', async () => {
      // Arrange
      const correctOtp = '123456';
      const incorrectOtp = '654321';

      // Act
      const hash = await crypto.hashOtp(correctOtp);
      const isValid = await crypto.verifyOtp(incorrectOtp, hash);

      // Assert
      expect(isValid).toBe(false);
    });

    it('TC-CRYPTO-006: Debe generar salts diferentes para el mismo OTP', async () => {
      // Arrange
      const otp = '123456';

      // Act
      const hash1 = await crypto.hashOtp(otp);
      const hash2 = await crypto.hashOtp(otp);

      // Assert
      expect(hash1).not.toBe(hash2);
      expect(await crypto.verifyOtp(otp, hash1)).toBe(true);
      expect(await crypto.verifyOtp(otp, hash2)).toBe(true);
    });
  });

  describe('generateSecureToken', () => {
    it('TC-CRYPTO-007: Debe generar token con longitud por defecto', () => {
      // Act
      const token = crypto.generateSecureToken();

      // Assert
      expect(token).toHaveLength(64); // 32 bytes * 2 (hex)
      expect(token).toMatch(/^[0-9a-f]{64}$/);
    });

    it('TC-CRYPTO-008: Debe generar token con longitud personalizada', () => {
      // Act
      const token = crypto.generateSecureToken(16);

      // Assert
      expect(token).toHaveLength(32); // 16 bytes * 2 (hex)
      expect(token).toMatch(/^[0-9a-f]{32}$/);
    });

    it('TC-CRYPTO-009: Debe generar tokens únicos', () => {
      // Act
      const tokens = Array.from({ length: 100 }, () =>
        crypto.generateSecureToken()
      );
      const uniqueTokens = new Set(tokens);

      // Assert
      expect(uniqueTokens.size).toBe(100);
    });
  });

  describe('generateUuid', () => {
    it('TC-CRYPTO-010: Debe generar UUID v4 válido', () => {
      // Act
      const uuid = crypto.generateUuid();

      // Assert
      expect(uuid).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
      );
    });

    it('TC-CRYPTO-011: Debe generar UUIDs únicos', () => {
      // Act
      const uuids = Array.from({ length: 1000 }, () => crypto.generateUuid());
      const uniqueUuids = new Set(uuids);

      // Assert
      expect(uniqueUuids.size).toBe(1000);
    });
  });

  describe('hashPassword & verifyPassword', () => {
    it('TC-CRYPTO-012: Debe hashear y verificar contraseña correctamente', async () => {
      // Arrange
      const password = 'MySecurePassword123!';

      // Act
      const hash = await crypto.hashPassword(password);
      const isValid = await crypto.verifyPassword(password, hash);

      // Assert
      expect(hash).not.toBe(password);
      expect(hash).toHaveLength(60);
      expect(isValid).toBe(true);
    });

    it('TC-CRYPTO-013: Debe rechazar contraseña incorrecta', async () => {
      // Arrange
      const correctPassword = 'MySecurePassword123!';
      const incorrectPassword = 'WrongPassword456!';

      // Act
      const hash = await crypto.hashPassword(correctPassword);
      const isValid = await crypto.verifyPassword(incorrectPassword, hash);

      // Assert
      expect(isValid).toBe(false);
    });

    it('TC-CRYPTO-014: Debe usar cost factor alto (12) para passwords', async () => {
      // Arrange
      const password = 'TestPassword123!';

      // Act
      const hash = await crypto.hashPassword(password);

      // Assert
      // bcrypt hash format: $2a$rounds$salthash
      const rounds = hash.split('$')[2];
      expect(parseInt(rounds, 10)).toBe(12);
    });
  });

  describe('sha256', () => {
    it('TC-CRYPTO-015: Debe generar hash SHA-256 correcto', () => {
      // Arrange
      const data = 'test-data';

      // Act
      const hash = crypto.sha256(data);

      // Assert
      expect(hash).toHaveLength(64); // SHA-256 = 32 bytes = 64 hex chars
      expect(hash).toMatch(/^[0-9a-f]{64}$/);
    });

    it('TC-CRYPTO-016: Debe ser determinístico', () => {
      // Arrange
      const data = 'test-data';

      // Act
      const hash1 = crypto.sha256(data);
      const hash2 = crypto.sha256(data);

      // Assert
      expect(hash1).toBe(hash2);
    });

    it('TC-CRYPTO-017: Debe generar hashes diferentes para datos diferentes', () => {
      // Act
      const hash1 = crypto.sha256('data1');
      const hash2 = crypto.sha256('data2');

      // Assert
      expect(hash1).not.toBe(hash2);
    });
  });

  describe('hmacSha256 & verifyHmac', () => {
    it('TC-CRYPTO-018: Debe generar y verificar HMAC correctamente', () => {
      // Arrange
      const data = 'test-data';
      const secret = 'my-secret-key';

      // Act
      const hmac = crypto.hmacSha256(data, secret);
      const isValid = crypto.verifyHmac(data, secret, hmac);

      // Assert
      expect(hmac).toHaveLength(64);
      expect(isValid).toBe(true);
    });

    it('TC-CRYPTO-019: Debe rechazar HMAC con secret incorrecto', () => {
      // Arrange
      const data = 'test-data';
      const correctSecret = 'correct-secret';
      const incorrectSecret = 'wrong-secret';

      // Act
      const hmac = crypto.hmacSha256(data, correctSecret);
      const isValid = crypto.verifyHmac(data, incorrectSecret, hmac);

      // Assert
      expect(isValid).toBe(false);
    });

    it('TC-CRYPTO-020: Debe rechazar HMAC con datos modificados', () => {
      // Arrange
      const originalData = 'original-data';
      const modifiedData = 'modified-data';
      const secret = 'my-secret-key';

      // Act
      const hmac = crypto.hmacSha256(originalData, secret);
      const isValid = crypto.verifyHmac(modifiedData, secret, hmac);

      // Assert
      expect(isValid).toBe(false);
    });

    it('TC-CRYPTO-021: Debe ser determinístico', () => {
      // Arrange
      const data = 'test-data';
      const secret = 'my-secret-key';

      // Act
      const hmac1 = crypto.hmacSha256(data, secret);
      const hmac2 = crypto.hmacSha256(data, secret);

      // Assert
      expect(hmac1).toBe(hmac2);
    });
  });

  describe('encrypt & decrypt', () => {
    const testKey =
      '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';

    it('TC-CRYPTO-022: Debe encriptar y desencriptar correctamente', () => {
      // Arrange
      const plaintext = 'Sensitive data to encrypt';

      // Act
      const encrypted = crypto.encrypt(plaintext, testKey);
      const decrypted = crypto.decrypt(
        encrypted.encrypted,
        testKey,
        encrypted.iv,
        encrypted.tag
      );

      // Assert
      expect(encrypted.encrypted).not.toBe(plaintext);
      expect(encrypted.iv).toHaveLength(32); // 16 bytes = 32 hex
      expect(encrypted.tag).toHaveLength(32); // 16 bytes = 32 hex
      expect(decrypted).toBe(plaintext);
    });

    it('TC-CRYPTO-023: Debe usar IV diferente cada vez', () => {
      // Arrange
      const plaintext = 'Same data';

      // Act
      const encrypted1 = crypto.encrypt(plaintext, testKey);
      const encrypted2 = crypto.encrypt(plaintext, testKey);

      // Assert
      expect(encrypted1.iv).not.toBe(encrypted2.iv);
      expect(encrypted1.encrypted).not.toBe(encrypted2.encrypted);
    });

    it('TC-CRYPTO-024: Debe fallar con tag incorrecto', () => {
      // Arrange
      const plaintext = 'Test data';
      const encrypted = crypto.encrypt(plaintext, testKey);
      const wrongTag = '0'.repeat(32);

      // Act & Assert
      expect(() => {
        crypto.decrypt(encrypted.encrypted, testKey, encrypted.iv, wrongTag);
      }).toThrow();
    });

    it('TC-CRYPTO-025: Debe fallar con IV incorrecto', () => {
      // Arrange
      const plaintext = 'Test data';
      const encrypted = crypto.encrypt(plaintext, testKey);
      const wrongIv = '0'.repeat(32);

      // Act & Assert
      expect(() => {
        crypto.decrypt(encrypted.encrypted, testKey, wrongIv, encrypted.tag);
      }).toThrow();
    });

    it('TC-CRYPTO-026: Debe fallar con key incorrecta', () => {
      // Arrange
      const plaintext = 'Test data';
      const encrypted = crypto.encrypt(plaintext, testKey);
      const wrongKey =
        'ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff';

      // Act & Assert
      expect(() => {
        crypto.decrypt(
          encrypted.encrypted,
          wrongKey,
          encrypted.iv,
          encrypted.tag
        );
      }).toThrow();
    });
  });

  describe('maskSensitiveData', () => {
    it('TC-CRYPTO-027: Debe enmascarar datos sensibles correctamente', () => {
      // Arrange
      const data = '1234567890123456';

      // Act
      const masked = crypto.maskSensitiveData(data, 4);

      // Assert
      expect(masked).toBe('1234********3456');
      expect(masked).toHaveLength(data.length);
    });

    it('TC-CRYPTO-028: Debe manejar datos cortos', () => {
      // Arrange
      const data = '1234';

      // Act
      const masked = crypto.maskSensitiveData(data, 4);

      // Assert
      expect(masked).toBe('****');
      expect(masked).toHaveLength(data.length);
    });

    it('TC-CRYPTO-029: Debe permitir configurar caracteres visibles', () => {
      // Arrange
      const data = '1234567890';

      // Act
      const masked2 = crypto.maskSensitiveData(data, 2);
      const masked3 = crypto.maskSensitiveData(data, 3);

      // Assert
      expect(masked2).toBe('12******90');
      expect(masked3).toBe('123****890');
    });

    it('TC-CRYPTO-030: Debe manejar strings vacíos', () => {
      // Arrange
      const data = '';

      // Act
      const masked = crypto.maskSensitiveData(data);

      // Assert
      expect(masked).toBe('');
    });
  });
});
