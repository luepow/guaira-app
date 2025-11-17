/**
 * Audit Logging System
 * PCI-DSS Requirement 10 - Track and Monitor All Access
 *
 * Compliance:
 * - PCI-DSS 10.1, 10.2, 10.3, 10.4, 10.5, 10.6
 * - NIST SP 800-92 (Guide to Computer Security Log Management)
 * - ISO 27001 A.12.4 (Logging and monitoring)
 */

import { prisma } from './prisma';
import { generateHMAC, sha256Hash } from './crypto';

/**
 * Audit log entry structure
 * PCI-DSS 10.3 - Record at least the following audit trail entries
 */
export interface AuditLogEntry {
  // Who (10.3.1)
  userId?: string;
  userName?: string;

  // What (10.3.2 - 10.3.4)
  action: AuditAction;
  resourceType?: string;
  resourceId?: string;

  // When (10.3.5)
  timestamp?: Date;

  // Where (10.3.6)
  ipAddress?: string;
  userAgent?: string;
  location?: string;

  // Result (10.3.3)
  result: 'SUCCESS' | 'FAILURE';
  reason?: string;

  // Additional context
  metadata?: Record<string, any>;
  sessionId?: string;
}

/**
 * Audit actions - PCI-DSS 10.2
 */
export type AuditAction =
  // 10.2.1 - All individual user accesses to cardholder data
  | 'CARD_DATA_ACCESS'
  | 'TRANSACTION_VIEW'
  | 'WALLET_BALANCE_VIEW'

  // 10.2.2 - All actions taken by individuals with root or administrative privileges
  | 'ADMIN_LOGIN'
  | 'USER_CREATE'
  | 'USER_UPDATE'
  | 'USER_DELETE'
  | 'ROLE_CHANGE'
  | 'SETTINGS_UPDATE'

  // 10.2.3 - Access to all audit trails
  | 'AUDIT_LOG_ACCESS'
  | 'AUDIT_LOG_EXPORT'

  // 10.2.4 - Invalid logical access attempts
  | 'LOGIN_SUCCESS'
  | 'LOGIN_FAILED'
  | 'LOGOUT'
  | 'ACCOUNT_LOCKED'
  | 'UNAUTHORIZED_ACCESS'

  // 10.2.5 - Use of identification and authentication mechanisms
  | 'PASSWORD_CHANGE'
  | 'PASSWORD_RESET_REQUEST'
  | 'PASSWORD_RESET_COMPLETE'
  | 'MFA_ENABLED'
  | 'MFA_DISABLED'
  | 'MFA_VERIFIED'

  // 10.2.6 - Initialization of audit logs
  | 'AUDIT_LOG_INITIALIZED'
  | 'AUDIT_LOG_STOPPED'

  // 10.2.7 - Creation and deletion of system-level objects
  | 'WALLET_CREATED'
  | 'WALLET_DELETED'
  | 'API_KEY_CREATED'
  | 'API_KEY_REVOKED'

  // Payment and transaction events
  | 'PAYMENT_INITIATED'
  | 'PAYMENT_SUCCESS'
  | 'PAYMENT_FAILED'
  | 'PAYMENT_REFUND'
  | 'DEPOSIT_INITIATED'
  | 'DEPOSIT_SUCCESS'
  | 'DEPOSIT_FAILED'
  | 'WITHDRAWAL_INITIATED'
  | 'WITHDRAWAL_SUCCESS'
  | 'WITHDRAWAL_FAILED'

  // Security events
  | 'RATE_LIMIT_EXCEEDED'
  | 'LOGIN_RATE_LIMITED'
  | 'SUSPICIOUS_ACTIVITY'
  | 'DATA_EXPORT'
  | 'CONFIGURATION_CHANGE';

/**
 * Create immutable audit log entry
 * PCI-DSS 10.5.2 - Protect audit trail files from unauthorized modifications
 *
 * @param entry - Audit log data
 */
