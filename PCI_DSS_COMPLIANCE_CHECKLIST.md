# PCI-DSS COMPLIANCE CHECKLIST - GUAIRA.APP
## Payment Card Industry Data Security Standard

**Version:** PCI-DSS v4.0
**Fecha:** 2025-11-16
**Nivel Aplicable:** SAQ-A (para procesamiento via PSP)
**Responsable:** Chief Systems Architect & Global PMO Director

---

## INDICE

1. [Overview PCI-DSS](#1-overview-pci-dss)
2. [Requisitos Fundamentales](#2-requisitos-fundamentales)
3. [Checklist Detallado](#3-checklist-detallado)
4. [Plan de Implementacion](#4-plan-de-implementacion)
5. [Auditoria y Certificacion](#5-auditoria-y-certificacion)

---

## 1. OVERVIEW PCI-DSS

### 1.1 Que es PCI-DSS

PCI-DSS (Payment Card Industry Data Security Standard) es un conjunto de est andares de seguridad diseñados para garantizar que TODAS las empresas que aceptan, procesan, almacenan o transmiten informacion de tarjetas de credito mantengan un entorno seguro.

### 1.2 Niveles de Comerciantes

| Nivel | Transacciones Anuales | Requisitos |
|-------|----------------------|------------|
| **Nivel 1** | > 6 millones | Auditoria anual obligatoria (QSA) |
| **Nivel 2** | 1-6 millones | SAQ anual + escaneo trimestral |
| **Nivel 3** | 20,000-1 millon | SAQ anual + escaneo trimestral |
| **Nivel 4** | < 20,000 | SAQ anual |

### 1.3 SAQ Aplicable a Guaira.app

**SAQ-A (Self-Assessment Questionnaire A)**

Aplicable para e-commerce que:
- Redirige a PSP externo (Stripe, PayPal)
- NO almacena, procesa ni transmite datos de tarjetas
- NO controla iframe de pago

**Ventajas:**
- Solo 22 requisitos (vs 328 del PCI-DSS completo)
- No requiere auditoria externa (Nivel 2-4)
- Menos costoso de implementar

---

## 2. REQUISITOS FUNDAMENTALES

### 2.1 Los 6 Objetivos de PCI-DSS

```
┌─────────────────────────────────────────────────────────────┐
│             6 OBJETIVOS PRINCIPALES PCI-DSS                 │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  1. BUILD & MAINTAIN SECURE NETWORK                         │
│     ├─ Req 1: Install and maintain firewall                │
│     └─ Req 2: Don't use vendor defaults                    │
│                                                             │
│  2. PROTECT CARDHOLDER DATA                                 │
│     ├─ Req 3: Protect stored cardholder data               │
│     └─ Req 4: Encrypt transmission over public networks    │
│                                                             │
│  3. MAINTAIN VULNERABILITY MANAGEMENT PROGRAM               │
│     ├─ Req 5: Use and update anti-virus                    │
│     └─ Req 6: Develop secure systems and applications      │
│                                                             │
│  4. IMPLEMENT STRONG ACCESS CONTROL MEASURES                │
│     ├─ Req 7: Restrict access by business need-to-know     │
│     ├─ Req 8: Assign unique ID to each person              │
│     └─ Req 9: Restrict physical access                     │
│                                                             │
│  5. REGULARLY MONITOR AND TEST NETWORKS                     │
│     ├─ Req 10: Track and monitor access to data            │
│     └─ Req 11: Test security systems regularly             │
│                                                             │
│  6. MAINTAIN INFORMATION SECURITY POLICY                    │
│     └─ Req 12: Maintain policy that addresses security     │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 3. CHECKLIST DETALLADO

### 3.1 Build and Maintain a Secure Network

#### Requirement 1: Install and Maintain Firewall Configuration

| # | Control | Estado | Prioridad | Notas |
|---|---------|--------|-----------|-------|
| 1.1 | Firewall rules documented | ❌ | P1 | Documentar reglas de AWS Security Groups |
| 1.2 | Firewall between internet and cardholder data | ✅ | - | PSP handles (Stripe/PayPal) |
| 1.3 | Prohibit direct public access to cardholder data | ✅ | - | No almacenamos datos de tarjetas |
| 1.4 | Install personal firewall on mobile/remote devices | ⚠️ | P2 | Politica de dispositivos |

**Acciones:**
```typescript
// next.config.js - Security Headers
module.exports = {
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains',
          },
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: https:",
              "font-src 'self' data:",
              "connect-src 'self' https://api.stripe.com",
              "frame-src https://js.stripe.com https://hooks.stripe.com",
            ].join('; '),
          },
        ],
      },
    ];
  },
};
```

#### Requirement 2: Don't Use Vendor Defaults

| # | Control | Estado | Prioridad | Notas |
|---|---------|--------|-----------|-------|
| 2.1 | Change vendor defaults before deployment | ❌ | P0 | Cambiar secrets de desarrollo |
| 2.2 | Remove/disable unnecessary default accounts | ⚠️ | P1 | Eliminar usuarios demo en produccion |
| 2.3 | Implement additional security features | ⚠️ | P1 | HTTPS, firewall rules |

**Acciones:**
- [ ] Cambiar NEXTAUTH_SECRET a valor seguro aleatorio
- [ ] Eliminar usuarios demo (`+584121234567`) en produccion
- [ ] Cambiar password default de PostgreSQL
- [ ] Deshabilitar cuenta `postgres` default
- [ ] Configurar TLS 1.3 minimo

### 3.2 Protect Cardholder Data

#### Requirement 3: Protect Stored Cardholder Data

| # | Control | Estado | Prioridad | Notas |
|---|---------|--------|-----------|-------|
| 3.1 | Minimize cardholder data storage | ✅ | - | NO almacenamos datos de tarjetas |
| 3.2 | Don't store sensitive authentication data | ✅ | - | PSP handles (tokenization) |
| 3.3 | Mask PAN when displayed | N/A | - | No aplicable |
| 3.4 | Render PAN unreadable | N/A | - | No aplicable |

**Arquitectura Recomendada (Tokenization):**
```
┌────────────────────────────────────────────────────────────┐
│              PAYMENT FLOW CON TOKENIZATION                 │
├────────────────────────────────────────────────────────────┤
│                                                            │
│  User Browser                                              │
│       │                                                    │
│       ├─ 1. Load Checkout Page                            │
│       │                                                    │
│       └─ 2. Stripe.js / PayPal SDK (iframe)               │
│              │                                             │
│              ├─ 3. Enter Card Details                      │
│              │   (never touches our server)               │
│              │                                             │
│              ├─ 4. Tokenize Card                           │
│              │                                             │
│              └─ 5. Return Token (tok_xxxx)                 │
│                     │                                      │
│  Guaira Backend ────┘                                      │
│       │                                                    │
│       ├─ 6. Receive Token + Amount                        │
│       │                                                    │
│       ├─ 7. Create Payment Intent                          │
│       │   POST https://api.stripe.com/v1/payment_intents  │
│       │   {                                                │
│       │     amount: 5000,                                  │
│       │     currency: 'usd',                               │
│       │     payment_method: 'tok_xxxx'  // TOKEN          │
│       │   }                                                │
│       │                                                    │
│       ├─ 8. Store ONLY:                                    │
│       │   - Payment ID (pi_xxxx)                           │
│       │   - Last 4 digits (for display)                    │
│       │   - Card brand (Visa/MC)                           │
│       │   - Amount                                         │
│       │   - Status                                         │
│       │                                                    │
│       └─ 9. Return result to client                        │
│                                                            │
└────────────────────────────────────────────────────────────┘

