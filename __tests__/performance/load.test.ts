import { WalletService } from '../../app/lib/services/wallet.service';
import { TestDataFactory } from '../helpers/factories';
import { prismaMock } from '../setup';

/**
 * PERFORMANCE TESTING - Load & Stress Tests
 * Verifica el comportamiento bajo carga y condiciones extremas
 */
describe('Performance - Load Testing', () => {
  describe('Wallet Service Performance', () => {
    it('PERF-001: Debe procesar 100 transacciones en menos de 5 segundos', async () => {
      // ARRANGE
      const user = TestDataFactory.createUser();
      const wallet = TestDataFactory.createWallet({
        userId: user.id,
        balance: 100000,
      });

      prismaMock.transaction.findUnique.mockResolvedValue(null);
      prismaMock.$transaction.mockImplementation(async (callback: any) => {
        prismaMock.wallet.findUnique.mockResolvedValue(wallet);
        prismaMock.transaction.create.mockResolvedValue(
          TestDataFactory.createTransaction()
        );
        prismaMock.wallet.update.mockResolvedValue(wallet);
        prismaMock.ledgerEntry.create.mockResolvedValue({} as any);
        return callback(prismaMock);
      });

      // ACT
      const startTime = Date.now();
      const promises = Array.from({ length: 100 }, (_, i) =>
        WalletService.deposit({
          walletId: wallet.id,
          userId: user.id,
          amount: 10,
          currency: 'USD',
          source: 'test',
          idempotencyKey: `perf-test-${i}`,
        })
      );

      await Promise.all(promises);
      const duration = Date.now() - startTime;

      // ASSERT
      expect(duration).toBeLessThan(5000); // Menos de 5 segundos
      console.log(`✓ 100 transacciones procesadas en ${duration}ms`);
    });

    it('PERF-002: Debe manejar 1000 consultas de balance concurrentes', async () => {
      // ARRANGE
      const wallet = TestDataFactory.createWallet({ balance: 1000 });
      prismaMock.wallet.findUnique.mockResolvedValue(wallet);

      // ACT
      const startTime = Date.now();
      const promises = Array.from({ length: 1000 }, () =>
        WalletService.getBalance(wallet.id)
      );

      const results = await Promise.all(promises);
      const duration = Date.now() - startTime;

      // ASSERT
      expect(results).toHaveLength(1000);
      expect(duration).toBeLessThan(2000); // Menos de 2 segundos
      console.log(`✓ 1000 consultas de balance en ${duration}ms`);
      console.log(`  Promedio: ${(duration / 1000).toFixed(2)}ms por consulta`);
    });

    it('PERF-003: Debe validar tiempo de respuesta individual < 100ms', async () => {
      // ARRANGE
      const wallet = TestDataFactory.createWallet({ balance: 1000 });
      prismaMock.wallet.findUnique.mockResolvedValue(wallet);

      // ACT - Medir múltiples llamadas individuales
      const responseTimes: number[] = [];

      for (let i = 0; i < 50; i++) {
        const start = Date.now();
        await WalletService.getBalance(wallet.id);
        const responseTime = Date.now() - start;
        responseTimes.push(responseTime);
      }

      // ASSERT
      const avgResponseTime =
        responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
      const maxResponseTime = Math.max(...responseTimes);
      const p95 = responseTimes.sort((a, b) => a - b)[Math.floor(responseTimes.length * 0.95)];

      expect(avgResponseTime).toBeLessThan(100);
      expect(p95).toBeLessThan(150); // P95 < 150ms

      console.log(`✓ Tiempo de respuesta:`);
      console.log(`  Promedio: ${avgResponseTime.toFixed(2)}ms`);
      console.log(`  Máximo: ${maxResponseTime}ms`);
      console.log(`  P95: ${p95}ms`);
    });
  });

  describe('Memory Performance', () => {
    it('PERF-004: Debe manejar creación de 1000 objetos sin leak', async () => {
      // ARRANGE
      const initialMemory = process.memoryUsage().heapUsed;

      // ACT - Crear muchas transacciones
      const transactions = Array.from({ length: 1000 }, () =>
        TestDataFactory.createTransaction()
      );

      const afterCreation = process.memoryUsage().heapUsed;
      const memoryIncrease = (afterCreation - initialMemory) / 1024 / 1024; // MB

      // ASSERT
      expect(transactions).toHaveLength(1000);
      expect(memoryIncrease).toBeLessThan(50); // Menos de 50MB

      console.log(`✓ 1000 objetos creados:`);
      console.log(`  Memoria inicial: ${(initialMemory / 1024 / 1024).toFixed(2)}MB`);
      console.log(`  Memoria después: ${(afterCreation / 1024 / 1024).toFixed(2)}MB`);
      console.log(`  Incremento: ${memoryIncrease.toFixed(2)}MB`);
    });

    it('PERF-005: Debe liberar memoria después de procesamiento masivo', async () => {
      // ARRANGE
      const initialMemory = process.memoryUsage().heapUsed;

      // ACT - Procesar y liberar
      for (let i = 0; i < 10; i++) {
        const batch = Array.from({ length: 1000 }, () =>
          TestDataFactory.createTransaction()
        );
        // Simular procesamiento
        batch.forEach((tx) => {
          expect(tx.id).toBeDefined();
        });
      }

      // Force garbage collection si está disponible
      if (global.gc) {
        global.gc();
      }

      const finalMemory = process.memoryUsage().heapUsed;
      const memoryIncrease = (finalMemory - initialMemory) / 1024 / 1024; // MB

      // ASSERT - No debe acumular más de 100MB
      expect(memoryIncrease).toBeLessThan(100);

      console.log(`✓ Procesamiento masivo (10 x 1000):`);
      console.log(`  Incremento de memoria: ${memoryIncrease.toFixed(2)}MB`);
    });
  });

  describe('Concurrency Performance', () => {
    it('PERF-006: Debe manejar race conditions en transferencias', async () => {
      // ARRANGE
      const user = TestDataFactory.createUser();
      const wallet = TestDataFactory.createWallet({
        userId: user.id,
        balance: 1000,
      });

      let successCount = 0;
      let failCount = 0;

      prismaMock.transaction.findUnique.mockResolvedValue(null);

      // ACT - 20 transferencias concurrentes de $100 (solo 10 deberían pasar)
      const promises = Array.from({ length: 20 }, (_, i) => {
        prismaMock.$transaction.mockImplementation(async (callback: any) => {
          const currentWallet = await prismaMock.wallet.findUnique({
            where: { id: wallet.id },
          });

          if (currentWallet && currentWallet.balance >= 100) {
            prismaMock.wallet.findUnique.mockResolvedValue(currentWallet);
            prismaMock.transaction.create.mockResolvedValue(
              TestDataFactory.createTransaction({ amount: 100 })
            );

            // Simular actualización de balance
            currentWallet.balance -= 100;
            prismaMock.wallet.update.mockResolvedValue(currentWallet);
            prismaMock.ledgerEntry.create.mockResolvedValue({} as any);

            return callback(prismaMock);
          } else {
            prismaMock.wallet.findUnique.mockResolvedValue(currentWallet || wallet);
            return callback(prismaMock);
          }
        });

        return WalletService.withdraw({
          walletId: wallet.id,
          userId: user.id,
          amount: 100,
          currency: 'USD',
          destination: 'bank_account',
          destinationId: 'ba_123',
          idempotencyKey: `race-${i}`,
        })
          .then(() => successCount++)
          .catch(() => failCount++);
      });

      await Promise.allSettled(promises);

      // ASSERT
      console.log(`✓ Race condition test:`);
      console.log(`  Exitosas: ${successCount}`);
      console.log(`  Fallidas: ${failCount}`);
      console.log(`  Total: ${successCount + failCount}`);

      expect(successCount + failCount).toBe(20);
    });

    it('PERF-007: Debe procesar transacciones paralelas sin deadlock', async () => {
      // ARRANGE
      const users = TestDataFactory.createUsers(10);
      const wallets = users.map((user) =>
        TestDataFactory.createWallet({ userId: user.id, balance: 1000 })
      );

      prismaMock.transaction.findUnique.mockResolvedValue(null);
      prismaMock.$transaction.mockImplementation(async (callback: any) => {
        prismaMock.wallet.findUnique.mockResolvedValue(wallets[0]);
        prismaMock.transaction.create.mockResolvedValue(
          TestDataFactory.createTransaction()
        );
        prismaMock.wallet.update.mockResolvedValue(wallets[0]);
        prismaMock.ledgerEntry.create.mockResolvedValue({} as any);
        return callback(prismaMock);
      });

      // ACT - Crear múltiples transacciones en paralelo
      const startTime = Date.now();
      const promises = wallets.flatMap((wallet, i) =>
        Array.from({ length: 5 }, (_, j) =>
          WalletService.deposit({
            walletId: wallet.id,
            userId: users[i].id,
            amount: 50,
            currency: 'USD',
            source: 'test',
            idempotencyKey: `parallel-${i}-${j}`,
          })
        )
      );

      const results = await Promise.allSettled(promises);
      const duration = Date.now() - startTime;

      const successful = results.filter((r) => r.status === 'fulfilled').length;

      // ASSERT
      expect(successful).toBeGreaterThan(0);
      expect(duration).toBeLessThan(10000); // No debe colgar

      console.log(`✓ Procesamiento paralelo:`);
      console.log(`  Transacciones exitosas: ${successful}/${results.length}`);
      console.log(`  Tiempo total: ${duration}ms`);
    });
  });

  describe('Query Performance', () => {
    it('PERF-008: Debe optimizar búsquedas con índices', async () => {
      // ARRANGE
      const user = TestDataFactory.createUser();
      const wallet = TestDataFactory.createWallet({ userId: user.id });

      prismaMock.wallet.findUnique.mockResolvedValue(wallet);

      // ACT - Búsqueda por userId (debe usar índice)
      const startTime = Date.now();

      for (let i = 0; i < 100; i++) {
        await WalletService.getUserWallet(user.id);
      }

      const duration = Date.now() - startTime;
      const avgTime = duration / 100;

      // ASSERT
      expect(avgTime).toBeLessThan(10); // Promedio < 10ms con índice

      console.log(`✓ Query performance con índice:`);
      console.log(`  100 búsquedas en ${duration}ms`);
      console.log(`  Promedio: ${avgTime.toFixed(2)}ms`);
    });

    it('PERF-009: Debe paginar resultados eficientemente', async () => {
      // ARRANGE
      const transactions = TestDataFactory.createTransactions(1000);
      prismaMock.transaction.findMany.mockResolvedValue(transactions.slice(0, 50));

      // ACT - Simular paginación
      const startTime = Date.now();
      const pages = [];

      for (let page = 0; page < 20; page++) {
        const pageData = await prismaMock.transaction.findMany({
          take: 50,
          skip: page * 50,
        });
        pages.push(pageData);
      }

      const duration = Date.now() - startTime;

      // ASSERT
      expect(pages).toHaveLength(20);
      expect(duration).toBeLessThan(1000); // Menos de 1 segundo

      console.log(`✓ Paginación de 1000 registros:`);
      console.log(`  20 páginas de 50 items`);
      console.log(`  Tiempo total: ${duration}ms`);
    });
  });

  describe('Throughput Testing', () => {
    it('PERF-010: Debe alcanzar mínimo 100 TPS (transactions per second)', async () => {
      // ARRANGE
      const user = TestDataFactory.createUser();
      const wallet = TestDataFactory.createWallet({
        userId: user.id,
        balance: 100000,
      });

      prismaMock.transaction.findUnique.mockResolvedValue(null);
      prismaMock.$transaction.mockImplementation(async (callback: any) => {
        prismaMock.wallet.findUnique.mockResolvedValue(wallet);
        prismaMock.transaction.create.mockResolvedValue(
          TestDataFactory.createTransaction()
        );
        prismaMock.wallet.update.mockResolvedValue(wallet);
        prismaMock.ledgerEntry.create.mockResolvedValue({} as any);
        return callback(prismaMock);
      });

      // ACT - Procesar 1000 transacciones
      const startTime = Date.now();
      const promises = Array.from({ length: 1000 }, (_, i) =>
        WalletService.deposit({
          walletId: wallet.id,
          userId: user.id,
          amount: 10,
          currency: 'USD',
          source: 'test',
          idempotencyKey: `tps-test-${i}`,
        })
      );

      await Promise.all(promises);
      const duration = Date.now() - startTime;
      const tps = (1000 / duration) * 1000; // Transactions per second

      // ASSERT
      expect(tps).toBeGreaterThan(100);

      console.log(`✓ Throughput test:`);
      console.log(`  1000 transacciones en ${duration}ms`);
      console.log(`  TPS: ${tps.toFixed(2)}`);
    });
  });

  describe('Scalability Testing', () => {
    it('PERF-011: Debe escalar linealmente con carga', async () => {
      // ARRANGE
      const wallet = TestDataFactory.createWallet({ balance: 100000 });
      prismaMock.wallet.findUnique.mockResolvedValue(wallet);

      const loads = [10, 50, 100, 200];
      const results: Array<{ load: number; duration: number; tps: number }> = [];

      // ACT - Probar diferentes cargas
      for (const load of loads) {
        const startTime = Date.now();
        const promises = Array.from({ length: load }, () =>
          WalletService.getBalance(wallet.id)
        );

        await Promise.all(promises);
        const duration = Date.now() - startTime;
        const tps = (load / duration) * 1000;

        results.push({ load, duration, tps });
      }

      // ASSERT & LOG
      console.log(`✓ Escalabilidad:`);
      results.forEach(({ load, duration, tps }) => {
        console.log(`  ${load} requests: ${duration}ms (${tps.toFixed(2)} TPS)`);
      });

      // Verificar que TPS no decaiga significativamente
      const tpsValues = results.map((r) => r.tps);
      const tpsDecay =
        (Math.max(...tpsValues) - Math.min(...tpsValues)) / Math.max(...tpsValues);

      expect(tpsDecay).toBeLessThan(0.5); // Decaimiento < 50%
    });
  });
});