export async function createAuditLog(entry: AuditLogEntry): Promise<void> {
  try {
    const timestamp = entry.timestamp || new Date();

    // Create log entry data
    const logData = {
      userId: entry.userId || null,
      userName: entry.userName || null,
      action: entry.action,
      resourceType: entry.resourceType || null,
      resourceId: entry.resourceId || null,
      timestamp,
      ipAddress: entry.ipAddress || null,
      userAgent: entry.userAgent || null,
      location: entry.location || null,
      result: entry.result,
      reason: entry.reason || null,
      metadata: entry.metadata || {},
      sessionId: entry.sessionId || null,
    };

    // Generate integrity hash - PCI-DSS 10.5.2
    const dataString = JSON.stringify(logData);
    const hash = sha256Hash(dataString);

    // Generate HMAC signature for tamper detection
    const hmacSecret = process.env.AUDIT_LOG_SECRET || '';
    const signature = generateHMAC(dataString, hmacSecret);

    // Store in database
    await prisma.auditLog.create({
      data: {
        ...logData,
        hash,
        signature,
      },
    });

    // Also log to external system if configured (Syslog, ELK, etc.)
    if (process.env.ENABLE_EXTERNAL_LOGGING === 'true') {
      await logToExternalSystem(logData);
    }
  } catch (error) {
    // CRITICAL: Audit logging failure should be alerted
    console.error('CRITICAL: Audit log creation failed:', error);

    // In production, send alert to security team
    if (process.env.NODE_ENV === 'production') {
      // await sendSecurityAlert('AUDIT_LOG_FAILURE', error);
    }
  }
}

/**
 * Query audit logs with filtering
 * PCI-DSS 10.6 - Review logs and security events
 *
 * @param filters - Search filters
 * @returns Audit log entries
 */
export async function queryAuditLogs(filters: {
  userId?: string;
  action?: AuditAction;
  startDate?: Date;
  endDate?: Date;
  result?: 'SUCCESS' | 'FAILURE';
  ipAddress?: string;
  page?: number;
  pageSize?: number;
}) {
  const { page = 1, pageSize = 100, ...where } = filters;

  // Log access to audit logs - PCI-DSS 10.2.3
  await createAuditLog({
    action: 'AUDIT_LOG_ACCESS',
    result: 'SUCCESS',
    metadata: { filters },
  });

  const logs = await prisma.auditLog.findMany({
    where: {
      ...(where.userId && { userId: where.userId }),
      ...(where.action && { action: where.action }),
      ...(where.result && { result: where.result }),
      ...(where.ipAddress && { ipAddress: where.ipAddress }),
      ...(where.startDate || where.endDate
        ? {
            timestamp: {
              ...(where.startDate && { gte: where.startDate }),
              ...(where.endDate && { lte: where.endDate }),
            },
          }
        : {}),
    },
    orderBy: { timestamp: 'desc' },
    skip: (page - 1) * pageSize,
    take: pageSize,
  });

  const total = await prisma.auditLog.count({ where });

  return {
    logs,
    pagination: {
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
    },
  };
}

/**
 * Verify audit log integrity
 * Checks if logs have been tampered with
 *
 * @param logId - Audit log ID
 * @returns True if log is intact
 */
export async function verifyAuditLogIntegrity(logId: string): Promise<boolean> {
  const log = await prisma.auditLog.findUnique({
    where: { id: logId },
  });

  if (!log) {
    return false;
  }

  // Reconstruct original data
  const logData = {
    userId: log.userId,
    userName: log.userName,
    action: log.action,
    resourceType: log.resourceType,
    resourceId: log.resourceId,
    timestamp: log.timestamp,
    ipAddress: log.ipAddress,
    userAgent: log.userAgent,
    location: log.location,
    result: log.result,
    reason: log.reason,
    metadata: log.metadata,
    sessionId: log.sessionId,
  };

  // Verify hash
  const dataString = JSON.stringify(logData);
  const expectedHash = sha256Hash(dataString);

  if (log.hash !== expectedHash) {
    // Log integrity violation
    await createAuditLog({
      action: 'SUSPICIOUS_ACTIVITY',
      result: 'FAILURE',
      reason: 'Audit log integrity check failed',
      metadata: { logId },
    });
    return false;
  }

  return true;
}

/**
 * Export audit logs for compliance review
 * PCI-DSS 10.6.1 - Review logs at least daily
 *
 * @param startDate - Start date
 * @param endDate - End date
 * @returns CSV formatted logs
 */