NUNCA almacenamos:
❌ Numero de tarjeta completo
❌ CVV/CVC
❌ PIN
❌ Magnetic stripe data
```

#### Requirement 4: Encrypt Transmission of Cardholder Data

| # | Control | Estado | Prioridad | Notas |
|---|---------|--------|-----------|-------|
| 4.1 | Use strong cryptography for transmission | ⚠️ | P0 | HTTPS obligatorio en produccion |
| 4.2 | Never send unencrypted PANs | ✅ | - | No manejamos PANs |
| 4.3 | Ensure security policies are maintained | ⚠️ | P1 | Documentar politicas |

**Acciones:**
```typescript
// middleware.ts - Force HTTPS in production

export function middleware(request: NextRequest) {
  // Redirect HTTP to HTTPS in production
  if (
    process.env.NODE_ENV === 'production' &&
    request.headers.get('x-forwarded-proto') !== 'https'
  ) {
    const url = request.nextUrl.clone();
    url.protocol = 'https';
    return NextResponse.redirect(url);
  }

  // ... rest of middleware
}
```

### 3.3 Maintain Vulnerability Management Program

#### Requirement 5: Use and Regularly Update Anti-Virus Software

| # | Control | Estado | Prioridad | Notas |
|---|---------|--------|-----------|-------|
| 5.1 | Deploy anti-virus on all systems | N/A | - | Web app, no aplica |
| 5.2 | Ensure anti-virus is current | N/A | - | Cloud hosting handles |

#### Requirement 6: Develop and Maintain Secure Systems

| # | Control | Estado | Prioridad | Notas |
|---|---------|--------|-----------|-------|
| 6.1 | Establish process to identify vulnerabilities | ❌ | P1 | Implementar Snyk/Dependabot |
| 6.2 | Ensure all system components are patched | ⚠️ | P1 | Actualizar dependencias |
| 6.3 | Develop secure software per industry standards | ❌ | P0 | OWASP Top 10 compliance |
| 6.4 | Follow change control processes | ❌ | P2 | Implementar CI/CD |
| 6.5 | Address common coding vulnerabilities | ❌ | P0 | Ver SECURITY_IMPROVEMENTS_PLAN.md |
| 6.6 | For public-facing apps, perform code review | ❌ | P1 | Auditoria de codigo |

**OWASP Top 10 Compliance:**

```
┌────────────────────────────────────────────────────────────┐
│         OWASP TOP 10 2021 - STATUS GUAIRA.APP              │
├────────────────────────────────────────────────────────────┤
│                                                            │
│  A01 - Broken Access Control                              │
│  Status: ⚠️ PARCIAL                                        │
│  Issue: Role-based access basico, sin ABAC                │
│  Action: Implementar RBAC completo + resource permissions │
│                                                            │
│  A02 - Cryptographic Failures                             │
│  Status: ❌ CRITICO                                        │
│  Issue: Passwords plain text, no encryption at rest       │
│  Action: Bcrypt + AES-256-GCM para datos sensibles        │
│                                                            │
│  A03 - Injection                                           │
│  Status: ✅ OK (Prisma ORM previene SQL injection)         │
│  Issue: None                                               │
│  Action: Mantener uso de Prisma, no raw queries           │
│                                                            │
│  A04 - Insecure Design                                    │
│  Status: ⚠️ PARCIAL                                        │
│  Issue: Sin rate limiting, sin 2FA, sin OTP               │
│  Action: Implementar security patterns                    │
│                                                            │
│  A05 - Security Misconfiguration                          │
│  Status: ❌ CRITICO                                        │
│  Issue: Secrets expuestos, sin security headers           │
│  Action: Environment segregation + headers                │
│                                                            │
│  A06 - Vulnerable Components                              │
│  Status: ⚠️ PARCIAL                                        │
│  Issue: Dependencias sin auditar                          │
│  Action: npm audit + Snyk integration                     │
│                                                            │
│  A07 - Authentication Failures                            │
│  Status: ❌ CRITICO                                        │
│  Issue: Tokens inseguros, sin 2FA, sin rate limit         │
│  Action: JWT + 2FA + rate limiting                        │
│                                                            │
│  A08 - Software & Data Integrity Failures                 │
│  Status: ⚠️ PARCIAL                                        │
│  Issue: Sin CI/CD pipeline, sin code signing              │
│  Action: GitHub Actions + code review                     │
│                                                            │
│  A09 - Security Logging & Monitoring Failures             │
│  Status: ❌ CRITICO                                        │
│  Issue: Sin logging estructurado, sin audit trail         │
│  Action: Implementar Pino + Sentry + audit logs           │
│                                                            │
│  A10 - Server-Side Request Forgery (SSRF)                 │
│  Status: ✅ OK (no external API calls from server)         │
│  Issue: None                                               │
│  Action: Mantener, validar si se agregan APIs externas    │
│                                                            │
├────────────────────────────────────────────────────────────┤
│  OVERALL OWASP SCORE: 30/100 ❌                            │
└────────────────────────────────────────────────────────────┘
```

**Dependency Scanning:**
```bash
# package.json scripts
{
  "scripts": {
    "audit": "npm audit --production",
    "audit:fix": "npm audit fix",
    "snyk:test": "snyk test",
    "snyk:monitor": "snyk monitor"
  }
}

