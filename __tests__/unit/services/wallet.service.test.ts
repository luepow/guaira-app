import { WalletService } from '../../../app/lib/services/wallet.service';
import { TestDataFactory } from '../../helpers/factories';
import { prismaMock } from '../../setup';
import {
  NotFoundError,
  ConflictError,
  InsufficientBalanceError,
  AppError,
} from '../../../app/lib/utils/response';

describe('WalletService', () => {
  describe('createWallet', () => {
    it('TC-WALLET-001: Debe crear una wallet nueva correctamente', async () => {
      // Arrange
      const user = TestDataFactory.createUser();
      const expectedWallet = TestDataFactory.createWallet({ userId: user.id });

      prismaMock.user.findUnique.mockResolvedValue(user);
      prismaMock.wallet.findUnique.mockResolvedValue(null);
      prismaMock.wallet.create.mockResolvedValue(expectedWallet);

      // Act
      const result = await WalletService.createWallet({
        userId: user.id,
        currency: 'USD',
        initialBalance: 0,
      });

      // Assert
      expect(result).toBeDefined();
      expect(result.userId).toBe(user.id);
      expect(result.currency).toBe('USD');
      expect(result.status).toBe('active');
      expect(prismaMock.wallet.create).toHaveBeenCalledTimes(1);
    });

    it('TC-WALLET-002: Debe lanzar error si el usuario no existe', async () => {
      // Arrange
      prismaMock.user.findUnique.mockResolvedValue(null);

      // Act & Assert
      await expect(
        WalletService.createWallet({
          userId: 'non-existent-user',
          currency: 'USD',
        })
      ).rejects.toThrow(NotFoundError);
    });

    it('TC-WALLET-003: Debe lanzar error si la wallet ya existe', async () => {
      // Arrange
      const user = TestDataFactory.createUser();
      const existingWallet = TestDataFactory.createWallet({ userId: user.id });

      prismaMock.user.findUnique.mockResolvedValue(user);
      prismaMock.wallet.findUnique.mockResolvedValue(existingWallet);

      // Act & Assert
      await expect(
        WalletService.createWallet({
          userId: user.id,
          currency: 'USD',
        })
      ).rejects.toThrow(ConflictError);
    });

    it('TC-WALLET-004: Debe crear entradas de ledger con balance inicial', async () => {
      // Arrange
      const user = TestDataFactory.createUser();
      const initialBalance = 100;
      const expectedWallet = TestDataFactory.createWallet({
        userId: user.id,
        balance: initialBalance,
      });

      prismaMock.user.findUnique.mockResolvedValue(user);
      prismaMock.wallet.findUnique.mockResolvedValue(null);
      prismaMock.wallet.create.mockResolvedValue(expectedWallet);

      // Act
      const result = await WalletService.createWallet({
        userId: user.id,
        currency: 'USD',
        initialBalance,
      });

      // Assert
      expect(result.balance).toBe(initialBalance);
    });
  });

  describe('deposit', () => {
    it('TC-WALLET-005: Debe realizar un depósito correctamente', async () => {
      // Arrange
      const { user, wallet } = TestDataFactory.createUserWithWallet();
      const depositAmount = 50;
      const idempotencyKey = TestDataFactory.generateIdempotencyKey();
      const expectedTransaction = TestDataFactory.createTransaction({
        userId: user.id,
        walletId: wallet.id,
        type: 'deposit',
        amount: depositAmount,
        status: 'succeeded',
        idempotencyKey,
      });

      prismaMock.transaction.findUnique.mockResolvedValue(null);
      prismaMock.$transaction.mockImplementation(async (callback: any) => {
        prismaMock.wallet.findUnique.mockResolvedValue(wallet);
        prismaMock.transaction.create.mockResolvedValue(expectedTransaction);
        prismaMock.wallet.update.mockResolvedValue({
          ...wallet,
          balance: wallet.balance + depositAmount,
        });
        prismaMock.ledgerEntry.create.mockResolvedValue({} as any);
        return callback(prismaMock);
      });

      // Act
      const result = await WalletService.deposit({
        walletId: wallet.id,
        userId: user.id,
        amount: depositAmount,
        currency: 'USD',
        source: 'stripe',
        idempotencyKey,
      });

      // Assert
      expect(result).toBeDefined();
      expect(result.type).toBe('deposit');
      expect(result.amount).toBe(depositAmount);
      expect(result.status).toBe('succeeded');
    });

    it('TC-WALLET-006: Debe respetar idempotencia en depósitos', async () => {
      // Arrange
      const { user, wallet } = TestDataFactory.createUserWithWallet();
      const idempotencyKey = TestDataFactory.generateIdempotencyKey();
      const existingTransaction = TestDataFactory.createTransaction({
        idempotencyKey,
        userId: user.id,
        walletId: wallet.id,
      });

      prismaMock.transaction.findUnique.mockResolvedValue(existingTransaction);

      // Act
      const result = await WalletService.deposit({
        walletId: wallet.id,
        userId: user.id,
        amount: 50,
        currency: 'USD',
        source: 'stripe',
        idempotencyKey,
      });

      // Assert
      expect(result).toEqual(existingTransaction);
      expect(prismaMock.$transaction).not.toHaveBeenCalled();
    });

    it('TC-WALLET-007: Debe crear entradas de doble partida en depósito', async () => {
      // Arrange
      const { user, wallet } = TestDataFactory.createUserWithWallet();
      const depositAmount = 100;
      const idempotencyKey = TestDataFactory.generateIdempotencyKey();

      prismaMock.transaction.findUnique.mockResolvedValue(null);

      const ledgerEntryCreateSpy = jest.fn();
      prismaMock.$transaction.mockImplementation(async (callback: any) => {
        prismaMock.wallet.findUnique.mockResolvedValue(wallet);
        prismaMock.transaction.create.mockResolvedValue(
          TestDataFactory.createTransaction({
            userId: user.id,
            walletId: wallet.id,
            amount: depositAmount,
          })
        );
        prismaMock.wallet.update.mockResolvedValue(wallet);
        prismaMock.ledgerEntry.create.mockImplementation(ledgerEntryCreateSpy);
        return callback(prismaMock);
      });

      // Act
      await WalletService.deposit({
        walletId: wallet.id,
        userId: user.id,
        amount: depositAmount,
        currency: 'USD',
        source: 'test',
        idempotencyKey,
      });

      // Assert
      expect(ledgerEntryCreateSpy).toHaveBeenCalledTimes(2); // DR y CR
    });

    it('TC-WALLET-008: Debe rechazar depósito si wallet está suspendida', async () => {
      // Arrange
      const { user, wallet } = TestDataFactory.createUserWithWallet({
        walletOverrides: { status: 'suspended' },
      });
      const idempotencyKey = TestDataFactory.generateIdempotencyKey();

      prismaMock.transaction.findUnique.mockResolvedValue(null);
      prismaMock.$transaction.mockImplementation(async (callback: any) => {
        prismaMock.wallet.findUnique.mockResolvedValue(wallet);
        return callback(prismaMock);
      });

      // Act & Assert
      await expect(
        WalletService.deposit({
          walletId: wallet.id,
          userId: user.id,
          amount: 50,
          currency: 'USD',
          source: 'test',
          idempotencyKey,
        })
      ).rejects.toThrow(AppError);
    });
  });

  describe('withdraw', () => {
    it('TC-WALLET-009: Debe realizar un retiro correctamente', async () => {
      // Arrange
      const { user, wallet } = TestDataFactory.createUserWithWallet({
        walletOverrides: { balance: 200 },
      });
      const withdrawAmount = 50;
      const idempotencyKey = TestDataFactory.generateIdempotencyKey();

      prismaMock.transaction.findUnique.mockResolvedValue(null);
      prismaMock.$transaction.mockImplementation(async (callback: any) => {
        prismaMock.wallet.findUnique.mockResolvedValue(wallet);
        prismaMock.transaction.create.mockResolvedValue(
          TestDataFactory.createTransaction({
            userId: user.id,
            walletId: wallet.id,
            type: 'withdrawal',
            amount: withdrawAmount,
            status: 'processing',
          })
        );
        prismaMock.wallet.update.mockResolvedValue({
          ...wallet,
          balance: wallet.balance - withdrawAmount,
        });
        prismaMock.ledgerEntry.create.mockResolvedValue({} as any);
        return callback(prismaMock);
      });

      // Act
      const result = await WalletService.withdraw({
        walletId: wallet.id,
        userId: user.id,
        amount: withdrawAmount,
        currency: 'USD',
        destination: 'bank',
        destinationId: 'bank-123',
        idempotencyKey,
      });

      // Assert
      expect(result).toBeDefined();
      expect(result.type).toBe('withdrawal');
      expect(result.amount).toBe(withdrawAmount);
      expect(result.status).toBe('processing');
    });

    it('TC-WALLET-010: Debe rechazar retiro con saldo insuficiente', async () => {
      // Arrange
      const { user, wallet } = TestDataFactory.createUserWithWallet({
        walletOverrides: { balance: 10 },
      });
      const withdrawAmount = 50;
      const idempotencyKey = TestDataFactory.generateIdempotencyKey();

      prismaMock.transaction.findUnique.mockResolvedValue(null);
      prismaMock.$transaction.mockImplementation(async (callback: any) => {
        prismaMock.wallet.findUnique.mockResolvedValue(wallet);
        return callback(prismaMock);
      });

      // Act & Assert
      await expect(
        WalletService.withdraw({
          walletId: wallet.id,
          userId: user.id,
          amount: withdrawAmount,
          currency: 'USD',
          destination: 'bank',
          destinationId: 'bank-123',
          idempotencyKey,
        })
      ).rejects.toThrow(InsufficientBalanceError);
    });

    it('TC-WALLET-011: Debe respetar idempotencia en retiros', async () => {
      // Arrange
      const { user, wallet } = TestDataFactory.createUserWithWallet();
      const idempotencyKey = TestDataFactory.generateIdempotencyKey();
      const existingTransaction = TestDataFactory.createTransaction({
        idempotencyKey,
        type: 'withdrawal',
      });

      prismaMock.transaction.findUnique.mockResolvedValue(existingTransaction);

      // Act
      const result = await WalletService.withdraw({
        walletId: wallet.id,
        userId: user.id,
        amount: 50,
        currency: 'USD',
        destination: 'bank',
        destinationId: 'bank-123',
        idempotencyKey,
      });

      // Assert
      expect(result).toEqual(existingTransaction);
      expect(prismaMock.$transaction).not.toHaveBeenCalled();
    });
  });

  describe('transfer', () => {
    it('TC-WALLET-012: Debe realizar una transferencia correctamente', async () => {
      // Arrange
      const { user: fromUser, wallet: fromWallet } =
        TestDataFactory.createUserWithWallet({
          walletOverrides: { balance: 200 },
        });
      const { user: toUser, wallet: toWallet } =
        TestDataFactory.createUserWithWallet();
      const transferAmount = 50;
      const idempotencyKey = TestDataFactory.generateIdempotencyKey();

      prismaMock.transaction.findUnique.mockResolvedValue(null);
      prismaMock.$transaction.mockImplementation(async (callback: any) => {
        prismaMock.wallet.findUnique
          .mockResolvedValueOnce(fromWallet)
          .mockResolvedValueOnce(toWallet);
        prismaMock.transaction.create.mockResolvedValue(
          TestDataFactory.createTransaction({
            userId: fromUser.id,
            walletId: fromWallet.id,
            type: 'transfer',
            amount: -transferAmount,
          })
        );
        prismaMock.wallet.update.mockResolvedValue(fromWallet);
        prismaMock.ledgerEntry.createMany.mockResolvedValue({ count: 2 });
        return callback(prismaMock);
      });

      // Act
      const result = await WalletService.transfer({
        fromWalletId: fromWallet.id,
        fromUserId: fromUser.id,
        toUserId: toUser.id,
        amount: transferAmount,
        currency: 'USD',
        idempotencyKey,
      });

      // Assert
      expect(result).toBeDefined();
      expect(result.type).toBe('transfer');
      expect(result.amount).toBe(-transferAmount);
    });

    it('TC-WALLET-013: Debe rechazar transferencia con saldo insuficiente', async () => {
      // Arrange
      const { user: fromUser, wallet: fromWallet } =
        TestDataFactory.createUserWithWallet({
          walletOverrides: { balance: 10 },
        });
      const { user: toUser, wallet: toWallet } =
        TestDataFactory.createUserWithWallet();
      const transferAmount = 50;
      const idempotencyKey = TestDataFactory.generateIdempotencyKey();

      prismaMock.transaction.findUnique.mockResolvedValue(null);
      prismaMock.$transaction.mockImplementation(async (callback: any) => {
        prismaMock.wallet.findUnique
          .mockResolvedValueOnce(fromWallet)
          .mockResolvedValueOnce(toWallet);
        return callback(prismaMock);
      });

      // Act & Assert
      await expect(
        WalletService.transfer({
          fromWalletId: fromWallet.id,
          fromUserId: fromUser.id,
          toUserId: toUser.id,
          amount: transferAmount,
          currency: 'USD',
          idempotencyKey,
        })
      ).rejects.toThrow(InsufficientBalanceError);
    });

    it('TC-WALLET-014: Debe crear transacciones de envío y recepción', async () => {
      // Arrange
      const { user: fromUser, wallet: fromWallet } =
        TestDataFactory.createUserWithWallet({
          walletOverrides: { balance: 200 },
        });
      const { user: toUser, wallet: toWallet } =
        TestDataFactory.createUserWithWallet();
      const transferAmount = 50;
      const idempotencyKey = TestDataFactory.generateIdempotencyKey();

      const transactionCreateSpy = jest.fn();
      prismaMock.transaction.findUnique.mockResolvedValue(null);
      prismaMock.$transaction.mockImplementation(async (callback: any) => {
        prismaMock.wallet.findUnique
          .mockResolvedValueOnce(fromWallet)
          .mockResolvedValueOnce(toWallet);
        prismaMock.transaction.create.mockImplementation(transactionCreateSpy);
        prismaMock.wallet.update.mockResolvedValue(fromWallet);
        prismaMock.ledgerEntry.createMany.mockResolvedValue({ count: 2 });
        return callback(prismaMock);
      });

      // Act
      await WalletService.transfer({
        fromWalletId: fromWallet.id,
        fromUserId: fromUser.id,
        toUserId: toUser.id,
        amount: transferAmount,
        currency: 'USD',
        idempotencyKey,
      });

      // Assert
      expect(transactionCreateSpy).toHaveBeenCalledTimes(2); // Send + Receive
    });
  });

  describe('getBalance', () => {
    it('TC-WALLET-015: Debe obtener el balance correctamente', async () => {
      // Arrange
      const wallet = TestDataFactory.createWallet({ balance: 150.75 });
      prismaMock.wallet.findUnique.mockResolvedValue(wallet);

      // Act
      const result = await WalletService.getBalance(wallet.id);

      // Assert
      expect(result.balance).toBe(150.75);
      expect(result.currency).toBe('USD');
      expect(result.status).toBe('active');
    });

    it('TC-WALLET-016: Debe lanzar error si wallet no existe', async () => {
      // Arrange
      prismaMock.wallet.findUnique.mockResolvedValue(null);

      // Act & Assert
      await expect(
        WalletService.getBalance('non-existent-wallet')
      ).rejects.toThrow(NotFoundError);
    });
  });

  describe('suspendWallet', () => {
    it('TC-WALLET-017: Debe suspender una wallet correctamente', async () => {
      // Arrange
      const wallet = TestDataFactory.createWallet({ status: 'active' });
      const userId = TestDataFactory.createUser().id;

      prismaMock.wallet.findUnique.mockResolvedValue(wallet);
      prismaMock.wallet.update.mockResolvedValue({
        ...wallet,
        status: 'suspended',
      });

      // Act
      const result = await WalletService.suspendWallet(
        wallet.id,
        userId,
        'Suspicious activity'
      );

      // Assert
      expect(result.status).toBe('suspended');
      expect(prismaMock.wallet.update).toHaveBeenCalledWith({
        where: { id: wallet.id },
        data: { status: 'suspended' },
      });
    });
  });

  describe('activateWallet', () => {
    it('TC-WALLET-018: Debe activar una wallet suspendida', async () => {
      // Arrange
      const wallet = TestDataFactory.createWallet({ status: 'suspended' });
      const userId = TestDataFactory.createUser().id;

      prismaMock.wallet.findUnique.mockResolvedValue(wallet);
      prismaMock.wallet.update.mockResolvedValue({
        ...wallet,
        status: 'active',
      });

      // Act
      const result = await WalletService.activateWallet(wallet.id, userId);

      // Assert
      expect(result.status).toBe('active');
      expect(prismaMock.wallet.update).toHaveBeenCalledWith({
        where: { id: wallet.id },
        data: { status: 'active' },
      });
    });
  });
});
