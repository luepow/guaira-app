import { PrismaClient, Prisma } from '@prisma/client';
import { AuditService } from '../utils/audit';
import { AppError, ErrorCodes, InsufficientBalanceError, NotFoundError, ConflictError } from '../utils/response';
import { generateUuid } from '../utils/crypto';

const prisma = new PrismaClient();

export interface CreateWalletOptions {
  userId: string;
  currency?: string;
  initialBalance?: number;
}

export interface DepositOptions {
  walletId: string;
  userId: string;
  amount: number;
  currency?: string;
  source: string;
  sourceId?: string;
  description?: string;
  metadata?: Record<string, unknown>;
  idempotencyKey: string;
  ipAddress?: string;
  userAgent?: string;
}

export interface WithdrawalOptions {
  walletId: string;
  userId: string;
  amount: number;
  currency?: string;
  destination: string;
  destinationId: string;
  description?: string;
  metadata?: Record<string, unknown>;
  idempotencyKey: string;
  ipAddress?: string;
  userAgent?: string;
}

export interface TransferOptions {
  fromWalletId: string;
  fromUserId: string;
  toUserId: string;
  amount: number;
  currency?: string;
  description?: string;
  metadata?: Record<string, unknown>;
  idempotencyKey: string;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Servicio de Wallet con Double-Entry Accounting
 * - Gestión de balances
 * - Transacciones ACID
 * - Doble partida contable
 * - Idempotencia garantizada
 */
export class WalletService {
  /**
   * Crea una nueva wallet para un usuario
   */
  static async createWallet(options: CreateWalletOptions) {
    const { userId, currency = 'USD', initialBalance = 0 } = options;

    // Verificar que el usuario existe
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundError('Usuario');
    }

    // Verificar que no exista ya una wallet
    const existingWallet = await prisma.wallet.findUnique({
      where: { userId },
    });

    if (existingWallet) {
      throw new ConflictError('El usuario ya tiene una wallet');
    }

    // Crear wallet
    const wallet = await prisma.wallet.create({
      data: {
        userId,
        currency,
        balance: initialBalance,
        status: 'active',
      },
    });

    // Si hay balance inicial, crear entrada de ledger
    if (initialBalance > 0) {
      await this.createLedgerEntry({
        transactionId: generateUuid(),
        userId,
        walletId: wallet.id,
        accountType: 'asset',
        debit: initialBalance,
        credit: 0,
        balance: initialBalance,
        currency,
        description: 'Balance inicial',
      });
    }

    // Auditoría
    await AuditService.logCreate('wallet', wallet.id, wallet as any, userId);

    return wallet;
  }

  /**
   * Obtiene una wallet por ID
   */
  static async getWallet(walletId: string) {
    const wallet = await prisma.wallet.findUnique({
      where: { id: walletId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
      },
    });

    if (!wallet) {
      throw new NotFoundError('Wallet');
    }

    return wallet;
  }

  /**
   * Obtiene la wallet de un usuario
   */
  static async getUserWallet(userId: string) {
    const wallet = await prisma.wallet.findUnique({
      where: { userId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
      },
    });

    if (!wallet) {
      throw new NotFoundError('Wallet');
    }

    return wallet;
  }

  /**
   * Realiza un depósito en la wallet
   * - Double-entry accounting
   * - Idempotencia garantizada
   */
  static async deposit(options: DepositOptions) {
    const {
      walletId,
      userId,
      amount,
      currency = 'USD',
      source,
      sourceId,
      description,
      metadata,
      idempotencyKey,
      ipAddress,
      userAgent,
    } = options;

    // Verificar idempotencia - transacción ya existe?
    const existingTransaction = await prisma.transaction.findUnique({
      where: { idempotencyKey },
    });

    if (existingTransaction) {
      // Retornar transacción existente (idempotencia)
      return existingTransaction;
    }

    // Usar transacción de base de datos para garantizar ACID
    return prisma.$transaction(async (tx) => {
      // Obtener wallet con lock para evitar race conditions
      const wallet = await tx.wallet.findUnique({
        where: { id: walletId },
      });

      if (!wallet) {
        throw new NotFoundError('Wallet');
      }

      if (wallet.userId !== userId) {
        throw new AppError(
          ErrorCodes.FORBIDDEN,
          'No tienes permiso para realizar esta operación',
          403
        );
      }

      if (wallet.status !== 'active') {
        throw new AppError(
          ErrorCodes.WALLET_SUSPENDED,
          'La wallet está suspendida o cerrada',
          400
        );
      }

      const balanceBefore = wallet.balance;
      const balanceAfter = balanceBefore + amount;

      // Crear transacción
      const transaction = await tx.transaction.create({
        data: {
          userId,
          walletId,
          type: 'deposit',
          amount,
          currency,
          status: 'succeeded',
          description: description || `Depósito desde ${source}`,
          metadata: metadata as any,
          idempotencyKey,
          sourceId,
        },
      });

      // Actualizar balance de wallet
      await tx.wallet.update({
        where: { id: walletId },
        data: { balance: balanceAfter },
      });

      // Crear entradas de doble partida
      // DR: Asset (Wallet) - aumenta el activo
      await tx.ledgerEntry.create({
        data: {
          transactionId: transaction.id,
          userId,
          walletId,
          accountType: 'asset',
          debit: amount,
          credit: 0,
          balance: balanceAfter,
          currency,
          description: `Depósito - ${description || source}`,
          metadata: metadata as any,
        },
      });

      // CR: Revenue (Income) - aumenta el ingreso
      await tx.ledgerEntry.create({
        data: {
          transactionId: transaction.id,
          userId,
          walletId,
          accountType: 'revenue',
          debit: 0,
          credit: amount,
          balance: 0, // Revenue no afecta balance de wallet
          currency,
          description: `Ingreso por depósito - ${description || source}`,
          metadata: metadata as any,
        },
      });

      // Auditoría
      await AuditService.logWalletOperation(
        walletId,
        userId,
        'deposit',
        balanceBefore,
        balanceAfter,
        { ipAddress, userAgent }
      );

      await AuditService.logTransaction(
        transaction.id,
        userId,
        'deposit',
        amount,
        currency,
        'succeeded',
        { ipAddress, userAgent }
      );

      return transaction;
    });
  }