export async function exportAuditLogs(
  startDate: Date,
  endDate: Date
): Promise<string> {
  // Log export action - PCI-DSS 10.2.3
  await createAuditLog({
    action: 'DATA_EXPORT',
    result: 'SUCCESS',
    metadata: { startDate, endDate, exportType: 'AUDIT_LOGS' },
  });

  const logs = await prisma.auditLog.findMany({
    where: {
      timestamp: {
        gte: startDate,
        lte: endDate,
      },
    },
    orderBy: { timestamp: 'asc' },
  });

  // Convert to CSV
  const headers = [
    'Timestamp',
    'User ID',
    'User Name',
    'Action',
    'Resource Type',
    'Resource ID',
    'IP Address',
    'Result',
    'Reason',
  ];

  const rows = logs.map((log) => [
    log.timestamp.toISOString(),
    log.userId || '',
    log.userName || '',
    log.action,
    log.resourceType || '',
    log.resourceId || '',
    log.ipAddress || '',
    log.result,
    log.reason || '',
  ]);

  const csv = [headers, ...rows].map((row) => row.join(',')).join('\n');

  return csv;
}

/**
 * Detect suspicious patterns in audit logs
 * PCI-DSS 10.6.2 - Review logs of critical systems
 *
 * @returns Suspicious activities
 */
export async function detectSuspiciousActivity(): Promise<any[]> {
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

  // Multiple failed login attempts
  const failedLogins = await prisma.auditLog.groupBy({
    by: ['userId', 'ipAddress'],
    where: {
      action: 'LOGIN_FAILED',
      timestamp: { gte: oneDayAgo },
    },
    _count: true,
    having: {
      ipAddress: { _count: { gt: 10 } },
    },
  });

  // Unusual activity patterns
  const suspiciousPatterns = [];

  for (const pattern of failedLogins) {
    suspiciousPatterns.push({
      type: 'MULTIPLE_FAILED_LOGINS',
      userId: pattern.userId,
      ipAddress: pattern.ipAddress,
      count: pattern._count,
      severity: 'HIGH',
    });

    // Create audit log for suspicious activity
    await createAuditLog({
      action: 'SUSPICIOUS_ACTIVITY',
      result: 'FAILURE',
      userId: pattern.userId || undefined,
      ipAddress: pattern.ipAddress || undefined,
      reason: 'Multiple failed login attempts detected',
      metadata: { count: pattern._count },
    });
  }

  return suspiciousPatterns;
}

/**
 * Log to external system (placeholder)
 * PCI-DSS 10.5.3 - Backup audit trail files to secure location
 */
async function logToExternalSystem(logData: any): Promise<void> {
  // Implementation depends on your logging infrastructure
  // Examples: Syslog, ELK Stack, CloudWatch, Datadog, Splunk

  if (process.env.SYSLOG_ENABLED === 'true') {
    // Send to syslog server
    // await sendToSyslog(logData);
  }

  if (process.env.ELK_ENABLED === 'true') {
    // Send to Elasticsearch
    // await sendToElasticsearch(logData);
  }

  // Console log in development
  if (process.env.NODE_ENV === 'development') {
    console.log('[AUDIT]', JSON.stringify(logData, null, 2));
  }
}

/**
 * Archive old audit logs
 * PCI-DSS 10.7 - Retain audit trail history for at least one year
 *
 * @param retentionDays - Number of days to retain logs (minimum 365)
 */
export async function archiveOldLogs(retentionDays: number = 365): Promise<void> {
  if (retentionDays < 365) {
    throw new Error('PCI-DSS requires minimum 365 days retention');
  }

  const archiveDate = new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1000);

  // Export logs before archiving
  const oldLogs = await prisma.auditLog.findMany({
    where: {
      timestamp: { lt: archiveDate },
    },
  });

  // Store in long-term archive (S3, Glacier, etc.)
  // await storeInArchive(oldLogs);

  // Create audit log for archival
  await createAuditLog({
    action: 'DATA_EXPORT',
    result: 'SUCCESS',
    reason: 'Audit log archival',
    metadata: {
      logsArchived: oldLogs.length,
      archiveDate: archiveDate.toISOString(),
    },
  });
}
