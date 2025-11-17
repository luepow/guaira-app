import { OtpService } from '../../../app/services/otp.service';
import { TestDataFactory } from '../../helpers/factories';
import { prismaMock } from '../../setup';
import { AppError, ErrorCodes } from '../../../app/lib/utils/response';
import * as crypto from '../../../app/lib/utils/crypto';
import * as email from '../../../app/lib/utils/email';
import * as rateLimiter from '../../../app/lib/utils/rate-limiter';

// Mock de módulos
jest.mock('../../../app/lib/utils/crypto');
jest.mock('../../../app/lib/utils/email');
jest.mock('../../../app/lib/utils/rate-limiter');
jest.mock('../../../app/lib/utils/audit');

describe('OtpService', () => {
  const mockGenerateOtp = crypto.generateOtp as jest.MockedFunction<
    typeof crypto.generateOtp
  >;
  const mockHashOtp = crypto.hashOtp as jest.MockedFunction<
    typeof crypto.hashOtp
  >;
  const mockVerifyOtp = crypto.verifyOtp as jest.MockedFunction<
    typeof crypto.verifyOtp
  >;
  const mockEmailService = email.emailService as jest.Mocked<
    typeof email.emailService
  >;
  const mockRateLimiter = rateLimiter.RateLimiter as jest.Mocked<
    typeof rateLimiter.RateLimiter
  >;

  beforeEach(() => {
    jest.clearAllMocks();

    // Setup default mocks
    mockRateLimiter.checkLimit = jest.fn().mockResolvedValue({
      allowed: true,
      remainingAttempts: 5,
      resetAt: new Date(),
    });
  });

  describe('generateAndSend', () => {
    it('TC-OTP-001: Debe generar y enviar OTP correctamente', async () => {
      // Arrange
      const email = TestDataFactory.generateEmail();
      const otp = '123456';
      const hashedOtp = '$2a$10$hashedOtp';
      const user = TestDataFactory.createUser({ email });

      mockGenerateOtp.mockReturnValue(otp);
      mockHashOtp.mockResolvedValue(hashedOtp);
      prismaMock.user.findUnique.mockResolvedValue(user);
      prismaMock.otpCode.updateMany.mockResolvedValue({ count: 0 });
      prismaMock.otpCode.create.mockResolvedValue(
        TestDataFactory.createOtpCode({
          email,
          code: hashedOtp,
          userId: user.id,
        })
      );
      mockEmailService.sendOtp = jest.fn().mockResolvedValue(true);

      // Act
      const result = await OtpService.generateAndSend({
        email,
        purpose: 'login',
        ipAddress: '127.0.0.1',
        userAgent: 'Test Agent',
      });

      // Assert
      expect(result.success).toBe(true);
      expect(result.expiresAt).toBeInstanceOf(Date);
      expect(mockGenerateOtp).toHaveBeenCalled();
      expect(mockHashOtp).toHaveBeenCalledWith(otp);
      expect(mockEmailService.sendOtp).toHaveBeenCalledWith(email, otp, 10);
      expect(prismaMock.otpCode.create).toHaveBeenCalled();
    });

    it('TC-OTP-002: Debe invalidar OTPs anteriores antes de crear uno nuevo', async () => {
      // Arrange
      const email = TestDataFactory.generateEmail();
      const otp = '123456';

      mockGenerateOtp.mockReturnValue(otp);
      mockHashOtp.mockResolvedValue('$2a$10$hash');
      prismaMock.user.findUnique.mockResolvedValue(null);
      prismaMock.otpCode.updateMany.mockResolvedValue({ count: 2 }); // 2 OTPs invalidados
      prismaMock.otpCode.create.mockResolvedValue(
        TestDataFactory.createOtpCode({ email })
      );
      mockEmailService.sendOtp = jest.fn().mockResolvedValue(true);

      // Act
      await OtpService.generateAndSend({ email });

      // Assert
      expect(prismaMock.otpCode.updateMany).toHaveBeenCalledWith({
        where: {
          email,
          purpose: 'login',
          verified: false,
        },
        data: {
          verified: true,
        },
      });
    });

    it('TC-OTP-003: Debe aplicar rate limiting correctamente', async () => {
      // Arrange
      const email = TestDataFactory.generateEmail();
      mockRateLimiter.checkLimit = jest.fn().mockResolvedValue({
        allowed: false,
        remainingAttempts: 0,
        resetAt: new Date(Date.now() + 60000),
      });

      // Act & Assert
      await expect(
        OtpService.generateAndSend({ email })
      ).rejects.toThrow(AppError);

      await expect(
        OtpService.generateAndSend({ email })
      ).rejects.toMatchObject({
        code: ErrorCodes.RATE_LIMIT_EXCEEDED,
        statusCode: 429,
      });
    });

    it('TC-OTP-004: Debe eliminar OTP si falla el envío de email', async () => {
      // Arrange
      const email = TestDataFactory.generateEmail();
      const otpRecord = TestDataFactory.createOtpCode({ email });

      mockGenerateOtp.mockReturnValue('123456');
      mockHashOtp.mockResolvedValue('$2a$10$hash');
      prismaMock.user.findUnique.mockResolvedValue(null);
      prismaMock.otpCode.updateMany.mockResolvedValue({ count: 0 });
      prismaMock.otpCode.create.mockResolvedValue(otpRecord);
      prismaMock.otpCode.delete.mockResolvedValue(otpRecord);
      mockEmailService.sendOtp = jest
        .fn()
        .mockRejectedValue(new Error('Email service error'));

      // Act & Assert
      await expect(
        OtpService.generateAndSend({ email })
      ).rejects.toThrow(AppError);

      expect(prismaMock.otpCode.delete).toHaveBeenCalledWith({
        where: { id: otpRecord.id },
      });
    });

    it('TC-OTP-005: Debe configurar tiempo de expiración personalizado', async () => {
      // Arrange
      const email = TestDataFactory.generateEmail();
      const expiresInMinutes = 5;
      const now = Date.now();

      mockGenerateOtp.mockReturnValue('123456');
      mockHashOtp.mockResolvedValue('$2a$10$hash');
      prismaMock.user.findUnique.mockResolvedValue(null);
      prismaMock.otpCode.updateMany.mockResolvedValue({ count: 0 });
      prismaMock.otpCode.create.mockImplementation((args: any) => {
        return Promise.resolve({
          ...TestDataFactory.createOtpCode({ email }),
          expiresAt: args.data.expiresAt,
        });
      });
      mockEmailService.sendOtp = jest.fn().mockResolvedValue(true);

      // Act
      const result = await OtpService.generateAndSend({
        email,
        expiresInMinutes,
      });

      // Assert
      const expirationTime = result.expiresAt.getTime() - now;
      expect(expirationTime).toBeGreaterThan(expiresInMinutes * 60 * 1000 - 1000);
      expect(expirationTime).toBeLessThan(expiresInMinutes * 60 * 1000 + 1000);
    });
  });

  describe('verify', () => {
    it('TC-OTP-006: Debe verificar OTP correctamente', async () => {
      // Arrange
      const email = TestDataFactory.generateEmail();
      const otp = '123456';
      const user = TestDataFactory.createUser({ email });
      const otpRecord = TestDataFactory.createOtpCode({
        email,
        userId: user.id,
        verified: false,
        attempts: 0,
        expiresAt: new Date(Date.now() + 10 * 60 * 1000),
      });

      prismaMock.otpCode.findMany.mockResolvedValue([otpRecord]);
      prismaMock.otpCode.update
        .mockResolvedValueOnce({ ...otpRecord, attempts: 1 }) // Incremento
        .mockResolvedValueOnce({ ...otpRecord, verified: true }); // Marcado como verificado
      mockVerifyOtp.mockResolvedValue(true);

      // Act
      const result = await OtpService.verify({
        email,
        otp,
        purpose: 'login',
      });

      // Assert
      expect(result.success).toBe(true);
      expect(result.userId).toBe(user.id);
      expect(mockVerifyOtp).toHaveBeenCalledWith(otp, otpRecord.code);
      expect(prismaMock.otpCode.update).toHaveBeenCalledWith({
        where: { id: otpRecord.id },
        data: { verified: true },
      });
    });

    it('TC-OTP-007: Debe rechazar OTP inválido', async () => {
      // Arrange
      const email = TestDataFactory.generateEmail();
      const otp = '123456';
      const otpRecord = TestDataFactory.createOtpCode({
        email,
        verified: false,
        attempts: 0,
      });

      prismaMock.otpCode.findMany.mockResolvedValue([otpRecord]);
      prismaMock.otpCode.update.mockResolvedValue({ ...otpRecord, attempts: 1 });
      mockVerifyOtp.mockResolvedValue(false);

      // Act & Assert
      await expect(
        OtpService.verify({ email, otp })
      ).rejects.toThrow(AppError);

      await expect(
        OtpService.verify({ email, otp })
      ).rejects.toMatchObject({
        code: ErrorCodes.OTP_INVALID,
        statusCode: 400,
      });
    });

    it('TC-OTP-008: Debe rechazar OTP expirado', async () => {
      // Arrange
      const email = TestDataFactory.generateEmail();
      const otp = '123456';

      prismaMock.otpCode.findMany.mockResolvedValue([]); // No hay OTPs válidos

      // Act & Assert
      await expect(
        OtpService.verify({ email, otp })
      ).rejects.toThrow(AppError);

      await expect(
        OtpService.verify({ email, otp })
      ).rejects.toMatchObject({
        code: ErrorCodes.OTP_INVALID,
        message: 'Código OTP inválido o expirado',
      });
    });

    it('TC-OTP-009: Debe bloquear después de 5 intentos fallidos', async () => {
      // Arrange
      const email = TestDataFactory.generateEmail();
      const otp = '123456';
      const otpRecord = TestDataFactory.createOtpCode({
        email,
        verified: false,
        attempts: 5,
      });

      prismaMock.otpCode.findMany.mockResolvedValue([otpRecord]);
      prismaMock.otpCode.update
        .mockResolvedValueOnce({ ...otpRecord, attempts: 6 })
        .mockResolvedValueOnce({ ...otpRecord, verified: true });

      // Act & Assert
      await expect(
        OtpService.verify({ email, otp })
      ).rejects.toThrow(AppError);

      await expect(
        OtpService.verify({ email, otp })
      ).rejects.toMatchObject({
        code: ErrorCodes.OTP_MAX_ATTEMPTS,
        message: 'Máximo de intentos excedido. Solicita un nuevo código.',
      });

      // Verificar que el OTP se marcó como verificado (invalidado)
      expect(prismaMock.otpCode.update).toHaveBeenCalledWith({
        where: { id: otpRecord.id },
        data: { verified: true },
      });
    });

    it('TC-OTP-010: Debe aplicar rate limiting en verificación', async () => {
      // Arrange
      const email = TestDataFactory.generateEmail();
      mockRateLimiter.checkLimit = jest.fn().mockResolvedValue({
        allowed: false,
        remainingAttempts: 0,
        resetAt: new Date(Date.now() + 60000),
      });

      // Act & Assert
      await expect(
        OtpService.verify({ email, otp: '123456' })
      ).rejects.toThrow(AppError);

      await expect(
        OtpService.verify({ email, otp: '123456' })
      ).rejects.toMatchObject({
        code: ErrorCodes.RATE_LIMIT_EXCEEDED,
        statusCode: 429,
      });
    });

    it('TC-OTP-011: Debe incrementar contador de intentos', async () => {
      // Arrange
      const email = TestDataFactory.generateEmail();
      const otp = '123456';
      const otpRecord = TestDataFactory.createOtpCode({
        email,
        verified: false,
        attempts: 2,
      });

      prismaMock.otpCode.findMany.mockResolvedValue([otpRecord]);
      prismaMock.otpCode.update
        .mockResolvedValueOnce({ ...otpRecord, attempts: 3 })
        .mockResolvedValueOnce({ ...otpRecord, verified: true });
      mockVerifyOtp.mockResolvedValue(true);

      // Act
      await OtpService.verify({ email, otp });

      // Assert
      expect(prismaMock.otpCode.update).toHaveBeenCalledWith({
        where: { id: otpRecord.id },
        data: {
          attempts: {
            increment: 1,
          },
        },
      });
    });
  });

  describe('cleanExpired', () => {
    it('TC-OTP-012: Debe limpiar OTPs expirados', async () => {
      // Arrange
      prismaMock.otpCode.deleteMany.mockResolvedValue({ count: 5 });

      // Act
      const result = await OtpService.cleanExpired();

      // Assert
      expect(result).toBe(5);
      expect(prismaMock.otpCode.deleteMany).toHaveBeenCalled();
    });

    it('TC-OTP-013: Debe limpiar OTPs verificados antiguos', async () => {
      // Arrange
      const now = Date.now();
      prismaMock.otpCode.deleteMany.mockResolvedValue({ count: 3 });

      // Act
      await OtpService.cleanExpired();

      // Assert
      expect(prismaMock.otpCode.deleteMany).toHaveBeenCalledWith({
        where: {
          OR: [
            {
              expiresAt: {
                lt: expect.any(Date),
              },
            },
            {
              verified: true,
              createdAt: {
                lt: expect.any(Date),
              },
            },
          ],
        },
      });
    });
  });

  describe('getStats', () => {
    it('TC-OTP-014: Debe obtener estadísticas correctamente', async () => {
      // Arrange
      const email = TestDataFactory.generateEmail();
      prismaMock.otpCode.count
        .mockResolvedValueOnce(10) // Total generados
        .mockResolvedValueOnce(7) // Total verificados
        .mockResolvedValueOnce(1); // Pendientes

      // Act
      const result = await OtpService.getStats(email);

      // Assert
      expect(result).toEqual({
        totalGenerated: 10,
        totalVerified: 7,
        pendingVerification: 1,
      });
    });
  });
});