# .github/workflows/security.yml
name: Security Scan
on: [push, pull_request]
jobs:
  security:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Run Snyk
        uses: snyk/actions/node@master
        env:
          SNYK_TOKEN: ${{ secrets.SNYK_TOKEN }}
      - name: Run npm audit
        run: npm audit --production
```

### 3.4 Implement Strong Access Control

#### Requirement 7: Restrict Access by Business Need-to-Know

| # | Control | Estado | Prioridad | Notas |
|---|---------|--------|-----------|-------|
| 7.1 | Limit access to cardholder data | ✅ | - | No almacenamos CHD |
| 7.2 | Assign access based on job classification | ⚠️ | P1 | Mejorar RBAC |
| 7.3 | Default deny all | ⚠️ | P2 | Implementar principio de minimo privilegio |

**RBAC (Role-Based Access Control) Mejorado:**

```typescript
// lib/auth/permissions.ts

export enum Permission {
  // User permissions
  USER_READ = 'user:read',
  USER_UPDATE = 'user:update',
  USER_DELETE = 'user:delete',

  // Wallet permissions
  WALLET_READ = 'wallet:read',
  WALLET_DEPOSIT = 'wallet:deposit',
  WALLET_WITHDRAW = 'wallet:withdraw',
  WALLET_TRANSFER = 'wallet:transfer',

