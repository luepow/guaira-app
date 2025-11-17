import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface AuditLogData {
  userId?: string;
  action: string;
  resource: string;
  resourceId?: string;
  changes?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Servicio de auditoría inmutable
 * - Registra todas las operaciones críticas
 * - No permite modificación o eliminación de logs
 * - Útil para compliance y debugging
 */
export class AuditService {
  /**
   * Registra una acción en el log de auditoría
   */
  static async log(data: AuditLogData): Promise<void> {
    try {
      await prisma.auditLog.create({
        data: {
          userId: data.userId,
          action: data.action,
          resource: data.resource,
          resourceId: data.resourceId,
          changes: data.changes as any,
          ipAddress: data.ipAddress,
          userAgent: data.userAgent,
          metadata: data.metadata as any,
        },
      });
    } catch (error) {
      // Log error pero no propagar - auditoría no debe romper flujo principal
      console.error('Failed to create audit log:', error);
    }
  }

  /**
   * Registra creación de recurso
   */
  static async logCreate(
    resource: string,
    resourceId: string,
    data: Record<string, unknown>,
    userId?: string,
    metadata?: { ipAddress?: string; userAgent?: string }
  ): Promise<void> {
    await this.log({
      userId,
      action: 'create',
      resource,
      resourceId,
      changes: { created: data },
      ipAddress: metadata?.ipAddress,
      userAgent: metadata?.userAgent,
    });
  }

  /**
   * Registra actualización de recurso
   */
  static async logUpdate(
    resource: string,
    resourceId: string,
    before: Record<string, unknown>,
    after: Record<string, unknown>,
    userId?: string,
    metadata?: { ipAddress?: string; userAgent?: string }
  ): Promise<void> {
    await this.log({
      userId,
      action: 'update',
      resource,
      resourceId,
      changes: { before, after },
      ipAddress: metadata?.ipAddress,
      userAgent: metadata?.userAgent,
    });
  }

  /**
   * Registra eliminación de recurso
   */
  static async logDelete(
    resource: string,
    resourceId: string,
    data: Record<string, unknown>,
    userId?: string,
    metadata?: { ipAddress?: string; userAgent?: string }
  ): Promise<void> {
    await this.log({
      userId,
      action: 'delete',
      resource,
      resourceId,
      changes: { deleted: data },
      ipAddress: metadata?.ipAddress,
      userAgent: metadata?.userAgent,
    });
  }

  /**
   * Registra login exitoso
   */
  static async logLogin(
    userId: string,
    metadata?: { ipAddress?: string; userAgent?: string; method?: string }
  ): Promise<void> {
    await this.log({
      userId,
      action: 'login',
      resource: 'user',
      resourceId: userId,
      metadata: {
        method: metadata?.method || 'password',
        timestamp: new Date().toISOString(),
      },
      ipAddress: metadata?.ipAddress,
      userAgent: metadata?.userAgent,
    });
  }

  /**
   * Registra logout
   */
  static async logLogout(
    userId: string,
    metadata?: { ipAddress?: string; userAgent?: string }
  ): Promise<void> {
    await this.log({
      userId,
      action: 'logout',
      resource: 'user',
      resourceId: userId,
      ipAddress: metadata?.ipAddress,
      userAgent: metadata?.userAgent,
    });
  }

  /**
   * Registra intento de login fallido
   */
  static async logFailedLogin(
    identifier: string,
    reason: string,
    metadata?: { ipAddress?: string; userAgent?: string }
  ): Promise<void> {
    await this.log({
      action: 'failed_login',
      resource: 'user',
      metadata: {
        identifier,
        reason,
        timestamp: new Date().toISOString(),
      },
      ipAddress: metadata?.ipAddress,
      userAgent: metadata?.userAgent,
    });
  }

  /**
   * Registra transacción financiera
   */
  static async logTransaction(
    transactionId: string,
    userId: string,
    type: string,
    amount: number,
    currency: string,
    status: string,
    metadata?: { ipAddress?: string; userAgent?: string }
  ): Promise<void> {
    await this.log({
      userId,
      action: `transaction_${type}`,
      resource: 'transaction',
      resourceId: transactionId,
      changes: {
        type,
        amount,
        currency,
        status,
      },
      ipAddress: metadata?.ipAddress,
      userAgent: metadata?.userAgent,
    });
  }

  /**
   * Registra operación de wallet
   */
  static async logWalletOperation(
    walletId: string,
    userId: string,
    operation: string,
    balanceBefore: number,
    balanceAfter: number,
    metadata?: { ipAddress?: string; userAgent?: string }
  ): Promise<void> {
    await this.log({
      userId,
      action: `wallet_${operation}`,
      resource: 'wallet',
      resourceId: walletId,
      changes: {
        balanceBefore,
        balanceAfter,
        delta: balanceAfter - balanceBefore,
      },
      ipAddress: metadata?.ipAddress,
      userAgent: metadata?.userAgent,
    });
  }

  /**
   * Obtiene logs de auditoría con filtros
   */
  static async getLogs(filters: {
    userId?: string;
    action?: string;
    resource?: string;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
    offset?: number;
  }) {
    return prisma.auditLog.findMany({
      where: {
        ...(filters.userId && { userId: filters.userId }),
        ...(filters.action && { action: filters.action }),
        ...(filters.resource && { resource: filters.resource }),
        ...(filters.startDate || filters.endDate ? {
          createdAt: {
            ...(filters.startDate && { gte: filters.startDate }),
            ...(filters.endDate && { lte: filters.endDate }),
          },
        } : {}),
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: filters.limit || 100,
      skip: filters.offset || 0,
    });
  }
}
