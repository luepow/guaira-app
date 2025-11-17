# SECURITY IMPLEMENTATION GUIDE
## Guair.app POS Web - PCI-DSS Compliance

**Version:** 1.0.0
**Date:** 2025-11-16
**Classification:** CONFIDENTIAL

---

## OVERVIEW

This guide provides step-by-step instructions to implement the security fixes identified in the security audit report. All changes must be implemented to achieve PCI-DSS compliance.

---

## CRITICAL PRIORITY - IMPLEMENT IMMEDIATELY

### 1. Remove .env from Git History

**CRITICAL - Do this FIRST before any other changes**

```bash
# 1. Remove .env from git history
git filter-branch --force --index-filter \
  "git rm --cached --ignore-unmatch .env" \
  --prune-empty --tag-name-filter cat -- --all

# 2. Force push (coordinate with team first!)
git push origin --force --all

# 3. Update .gitignore
cp .gitignore.secure .gitignore
git add .gitignore
git commit -m "security: Add .env to .gitignore"
git push
```

### 2. Rotate All Secrets IMMEDIATELY

**Required Actions:**

1. **Database Credentials**
   ```bash
   # Connect to PostgreSQL and change password
   psql -U postgres
   ALTER USER postgres WITH PASSWORD 'NEW_SECURE_PASSWORD';
   ```

2. **Generate New Secrets**
   ```bash
   # Generate NEXTAUTH_SECRET
   openssl rand -base64 32

   # Generate PASSWORD_PEPPER
   openssl rand -hex 32

   # Generate ENCRYPTION_KEY
   openssl rand -hex 32

   # Generate HMAC secrets
   openssl rand -base64 32
   openssl rand -base64 32
   ```

3. **Update Environment Variables**
   ```bash
   # Copy secure template
   cp .env.example.secure .env

   # Edit .env with generated secrets
   nano .env
   ```

### 3. Update Database Schema

```bash
# 1. Backup current database
pg_dump -U postgres guair_db > backup_$(date +%Y%m%d_%H%M%S).sql

# 2. Replace schema
cp prisma/schema.secure.prisma prisma/schema.prisma

# 3. Create migration
npx prisma migrate dev --name add_security_fields

# 4. Generate Prisma client
npx prisma generate
```

### 4. Migrate User Passwords to Bcrypt

Create and run this migration script:

```typescript
// scripts/migrate-passwords.ts
import { PrismaClient } from '@prisma/client';
import { hashPassword } from '../app/lib/crypto';

const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany();

  for (const user of users) {
    // Hash the plaintext password
    const passwordHash = await hashPassword(user.password);

    // Update user with hashed password
    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        // Remove old password field after migration
      },
    });

    console.log(`Migrated password for user ${user.id}`);
  }

  console.log('Password migration completed');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
```

Run migration:
```bash
npx tsx scripts/migrate-passwords.ts
```

### 5. Replace Authentication System

```bash
# 1. Backup current auth files
mv app/lib/auth.ts app/lib/auth.old.ts
mv app/api/auth/login/route.ts app/api/auth/login/route.old.ts

# 2. Install new secure versions
cp app/lib/auth.secure.ts app/lib/auth.ts
cp app/api/auth/login/route.secure.ts app/api/auth/login/route.ts
```

### 6. Update API Routes

Replace all payment and wallet APIs:

```bash
# Payment API
mv app/api/pos/payment/route.ts app/api/pos/payment/route.old.ts
cp app/api/pos/payment/route.secure.ts app/api/pos/payment/route.ts

# Repeat for other API routes
```

### 7. Install Security Dependencies

```bash
npm install bcryptjs @types/bcryptjs
npm install winston  # For structured logging
npm install helmet   # Additional security headers
npm install express-rate-limit  # If using Express
```

---

## HIGH PRIORITY - IMPLEMENT WITHIN 24 HOURS

### 8. Implement Security Headers

```bash
cp next.config.secure.js next.config.js
```

Verify headers are working:
```bash
curl -I https://localhost:9300
```

### 9. Implement Audit Logging

The audit logging system is now in place. Enable it:

```typescript
// app/lib/prisma.ts - Add middleware
prisma.$use(async (params, next) => {
  const result = await next(params);

  // Log all mutations
  if (['create', 'update', 'delete'].includes(params.action)) {
    await createAuditLog({
      action: `DB_${params.action.toUpperCase()}`,
      result: 'SUCCESS',
      resourceType: params.model,
      resourceId: result?.id,
      metadata: { operation: params.action },
    });
  }

  return result;
});
```

### 10. Implement Rate Limiting

For production, use Redis:

```bash
npm install ioredis @upstash/ratelimit
```

Update `app/lib/rate-limit.ts` to use Redis instead of in-memory store.

### 11. Enable HTTPS

Development (with self-signed certificate):
```bash
# Generate self-signed certificate
openssl req -x509 -newkey rsa:4096 -keyout key.pem -out cert.pem -days 365 -nodes

# Update package.json
"dev": "next dev -p 9300 --experimental-https --experimental-https-key ./key.pem --experimental-https-cert ./cert.pem"
```

Production: Use reverse proxy (nginx, Cloudflare) or hosting platform's SSL.

---

## MEDIUM PRIORITY - IMPLEMENT WITHIN 1 WEEK

### 12. Implement CSRF Protection

NextAuth already provides CSRF protection. Ensure it's enabled:

```typescript
// app/lib/auth.ts
export const authOptions: NextAuthOptions = {
  // ... other config
  cookies: {
    sessionToken: {
      name: `__Secure-next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: 'lax',  // CSRF protection
        path: '/',
        secure: process.env.NODE_ENV === 'production',
      },
    },
  },
};
```

### 13. Implement MFA (Multi-Factor Authentication)

Install dependencies:
```bash
npm install speakeasy qrcode @types/qrcode
```

Implementation example in `/app/api/auth/mfa/` (to be created).

### 14. Data Encryption at Rest

Implement field-level encryption for sensitive data:

```typescript
// Example: Encrypting wallet balance
import { encryptData, decryptData } from './crypto';

const encryptionKey = Buffer.from(process.env.ENCRYPTION_KEY, 'hex');

// Before saving
const { encrypted, iv, authTag } = encryptData(
  balance.toString(),
  encryptionKey
);

await prisma.wallet.update({
  where: { id: walletId },
  data: {
    balance: 0, // Store 0 as dummy
    encryptedData: encrypted,
    encryptionIV: iv,
    encryptionTag: authTag,
  },
});

// When reading
const decrypted = decryptData(
  wallet.encryptedData,
  encryptionKey,
  wallet.encryptionIV,
  wallet.encryptionTag
);
const balance = parseFloat(decrypted);
```

### 15. Implement CORS Properly

```bash
npm install cors @types/cors
```

Create CORS middleware:
```typescript
// app/middleware/cors.ts
import { NextResponse } from 'next/server';

export function corsMiddleware(request: Request) {
  const allowedOrigins = process.env.CORS_ALLOWED_ORIGINS?.split(',') || [];
  const origin = request.headers.get('origin');

  if (origin && allowedOrigins.includes(origin)) {
    const response = NextResponse.next();
    response.headers.set('Access-Control-Allow-Origin', origin);
    response.headers.set('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type,Authorization');
    return response;
  }

  return NextResponse.next();
}
```

---

## TESTING & VALIDATION

### Security Testing Checklist

1. **Password Hashing**
   ```bash
   # Test password hashing
   npm run test:security:passwords
   ```

2. **Rate Limiting**
   ```bash
   # Test login rate limiting
   for i in {1..10}; do
     curl -X POST http://localhost:9300/api/auth/login \
       -H "Content-Type: application/json" \
       -d '{"phone":"+123456789","password":"wrong"}'
   done
   ```

3. **Audit Logging**
   ```bash
   # Verify audit logs are created
   npx prisma studio
   # Check audit_logs table
   ```

4. **Security Headers**
   ```bash
   curl -I http://localhost:9300
   # Verify all security headers are present
   ```

5. **Input Validation**
   ```bash
   # Test SQL injection
   curl -X POST http://localhost:9300/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{"phone":"' OR 1=1--","password":"test"}'
   # Should return validation error
   ```

---

## MONITORING & MAINTENANCE

### Daily Tasks

1. Review audit logs for suspicious activity
   ```bash
   npm run audit:review-daily
   ```

2. Check failed login attempts
   ```sql
   SELECT * FROM audit_logs
   WHERE action = 'LOGIN_FAILED'
   AND timestamp > NOW() - INTERVAL '24 hours';
   ```

### Weekly Tasks

1. Review security events
2. Update dependencies
   ```bash
   npm audit
   npm update
   ```

3. Rotate logs
   ```bash
   npm run logs:rotate
   ```

### Monthly Tasks

1. Review access controls
2. Test disaster recovery
3. Penetration testing
4. Update security documentation

### Quarterly Tasks

1. Rotate secrets (PCI-DSS 8.2.4)
2. Full security audit
3. Compliance review
4. Staff security training

---

## INCIDENT RESPONSE

### If Breach Detected

1. **Immediate Actions**
   - Isolate affected systems
   - Revoke all active sessions
   - Change all credentials
   - Enable maintenance mode

2. **Investigation**
   - Review audit logs
   - Identify scope of breach
   - Document timeline

3. **Notification**
   - Notify security team
   - Notify affected users (if PII compromised)
   - Report to authorities (if required)

4. **Recovery**
   - Apply security patches
   - Restore from clean backup
   - Re-enable services

5. **Post-Mortem**
   - Document lessons learned
   - Update security procedures
   - Implement additional controls

---

## COMPLIANCE VERIFICATION

### PCI-DSS Self-Assessment Questionnaire (SAQ)

After implementation, complete SAQ D (Merchant):
1. Install and maintain firewall configuration
2. Do not use vendor-supplied defaults
3. Protect stored cardholder data
4. Encrypt transmission of cardholder data
5. Use and regularly update anti-virus
6. Develop and maintain secure systems
7. Restrict access to cardholder data
8. Assign unique ID to each person
9. Restrict physical access
10. Track and monitor network access
11. Test security systems
12. Maintain information security policy

### External Audit

Schedule Qualified Security Assessor (QSA) audit:
- Annual PCI-DSS assessment
- Quarterly network vulnerability scans
- Annual penetration testing

---

## SUPPORT & RESOURCES

### Documentation
- PCI-DSS v4.0: https://www.pcisecuritystandards.org/
- OWASP Top 10: https://owasp.org/www-project-top-ten/
- NIST Cybersecurity Framework: https://www.nist.gov/cyberframework

### Tools
- OWASP ZAP: Security testing
- Burp Suite: Penetration testing
- SonarQube: Code analysis
- Snyk: Dependency scanning

### Emergency Contacts
- Security Team: security@guair.app
- Incident Response: +1-XXX-XXX-XXXX
- PCI Compliance Officer: compliance@guair.app

---

**IMPORTANT:** This implementation must be completed before production deployment. Payment processing must be disabled until all CRITICAL and HIGH priority items are resolved.