  // Transaction permissions
  TRANSACTION_READ = 'transaction:read',
  TRANSACTION_CREATE = 'transaction:create',
  TRANSACTION_REFUND = 'transaction:refund',

  // Admin permissions
  ADMIN_USERS = 'admin:users',
  ADMIN_REPORTS = 'admin:reports',
  ADMIN_SETTINGS = 'admin:settings',

  // Merchant permissions
  MERCHANT_POS = 'merchant:pos',
  MERCHANT_REPORTS = 'merchant:reports',
}

export const RolePermissions: Record<string, Permission[]> = {
  customer: [
    Permission.USER_READ,
    Permission.USER_UPDATE,
    Permission.WALLET_READ,
    Permission.WALLET_DEPOSIT,
    Permission.WALLET_TRANSFER,
    Permission.TRANSACTION_READ,
  ],
  merchant: [
    Permission.USER_READ,
    Permission.USER_UPDATE,
    Permission.WALLET_READ,
    Permission.WALLET_DEPOSIT,
    Permission.WALLET_WITHDRAW,
    Permission.TRANSACTION_READ,
    Permission.MERCHANT_POS,
    Permission.MERCHANT_REPORTS,
  ],
  admin: Object.values(Permission), // All permissions
};

export function hasPermission(
  userRole: string,
  permission: Permission
): boolean {
  const permissions = RolePermissions[userRole] || [];
  return permissions.includes(permission);
}