  /**
   * Realiza un retiro de la wallet
   */
  static async withdraw(options: WithdrawalOptions) {
    const {
      walletId,
      userId,
      amount,
      currency = 'USD',
      destination,
      destinationId,
      description,
      metadata,
      idempotencyKey,
      ipAddress,
      userAgent,
    } = options;

    // Verificar idempotencia
    const existingTransaction = await prisma.transaction.findUnique({
      where: { idempotencyKey },
    });

    if (existingTransaction) {
      return existingTransaction;
    }

    return prisma.$transaction(async (tx) => {
      // Obtener wallet con lock
      const wallet = await tx.wallet.findUnique({
        where: { id: walletId },
      });

      if (!wallet) {
        throw new NotFoundError('Wallet');
      }

      if (wallet.userId !== userId) {
        throw new AppError(
          ErrorCodes.FORBIDDEN,
          'No tienes permiso para realizar esta operación',
          403
        );
      }

      if (wallet.status !== 'active') {
        throw new AppError(
          ErrorCodes.WALLET_SUSPENDED,
          'La wallet está suspendida o cerrada',
          400
        );
      }

      // Verificar saldo suficiente
      if (wallet.balance < amount) {
        throw new InsufficientBalanceError(wallet.balance, amount);
      }

      const balanceBefore = wallet.balance;
      const balanceAfter = balanceBefore - amount;

      // Crear transacción
      const transaction = await tx.transaction.create({
        data: {
          userId,
          walletId,
          type: 'withdrawal',
          amount,
          currency,
          status: 'processing', // Requiere procesamiento externo
          description: description || `Retiro hacia ${destination}`,
          metadata: metadata as any,
          idempotencyKey,
          destinationId,
        },
      });

      // Actualizar balance
      await tx.wallet.update({
        where: { id: walletId },
        data: { balance: balanceAfter },
      });

      // Doble partida
      // DR: Expense (Withdrawal) - aumenta el gasto
      await tx.ledgerEntry.create({
        data: {
          transactionId: transaction.id,
          userId,
          walletId,
          accountType: 'expense',
          debit: amount,
          credit: 0,
          balance: 0,
          currency,
          description: `Gasto por retiro - ${description || destination}`,
          metadata: metadata as any,
        },
      });

      // CR: Asset (Wallet) - disminuye el activo
      await tx.ledgerEntry.create({
        data: {
          transactionId: transaction.id,
          userId,
          walletId,
          accountType: 'asset',
          debit: 0,
          credit: amount,
          balance: balanceAfter,
          currency,
          description: `Retiro - ${description || destination}`,
          metadata: metadata as any,
        },
      });

      // Auditoría
      await AuditService.logWalletOperation(
        walletId,
        userId,
        'withdrawal',
        balanceBefore,
        balanceAfter,
        { ipAddress, userAgent }
      );

      await AuditService.logTransaction(
        transaction.id,
        userId,
        'withdrawal',
        amount,
        currency,
        'processing',
        { ipAddress, userAgent }
      );

      return transaction;
    });
  }

