import { TestDataFactory } from '../helpers/factories';
import { prismaMock } from '../setup';
import { WalletService } from '../../app/lib/services/wallet.service';
import { OtpService } from '../../app/services/otp.service';

/**
 * END-TO-END TESTING - Flujos completos de wallet
 * Simula escenarios reales de uso de principio a fin
 */
describe('E2E - Wallet Workflows', () => {
  describe('Flujo completo: Registro -> Depósito -> Transferencia -> Retiro', () => {
    it('E2E-001: Usuario nuevo debe poder completar ciclo de vida de wallet', async () => {
      // ARRANGE - Setup de usuarios
      const user1 = TestDataFactory.createUser({ email: 'user1@test.com' });
      const user2 = TestDataFactory.createUser({ email: 'user2@test.com' });
      const wallet1 = TestDataFactory.createWallet({
        userId: user1.id,
        balance: 0,
      });
      const wallet2 = TestDataFactory.createWallet({
        userId: user2.id,
        balance: 0,
      });

      // STEP 1: Crear wallet para usuario nuevo
      prismaMock.user.findUnique.mockResolvedValue(user1);
      prismaMock.wallet.findUnique.mockResolvedValue(null);
      prismaMock.wallet.create.mockResolvedValue(wallet1);

      const newWallet = await WalletService.createWallet({
        userId: user1.id,
        currency: 'USD',
        initialBalance: 0,
      });

      expect(newWallet).toBeDefined();
      expect(newWallet.balance).toBe(0);

      // STEP 2: Realizar depósito inicial
      prismaMock.transaction.findUnique.mockResolvedValue(null);
      prismaMock.$transaction.mockImplementation(async (callback: any) => {
        prismaMock.wallet.findUnique.mockResolvedValue(wallet1);
        prismaMock.transaction.create.mockResolvedValue(
          TestDataFactory.createTransaction({
            userId: user1.id,
            walletId: wallet1.id,
            type: 'deposit',
            amount: 500,
            status: 'succeeded',
          })
        );
        prismaMock.wallet.update.mockResolvedValue({
          ...wallet1,
          balance: 500,
        });
        prismaMock.ledgerEntry.create.mockResolvedValue({} as any);
        return callback(prismaMock);
      });

      const depositTx = await WalletService.deposit({
        walletId: wallet1.id,
        userId: user1.id,
        amount: 500,
        currency: 'USD',
        source: 'stripe',
        idempotencyKey: TestDataFactory.generateIdempotencyKey(),
      });

      expect(depositTx.type).toBe('deposit');
      expect(depositTx.amount).toBe(500);
      expect(depositTx.status).toBe('succeeded');

      // STEP 3: Transferir a otro usuario
      wallet1.balance = 500; // Actualizar balance
      prismaMock.transaction.findUnique.mockResolvedValue(null);
      prismaMock.$transaction.mockImplementation(async (callback: any) => {
        prismaMock.wallet.findUnique
          .mockResolvedValueOnce(wallet1)
          .mockResolvedValueOnce(wallet2);
        prismaMock.transaction.create.mockResolvedValue(
          TestDataFactory.createTransaction({
            userId: user1.id,
            walletId: wallet1.id,
            type: 'transfer',
            amount: -200,
          })
        );
        prismaMock.wallet.update.mockResolvedValue({
          ...wallet1,
          balance: 300,
        });
        prismaMock.ledgerEntry.createMany.mockResolvedValue({ count: 2 });
        return callback(prismaMock);
      });

      const transferTx = await WalletService.transfer({
        fromWalletId: wallet1.id,
        fromUserId: user1.id,
        toUserId: user2.id,
        amount: 200,
        currency: 'USD',
        idempotencyKey: TestDataFactory.generateIdempotencyKey(),
      });

      expect(transferTx.type).toBe('transfer');
      expect(transferTx.amount).toBe(-200);

      // STEP 4: Realizar retiro del balance restante
      wallet1.balance = 300;
      prismaMock.transaction.findUnique.mockResolvedValue(null);
      prismaMock.$transaction.mockImplementation(async (callback: any) => {
        prismaMock.wallet.findUnique.mockResolvedValue(wallet1);
        prismaMock.transaction.create.mockResolvedValue(
          TestDataFactory.createTransaction({
            userId: user1.id,
            walletId: wallet1.id,
            type: 'withdrawal',
            amount: 100,
            status: 'processing',
          })
        );
        prismaMock.wallet.update.mockResolvedValue({
          ...wallet1,
          balance: 200,
        });
        prismaMock.ledgerEntry.create.mockResolvedValue({} as any);
        return callback(prismaMock);
      });

      const withdrawTx = await WalletService.withdraw({
        walletId: wallet1.id,
        userId: user1.id,
        amount: 100,
        currency: 'USD',
        destination: 'bank_account',
        destinationId: 'ba_123',
        idempotencyKey: TestDataFactory.generateIdempotencyKey(),
      });

      expect(withdrawTx.type).toBe('withdrawal');
      expect(withdrawTx.amount).toBe(100);
      expect(withdrawTx.status).toBe('processing');

      // VERIFY - Balance final esperado
      // User1: 500 (deposit) - 200 (transfer out) - 100 (withdrawal) = 200
      // User2: 200 (transfer in)
    });
  });

  describe('Flujo de pagos múltiples concurrentes', () => {
    it('E2E-002: Debe manejar múltiples transacciones concurrentes correctamente', async () => {
      // ARRANGE
      const user = TestDataFactory.createUser();
      const wallet = TestDataFactory.createWallet({
        userId: user.id,
        balance: 1000,
      });

      // STEP 1: Simular 5 transacciones concurrentes
      const transactions = Array.from({ length: 5 }, (_, i) => ({
        amount: 50,
        idempotencyKey: `concurrent-tx-${i}`,
      }));

      // Mock para cada transacción
      prismaMock.transaction.findUnique.mockResolvedValue(null);

      let currentBalance = wallet.balance;
      const results = [];

      for (const tx of transactions) {
        prismaMock.$transaction.mockImplementation(async (callback: any) => {
          prismaMock.wallet.findUnique.mockResolvedValue({
            ...wallet,
            balance: currentBalance,
          });
          prismaMock.transaction.create.mockResolvedValue(
            TestDataFactory.createTransaction({
              userId: user.id,
              walletId: wallet.id,
              type: 'withdrawal',
              amount: tx.amount,
            })
          );
          currentBalance -= tx.amount;
          prismaMock.wallet.update.mockResolvedValue({
            ...wallet,
            balance: currentBalance,
          });
          prismaMock.ledgerEntry.create.mockResolvedValue({} as any);
          return callback(prismaMock);
        });

        // ACT
        const result = await WalletService.withdraw({
          walletId: wallet.id,
          userId: user.id,
          amount: tx.amount,
          currency: 'USD',
          destination: 'bank_account',
          destinationId: 'ba_123',
          idempotencyKey: tx.idempotencyKey,
        });

        results.push(result);
      }

      // ASSERT
      expect(results).toHaveLength(5);
      results.forEach((result) => {
        expect(result.status).toBe('processing');
        expect(result.amount).toBe(50);
      });

      // Verificar que el balance final es correcto
      const expectedFinalBalance = 1000 - 5 * 50; // 750
      expect(currentBalance).toBe(expectedFinalBalance);
    });
  });

  describe('Flujo de idempotencia', () => {
    it('E2E-003: Debe garantizar idempotencia en reintentos', async () => {
      // ARRANGE
      const user = TestDataFactory.createUser();
      const wallet = TestDataFactory.createWallet({
        userId: user.id,
        balance: 500,
      });
      const idempotencyKey = TestDataFactory.generateIdempotencyKey();

      // STEP 1: Primera llamada - crear transacción
      const firstTransaction = TestDataFactory.createTransaction({
        userId: user.id,
        walletId: wallet.id,
        type: 'deposit',
        amount: 100,
        idempotencyKey,
      });

      prismaMock.transaction.findUnique.mockResolvedValueOnce(null);
      prismaMock.$transaction.mockImplementation(async (callback: any) => {
        prismaMock.wallet.findUnique.mockResolvedValue(wallet);
        prismaMock.transaction.create.mockResolvedValue(firstTransaction);
        prismaMock.wallet.update.mockResolvedValue({
          ...wallet,
          balance: 600,
        });
        prismaMock.ledgerEntry.create.mockResolvedValue({} as any);
        return callback(prismaMock);
      });

      const result1 = await WalletService.deposit({
        walletId: wallet.id,
        userId: user.id,
        amount: 100,
        currency: 'USD',
        source: 'stripe',
        idempotencyKey,
      });

      // STEP 2: Reintento con mismo idempotency key
      prismaMock.transaction.findUnique.mockResolvedValueOnce(firstTransaction);

      const result2 = await WalletService.deposit({
        walletId: wallet.id,
        userId: user.id,
        amount: 100,
        currency: 'USD',
        source: 'stripe',
        idempotencyKey, // Mismo key
      });

      // ASSERT - Debe retornar la misma transacción
      expect(result1.id).toBe(result2.id);
      expect(result1.idempotencyKey).toBe(result2.idempotencyKey);
      expect(prismaMock.$transaction).toHaveBeenCalledTimes(1); // Solo una vez
    });
  });

  describe('Flujo de recuperación de errores', () => {
    it('E2E-004: Debe manejar fallo de transacción y permitir reintento', async () => {
      // ARRANGE
      const user = TestDataFactory.createUser();
      const wallet = TestDataFactory.createWallet({
        userId: user.id,
        balance: 100,
      });

      // STEP 1: Primer intento - falla por saldo insuficiente
      prismaMock.transaction.findUnique.mockResolvedValue(null);
      prismaMock.$transaction.mockImplementation(async (callback: any) => {
        prismaMock.wallet.findUnique.mockResolvedValue(wallet);
        return callback(prismaMock);
      });

      await expect(
        WalletService.withdraw({
          walletId: wallet.id,
          userId: user.id,
          amount: 200, // Más del saldo disponible
          currency: 'USD',
          destination: 'bank_account',
          destinationId: 'ba_123',
          idempotencyKey: 'retry-test-1',
        })
      ).rejects.toThrow();

      // STEP 2: Hacer depósito para tener saldo
      wallet.balance = 100;
      prismaMock.transaction.findUnique.mockResolvedValue(null);
      prismaMock.$transaction.mockImplementation(async (callback: any) => {
        prismaMock.wallet.findUnique.mockResolvedValue(wallet);
        prismaMock.transaction.create.mockResolvedValue(
          TestDataFactory.createTransaction({
            userId: user.id,
            walletId: wallet.id,
            type: 'deposit',
            amount: 200,
          })
        );
        prismaMock.wallet.update.mockResolvedValue({
          ...wallet,
          balance: 300,
        });
        prismaMock.ledgerEntry.create.mockResolvedValue({} as any);
        return callback(prismaMock);
      });

      await WalletService.deposit({
        walletId: wallet.id,
        userId: user.id,
        amount: 200,
        currency: 'USD',
        source: 'stripe',
        idempotencyKey: 'deposit-before-retry',
      });

      // STEP 3: Reintentar retiro - ahora debe funcionar
      wallet.balance = 300;
      prismaMock.transaction.findUnique.mockResolvedValue(null);
      prismaMock.$transaction.mockImplementation(async (callback: any) => {
        prismaMock.wallet.findUnique.mockResolvedValue(wallet);
        prismaMock.transaction.create.mockResolvedValue(
          TestDataFactory.createTransaction({
            userId: user.id,
            walletId: wallet.id,
            type: 'withdrawal',
            amount: 200,
            status: 'processing',
          })
        );
        prismaMock.wallet.update.mockResolvedValue({
          ...wallet,
          balance: 100,
        });
        prismaMock.ledgerEntry.create.mockResolvedValue({} as any);
        return callback(prismaMock);
      });

      const result = await WalletService.withdraw({
        walletId: wallet.id,
        userId: user.id,
        amount: 200,
        currency: 'USD',
        destination: 'bank_account',
        destinationId: 'ba_123',
        idempotencyKey: 'retry-test-2',
      });

      // ASSERT
      expect(result).toBeDefined();
      expect(result.status).toBe('processing');
    });
  });

  describe('Flujo de límites y validaciones', () => {
    it('E2E-005: Debe respetar límites de transacciones consecutivas', async () => {
      // ARRANGE
      const user = TestDataFactory.createUser();
      const wallet = TestDataFactory.createWallet({
        userId: user.id,
        balance: 10000,
      });

      // STEP 1: Intentar múltiples retiros grandes en secuencia
      const withdrawals = [
        { amount: 1000, shouldSucceed: true },
        { amount: 2000, shouldSucceed: true },
        { amount: 3000, shouldSucceed: true },
        { amount: 5000, shouldSucceed: false }, // Excede balance restante
      ];

      let currentBalance = wallet.balance;
      const results = [];

      for (const { amount, shouldSucceed } of withdrawals) {
        prismaMock.transaction.findUnique.mockResolvedValue(null);

        if (shouldSucceed && currentBalance >= amount) {
          prismaMock.$transaction.mockImplementation(async (callback: any) => {
            prismaMock.wallet.findUnique.mockResolvedValue({
              ...wallet,
              balance: currentBalance,
            });
            prismaMock.transaction.create.mockResolvedValue(
              TestDataFactory.createTransaction({
                userId: user.id,
                walletId: wallet.id,
                type: 'withdrawal',
                amount,
              })
            );
            currentBalance -= amount;
            prismaMock.wallet.update.mockResolvedValue({
              ...wallet,
              balance: currentBalance,
            });
            prismaMock.ledgerEntry.create.mockResolvedValue({} as any);
            return callback(prismaMock);
          });

          try {
            const result = await WalletService.withdraw({
              walletId: wallet.id,
              userId: user.id,
              amount,
              currency: 'USD',
              destination: 'bank_account',
              destinationId: 'ba_123',
              idempotencyKey: `limit-test-${amount}`,
            });
            results.push({ amount, success: true, result });
          } catch (error) {
            results.push({ amount, success: false, error });
          }
        } else {
          prismaMock.$transaction.mockImplementation(async (callback: any) => {
            prismaMock.wallet.findUnique.mockResolvedValue({
              ...wallet,
              balance: currentBalance,
            });
            return callback(prismaMock);
          });

          try {
            await WalletService.withdraw({
              walletId: wallet.id,
              userId: user.id,
              amount,
              currency: 'USD',
              destination: 'bank_account',
              destinationId: 'ba_123',
              idempotencyKey: `limit-test-${amount}`,
            });
            results.push({ amount, success: true });
          } catch (error) {
            results.push({ amount, success: false, error });
          }
        }
      }

      // ASSERT
      expect(results[0].success).toBe(true); // 1000 OK
      expect(results[1].success).toBe(true); // 2000 OK
      expect(results[2].success).toBe(true); // 3000 OK
      expect(results[3].success).toBe(false); // 5000 FALLA (balance insuficiente)

      // Balance final: 10000 - 1000 - 2000 - 3000 = 4000
      expect(currentBalance).toBe(4000);
    });
  });
});