export function requirePermission(permission: Permission) {
  return async (request: NextRequest) => {
    const auth = await authenticateRequest(request);

    if (!auth.authenticated || !auth.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    if (!hasPermission(auth.user.role, permission)) {
      return NextResponse.json(
        { error: 'Forbidden - Insufficient permissions' },
        { status: 403 }
      );
    }

    return null; // Allow
  };
}
```

#### Requirement 8: Assign Unique ID to Each Person

| # | Control | Estado | Prioridad | Notas |
|---|---------|--------|-----------|-------|
| 8.1 | Assign unique ID to each user | ✅ | - | UUID implementado |
| 8.2 | Implement authentication | ⚠️ | P0 | Mejorar (ver P0 blockers) |
| 8.3 | Secure authentication credentials | ❌ | P0 | Passwords plain text |
| 8.4 | Render passwords unreadable | ❌ | P0 | Sin hashing |
| 8.5 | Don't use group/shared IDs | ✅ | - | Cada usuario tiene ID unico |
| 8.6 | Use MFA for remote access | ❌ | P1 | Implementar 2FA |
| 8.7 | Lock accounts after failed attempts | ❌ | P1 | Implementar account lockout |

**Account Lockout Policy:**
```typescript
// lib/auth/account-lockout.ts

const LOCKOUT_THRESHOLD = 5; // Failed attempts
const LOCKOUT_DURATION = 30 * 60 * 1000; // 30 minutes

export async function recordFailedLogin(userId: string): Promise<boolean> {
  const key = `lockout:${userId}`;
  const attempts = await redis.incr(key);

  if (attempts === 1) {
    await redis.expire(key, 1800); // 30 minutes
  }

  if (attempts >= LOCKOUT_THRESHOLD) {
    await redis.set(`locked:${userId}`, '1', { ex: 1800 });
    return true; // Account locked
  }

  return false; // Not locked yet
}

export async function isAccountLocked(userId: string): Promise<boolean> {
  const locked = await redis.get(`locked:${userId}`);
  return locked !== null;
}

export async function clearFailedAttempts(userId: string): Promise<void> {
  await redis.del(`lockout:${userId}`);
}
```

#### Requirement 9: Restrict Physical Access

| # | Control | Estado | Prioridad | Notas |
|---|---------|--------|-----------|-------|
| 9.1 | Use cameras/access controls | N/A | - | Cloud-hosted |
| 9.2 | Procedures to distinguish visitors | N/A | - | No data center fisico |

### 3.5 Regularly Monitor and Test Networks

#### Requirement 10: Track and Monitor All Access

| # | Control | Estado | Prioridad | Notas |
|---|---------|--------|-----------|-------|
| 10.1 | Link access to individual users | ⚠️ | P1 | Session tracking parcial |
| 10.2 | Implement automated audit trails | ❌ | P1 | Implementar audit logs |
| 10.3 | Record audit trail entries | ❌ | P1 | Ver seccion Audit Logs |
| 10.4 | Synchronize time using NTP | ✅ | - | Cloud provider handles |
| 10.5 | Secure audit trails | ❌ | P2 | Encryption + immutability |
| 10.6 | Review logs daily | ❌ | P2 | Automated log review |
| 10.7 | Retain audit history for 1 year | ❌ | P2 | Log retention policy |

**Audit Logging Implementation:**

```prisma
// prisma/schema.prisma - Audit Log Model

model AuditLog {
  id            String   @id @default(uuid())
  timestamp     DateTime @default(now())

  // Who
  userId        String?
  sessionId     String?
  ipAddress     String
  userAgent     String?

  // What
  entityType    String   // User, Wallet, Transaction, Payment
  entityId      String
  action        AuditAction

  // Details
  changes       Json?    // Before/after values
  metadata      Json?

  // Security
  severity      AuditSeverity @default(INFO)
  success       Boolean
  errorMessage  String?

  @@index([userId, timestamp])
  @@index([entityType, entityId])
  @@index([timestamp])
  @@index([severity, timestamp])
  @@map("audit_logs")
}

enum AuditAction {
  // Authentication
  LOGIN_SUCCESS
  LOGIN_FAILED
  LOGOUT
  PASSWORD_CHANGE
  PASSWORD_RESET
  MFA_ENABLED
  MFA_DISABLED

  // User
  USER_CREATED
  USER_UPDATED
  USER_DELETED
  USER_STATUS_CHANGED

  // Wallet
  WALLET_CREATED
  WALLET_VIEWED
  WALLET_UPDATED

  // Transactions
  TRANSACTION_CREATED
  TRANSACTION_COMPLETED
  TRANSACTION_FAILED
  TRANSACTION_REFUNDED

  // Security
  PERMISSION_DENIED
  RATE_LIMIT_EXCEEDED
  SUSPICIOUS_ACTIVITY
}

enum AuditSeverity {
  DEBUG
  INFO
  WARNING
  ERROR
  CRITICAL
}
```

```typescript
// lib/audit/logger.ts

import { prisma } from '@/lib/prisma';
import { AuditAction, AuditSeverity } from '@prisma/client';

export interface AuditLogEntry {
  userId?: string;
  sessionId?: string;
  ipAddress: string;
  userAgent?: string;
  entityType: string;
  entityId: string;
  action: AuditAction;
  changes?: any;
  metadata?: any;
  severity?: AuditSeverity;
  success: boolean;
  errorMessage?: string;
}

export async function createAuditLog(entry: AuditLogEntry): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        ...entry,
        severity: entry.severity || AuditSeverity.INFO,
      },
    });
  } catch (error) {
    console.error('Failed to create audit log:', error);
    // Don't throw - audit logging shouldn't break app
  }
}