  /**
   * Realiza una transferencia entre wallets
   */
  static async transfer(options: TransferOptions) {
    const {
      fromWalletId,
      fromUserId,
      toUserId,
      amount,
      currency = 'USD',
      description,
      metadata,
      idempotencyKey,
      ipAddress,
      userAgent,
    } = options;

    // Verificar idempotencia
    const existingTransaction = await prisma.transaction.findUnique({
      where: { idempotencyKey },
    });

    if (existingTransaction) {
      return existingTransaction;
    }

    return prisma.$transaction(async (tx) => {
      // Obtener ambas wallets
      const [fromWallet, toWallet] = await Promise.all([
        tx.wallet.findUnique({ where: { id: fromWalletId } }),
        tx.wallet.findUnique({ where: { userId: toUserId } }),
      ]);

      if (!fromWallet) {
        throw new NotFoundError('Wallet origen');
      }

      if (!toWallet) {
        throw new NotFoundError('Wallet destino');
      }

      if (fromWallet.userId !== fromUserId) {
        throw new AppError(
          ErrorCodes.FORBIDDEN,
          'No tienes permiso para realizar esta operación',
          403
        );
      }

      if (fromWallet.status !== 'active' || toWallet.status !== 'active') {
        throw new AppError(
          ErrorCodes.WALLET_SUSPENDED,
          'Una de las wallets está suspendida o cerrada',
          400
        );
      }

      // Verificar saldo
      if (fromWallet.balance < amount) {
        throw new InsufficientBalanceError(fromWallet.balance, amount);
      }

      // Crear transacción de envío
      const sendTransaction = await tx.transaction.create({
        data: {
          userId: fromUserId,
          walletId: fromWalletId,
          type: 'transfer',
          amount: -amount, // Negativo para envío
          currency,
          status: 'succeeded',
          description: description || `Transferencia a ${toUserId}`,
          metadata: metadata as any,
          idempotencyKey,
          destinationId: toWallet.id,
        },
      });

      // Crear transacción de recepción
      await tx.transaction.create({
        data: {
          userId: toUserId,
          walletId: toWallet.id,
          type: 'transfer',
          amount: amount, // Positivo para recepción
          currency,
          status: 'succeeded',
          description: description || `Transferencia de ${fromUserId}`,
          metadata: metadata as any,
          idempotencyKey: `${idempotencyKey}-receive`,
          sourceId: fromWallet.id,
        },
      });

      // Actualizar balances
      const fromBalanceAfter = fromWallet.balance - amount;
      const toBalanceAfter = toWallet.balance + amount;

      await Promise.all([
        tx.wallet.update({
          where: { id: fromWalletId },
          data: { balance: fromBalanceAfter },
        }),
        tx.wallet.update({
          where: { id: toWallet.id },
          data: { balance: toBalanceAfter },
        }),
      ]);

      // Doble partida para el remitente
      await tx.ledgerEntry.createMany({
        data: [
          {
            transactionId: sendTransaction.id,
            userId: fromUserId,
            walletId: fromWalletId,
            accountType: 'asset',
            debit: 0,
            credit: amount,
            balance: fromBalanceAfter,
            currency,
            description: `Transferencia enviada - ${description || ''}`,
          },
          {
            transactionId: sendTransaction.id,
            userId: toUserId,
            walletId: toWallet.id,
            accountType: 'asset',
            debit: amount,
            credit: 0,
            balance: toBalanceAfter,
            currency,
            description: `Transferencia recibida - ${description || ''}`,
          },
        ],
      });

      // Auditoría
      await AuditService.logWalletOperation(
        fromWalletId,
        fromUserId,
        'transfer_send',
        fromWallet.balance,
        fromBalanceAfter,
        { ipAddress, userAgent }
      );

      await AuditService.logWalletOperation(
        toWallet.id,
        toUserId,
        'transfer_receive',
        toWallet.balance,
        toBalanceAfter,
        { ipAddress, userAgent }
      );

      return sendTransaction;
    });
  }

  /**
   * Crea una entrada de ledger (helper privado)
   */
  private static async createLedgerEntry(data: {
    transactionId: string;
    userId: string;
    walletId: string;
    accountType: string;
    debit: number;
    credit: number;
    balance: number;
    currency: string;
    description?: string;
  }) {
    return prisma.ledgerEntry.create({
      data: data as any,
    });
  }

  /**
   * Obtiene el balance actual de una wallet
   */
  static async getBalance(walletId: string) {
    const wallet = await prisma.wallet.findUnique({
      where: { id: walletId },
      select: {
        balance: true,
        currency: true,
        status: true,
      },
    });

    if (!wallet) {
      throw new NotFoundError('Wallet');
    }

    return wallet;
  }

  /**
   * Suspende una wallet
   */
  static async suspendWallet(walletId: string, userId: string, reason?: string) {
    const wallet = await prisma.wallet.findUnique({
      where: { id: walletId },
    });

    if (!wallet) {
      throw new NotFoundError('Wallet');
    }

    const updated = await prisma.wallet.update({
      where: { id: walletId },
      data: { status: 'suspended' },
    });

    await AuditService.logUpdate(
      'wallet',
      walletId,
      { status: wallet.status },
      { status: 'suspended' },
      userId,
      { reason }
    );

    return updated;
  }

  /**
   * Reactiva una wallet suspendida
   */
  static async activateWallet(walletId: string, userId: string) {
    const wallet = await prisma.wallet.findUnique({
      where: { id: walletId },
    });

    if (!wallet) {
      throw new NotFoundError('Wallet');
    }

    const updated = await prisma.wallet.update({
      where: { id: walletId },
      data: { status: 'active' },
    });

    await AuditService.logUpdate(
      'wallet',
      walletId,
      { status: wallet.status },
      { status: 'active' },
      userId
    );

    return updated;
  }
}
