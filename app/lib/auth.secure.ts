/**
 * Secure Authentication Configuration
 * PCI-DSS Compliant Authentication System
 *
 * Compliance:
 * - PCI-DSS Requirement 8 (Identify and Authenticate Access)
 * - OWASP Authentication Cheat Sheet
 * - NIST SP 800-63B (Digital Identity Guidelines)
 */

import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { PrismaAdapter } from '@next-auth/prisma-adapter';
import { prisma } from './prisma';
import { verifyPassword } from './crypto';
import { createAuditLog } from './audit';
import { checkRateLimit } from './rate-limit';

/**
 * Secure NextAuth Configuration
 * PCI-DSS 8.2, 8.3
 */
export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        phone: { label: 'Teléfono', type: 'tel', placeholder: '+58412...' },
        password: { label: 'Contraseña', type: 'password' },
      },
      async authorize(credentials, req) {
        // Input validation
        if (!credentials?.phone || !credentials?.password) {
          await createAuditLog({
            action: 'LOGIN_FAILED',
            result: 'FAILURE',
            reason: 'Missing credentials',
            ipAddress: req?.headers?.['x-forwarded-for'] as string,
            userAgent: req?.headers?.['user-agent'] as string,
          });
          throw new Error('Credenciales inválidas');
        }

        // Rate limiting - PCI-DSS 8.2.4
        const clientIP = req?.headers?.['x-forwarded-for'] as string || 'unknown';
        const rateLimitKey = `login:${clientIP}`;

        const isAllowed = await checkRateLimit(rateLimitKey, {
          maxAttempts: 5,
          windowMs: 15 * 60 * 1000, // 15 minutes
        });

        if (!isAllowed) {
          await createAuditLog({
            action: 'LOGIN_RATE_LIMITED',
            result: 'FAILURE',
            reason: 'Too many login attempts',
            ipAddress: clientIP,
            userAgent: req?.headers?.['user-agent'] as string,
          });
          throw new Error('Demasiados intentos. Intente de nuevo en 15 minutos.');
        }

        // Find user
        const user = await prisma.user.findUnique({
          where: { phone: credentials.phone },
          include: { wallet: true },
        });

        if (!user) {
          // Timing attack mitigation: perform dummy hash even if user not found
          await verifyPassword('dummy-password', '$2a$12$dummyhash');

          await createAuditLog({
            action: 'LOGIN_FAILED',
            result: 'FAILURE',
            reason: 'User not found',
            metadata: { phone: credentials.phone },
            ipAddress: clientIP,
            userAgent: req?.headers?.['user-agent'] as string,
          });

          throw new Error('Credenciales inválidas');
        }

        // Check if account is locked
        if (user.accountLocked) {
          await createAuditLog({
            action: 'LOGIN_FAILED',
            result: 'FAILURE',
            reason: 'Account locked',
            userId: user.id,
            ipAddress: clientIP,
            userAgent: req?.headers?.['user-agent'] as string,
          });
          throw new Error('Cuenta bloqueada. Contacte al administrador.');
        }

        // Verify password using bcrypt
        const isValid = await verifyPassword(credentials.password, user.passwordHash);

        if (!isValid) {
          // Increment failed login attempts
          await prisma.user.update({
            where: { id: user.id },
            data: {
              failedLoginAttempts: { increment: 1 },
              lastFailedLogin: new Date(),
            },
          });

          // Lock account after 5 failed attempts - PCI-DSS 8.2.4
          if (user.failedLoginAttempts + 1 >= 5) {
            await prisma.user.update({
              where: { id: user.id },
              data: { accountLocked: true },
            });

            await createAuditLog({
              action: 'ACCOUNT_LOCKED',
              result: 'SUCCESS',
              reason: 'Too many failed login attempts',
              userId: user.id,
              ipAddress: clientIP,
            });
          }

          await createAuditLog({
            action: 'LOGIN_FAILED',
            result: 'FAILURE',
            reason: 'Invalid password',
            userId: user.id,
            ipAddress: clientIP,
            userAgent: req?.headers?.['user-agent'] as string,
          });

          throw new Error('Credenciales inválidas');
        }

        // Successful login
        // Reset failed attempts
        await prisma.user.update({
          where: { id: user.id },
          data: {
            failedLoginAttempts: 0,
            lastLogin: new Date(),
          },
        });

        // Create audit log for successful login - PCI-DSS 10.2.4
        await createAuditLog({
          action: 'LOGIN_SUCCESS',
          result: 'SUCCESS',
          userId: user.id,
          ipAddress: clientIP,
          userAgent: req?.headers?.['user-agent'] as string,
        });

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          role: user.role,
          avatar: user.avatar,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as any).role;
        token.phone = (user as any).phone;
        token.iat = Math.floor(Date.now() / 1000); // Issued at
        token.exp = Math.floor(Date.now() / 1000) + (15 * 60); // 15 minute expiry - PCI-DSS 8.2.5
      }
      return token;
    },
    async session({ session, token }) {
      // Check if token is expired
      const now = Math.floor(Date.now() / 1000);
      if (token.exp && now > token.exp) {
        throw new Error('Session expired');
      }

      if (session.user) {
        (session.user as any).id = token.id;
        (session.user as any).role = token.role;
        (session.user as any).phone = token.phone;
      }
      return session;
    },
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
  session: {
    strategy: 'jwt',
    maxAge: 15 * 60, // 15 minutes - PCI-DSS 8.2.5 (idle timeout)
    updateAge: 5 * 60, // Update session every 5 minutes
  },
  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === 'development',
  // Use secure cookies
  cookies: {
    sessionToken: {
      name: `__Secure-next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production', // HTTPS only in production
      },
    },
  },
  events: {
    async signOut({ token }) {
      // Log logout event - PCI-DSS 10.2.5
      if (token?.id) {
        await createAuditLog({
          action: 'LOGOUT',
          result: 'SUCCESS',
          userId: token.id as string,
        });
      }
    },
  },
};

/**
 * Validate session for API routes
 * @param req - Request object
 * @returns User session or null
 */
export async function validateSession(req: any) {
  const { getServerSession } = await import('next-auth');
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    return null;
  }

  return session;
}

/**
 * Require authentication for API route
 * Throws error if not authenticated
 */
export async function requireAuth(req: any) {
  const session = await validateSession(req);

  if (!session) {
    throw new Error('Unauthorized');
  }

  return session;
}

/**
 * Check if user has required role
 * @param session - User session
 * @param allowedRoles - Array of allowed roles
 */
export function hasRole(session: any, allowedRoles: string[]): boolean {
  if (!session?.user?.role) {
    return false;
  }

  return allowedRoles.includes(session.user.role);
}

/**
 * Require specific role for API route
 */
export async function requireRole(req: any, allowedRoles: string[]) {
  const session = await requireAuth(req);

  if (!hasRole(session, allowedRoles)) {
    await createAuditLog({
      action: 'UNAUTHORIZED_ACCESS',
      result: 'FAILURE',
      reason: 'Insufficient permissions',
      userId: session.user.id,
      metadata: {
        requiredRoles: allowedRoles,
        userRole: session.user.role,
      },
    });

    throw new Error('Forbidden');
  }

  return session;
}