// Helper functions
export async function auditLogin(
  userId: string,
  ipAddress: string,
  success: boolean
): Promise<void> {
  await createAuditLog({
    userId,
    ipAddress,
    entityType: 'User',
    entityId: userId,
    action: success ? AuditAction.LOGIN_SUCCESS : AuditAction.LOGIN_FAILED,
    severity: success ? AuditSeverity.INFO : AuditSeverity.WARNING,
    success,
  });
}

export async function auditTransaction(
  userId: string,
  transactionId: string,
  action: AuditAction,
  amount: number,
  success: boolean
): Promise<void> {
  await createAuditLog({
    userId,
    ipAddress: 'internal',
    entityType: 'Transaction',
    entityId: transactionId,
    action,
    metadata: { amount },
    severity: success ? AuditSeverity.INFO : AuditSeverity.ERROR,
    success,
  });
}
```

#### Requirement 11: Test Security Systems Regularly

| # | Control | Estado | Prioridad | Notas |
|---|---------|--------|-----------|-------|
| 11.1 | Test for presence of wireless access points | N/A | - | Cloud app |
| 11.2 | Run internal and external network vulnerability scans | ❌ | P1 | Quarterly scans |
| 11.3 | Perform penetration testing | ❌ | P1 | Annual pen test |
| 11.4 | Use IDS/IPS | ⚠️ | P2 | WAF (Cloudflare) |
| 11.5 | Deploy file-integrity monitoring | ❌ | P2 | AIDE/Tripwire |

**Security Testing Plan:**
```yaml
# .github/workflows/security-tests.yml

name: Security Testing
on:
  schedule:
    - cron: '0 2 * * 1' # Weekly on Monday 2am
  workflow_dispatch:

jobs:
  dependency-scan:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Run npm audit
        run: npm audit --production
      - name: Snyk vulnerability scan
        uses: snyk/actions/node@master
        env:
          SNYK_TOKEN: ${{ secrets.SNYK_TOKEN }}

  sast-scan:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: SonarCloud Scan
        uses: SonarSource/sonarcloud-github-action@master
        env:
          SONAR_TOKEN: ${{ secrets.SONAR_TOKEN }}

  dast-scan:
    runs-on: ubuntu-latest
    steps:
      - name: ZAP Full Scan
        uses: zaproxy/action-full-scan@v0.4.0
        with:
          target: 'https://staging.guaira.app'
```

### 3.6 Maintain Information Security Policy

#### Requirement 12: Maintain Security Policy

| # | Control | Estado | Prioridad | Notas |
|---|---------|--------|-----------|-------|
| 12.1 | Establish security policy | ❌ | P1 | Crear documento de politica |
| 12.2 | Implement risk assessment process | ❌ | P1 | Annual risk assessment |
| 12.3 | Develop usage policies | ❌ | P2 | AUP, password policy |
| 12.4 | Ensure responsibilities are assigned | ⚠️ | P1 | RACI matrix |
| 12.5 | Assign security responsibilities | ❌ | P1 | Security officer designation |
| 12.6 | Implement security awareness program | ❌ | P2 | Training materials |
| 12.7 | Screen personnel | ⚠️ | P2 | Background checks |
| 12.8 | Maintain policies for service providers | ❌ | P2 | Vendor management |
| 12.9 | Service providers acknowledge responsibility | ⚠️ | P1 | Stripe/PayPal agreements |

---

## 4. PLAN DE IMPLEMENTACION

### 4.1 Fase 1: Fundamentos (Semanas 1-4)

**Objetivo:** Resolver bloqueadores criticos

| Tarea | Duracion | Responsable | Deliverable |
|-------|----------|-------------|-------------|
| Password hashing | 1 semana | Backend Dev | Passwords con bcrypt |
| JWT implementation | 1 semana | Backend Dev | Token system seguro |
| Secret management | 3 dias | DevOps | Secrets en Vault/AWS |
| Input validation | 1 semana | Backend Dev | Zod schemas |
| Rate limiting | 1 semana | Backend Dev | Upstash integration |

### 4.2 Fase 2: Seguridad Avanzada (Semanas 5-8)

| Tarea | Duracion | Responsable | Deliverable |
|-------|----------|-------------|-------------|
| 2FA implementation | 2 semanas | Backend Dev | TOTP/SMS OTP |
| Audit logging | 1 semana | Backend Dev | Audit trail completo |
| HTTPS enforcement | 3 dias | DevOps | SSL/TLS config |
| Security headers | 2 dias | Backend Dev | CSP, HSTS, etc |

### 4.3 Fase 3: Compliance (Semanas 9-12)

| Tarea | Duracion | Responsable | Deliverable |
|-------|----------|-------------|-------------|
| Security policy docs | 1 semana | CISO | Policy documents |
| Penetration testing | 2 semanas | External | Pen test report |
| Vulnerability scanning | 1 semana | DevOps | Scan reports |
| SAQ-A completion | 1 semana | Compliance | Completed SAQ |

---

## 5. AUDITORIA Y CERTIFICACION

### 5.1 Self-Assessment Questionnaire (SAQ-A)

**Timeline:**
- Preparacion: 2-3 semanas
- Completion: 1 semana
- Remediation: Variable
- Final submission: 1 dia

**Documentos Requeridos:**
- [ ] Completed SAQ-A form
- [ ] Attestation of Compliance (AOC)
- [ ] ASV scan results (quarterly)
- [ ] Policy documents
- [ ] Network diagrams
- [ ] Security procedures

### 5.2 Auditoria Externa

**Cuando se requiere:**
- Nivel 1 merchants (>6M transacciones/año)
- Voluntary para otros niveles
- Post-breach (si ocurre un incidente)

**Proceso:**
1. Seleccionar QSA (Qualified Security Assessor)
2. Pre-assessment call
3. Documentation review
4. On-site assessment (si aplica)
5. Report of Compliance (ROC)
6. Remediation (si hay findings)
7. Final ROC submission

**Costo Estimado:**
- QSA assessment: $15,000-$50,000
- Remediation: Variable
- Annual recertification: $10,000-$30,000

### 5.3 Mantenimiento de Compliance

**Actividades Continuas:**
- Quarterly vulnerability scans
- Annual SAQ completion
- Security awareness training
- Policy reviews and updates
- Incident response drills
- Vendor reviews

**Calendario:**
```
Q1: Vulnerability scan + Security training
Q2: Vulnerability scan + Policy review
Q3: Vulnerability scan + Incident response drill
Q4: Vulnerability scan + SAQ completion + Vendor review
```

---

**FIN DEL CHECKLIST PCI-DSS**

*Documento generado por: Chief Systems Architect & Global PMO Director*
*Version: 1.0*
*Confidencial - Solo para uso interno*
