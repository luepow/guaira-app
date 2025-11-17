/**
 * Cryptographic utilities for Guair.app
 * PCI-DSS Compliant encryption and hashing functions
 *
 * Standards:
 * - PCI-DSS 3.4, 3.5, 3.6, 8.2.1
 * - NIST SP 800-132 (Password-Based Key Derivation)
 * - OWASP Password Storage Cheat Sheet
 */

import bcrypt from 'bcryptjs';
import crypto from 'crypto';

/**
 * Password hashing configuration
 * PCI-DSS 8.2.1: Render passwords unreadable
 */
const BCRYPT_ROUNDS = 12; // PCI-DSS minimum recommended
const PEPPER = process.env.PASSWORD_PEPPER || ''; // Additional secret layer

/**
 * Hash password using bcrypt with pepper
 * @param password - Plain text password
 * @returns Hashed password
 */
export async function hashPassword(password: string): Promise<string> {
  // Validate password strength
  if (!isStrongPassword(password)) {
    throw new Error('Password does not meet complexity requirements');
  }

  // Add pepper before hashing (additional security layer)
  const pepperedPassword = password + PEPPER;

  // Generate salt and hash
  const salt = await bcrypt.genSalt(BCRYPT_ROUNDS);
  const hash = await bcrypt.hash(pepperedPassword, salt);

  return hash;
}

/**
 * Verify password against hash
 * @param password - Plain text password
 * @param hash - Stored password hash
 * @returns True if password matches
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  const pepperedPassword = password + PEPPER;
  return bcrypt.compare(pepperedPassword, hash);
}

/**
 * Validate password complexity
 * PCI-DSS 8.2.3: Password complexity requirements
 *
 * Requirements:
 * - Minimum 12 characters (PCI-DSS 8.2.1)
 * - At least one uppercase letter
 * - At least one lowercase letter
 * - At least one number
 * - At least one special character
 *
 * @param password - Password to validate
 * @returns True if password meets requirements
 */
export function isStrongPassword(password: string): boolean {
  if (password.length < 12) return false;

  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);

  return hasUpperCase && hasLowerCase && hasNumber && hasSpecialChar;
}

/**
 * Generate cryptographically secure random token
 * Used for session tokens, API keys, reset tokens
 *
 * @param bytes - Number of random bytes (default 32 = 256 bits)
 * @returns Hex-encoded random token
 */
export function generateSecureToken(bytes: number = 32): string {
  return crypto.randomBytes(bytes).toString('hex');
}

/**
 * Generate secure API key
 * Format: guair_live_<64-char-hex>
 *
 * @returns Formatted API key
 */
export function generateApiKey(): string {
  const token = generateSecureToken(32);
  return `guair_live_${token}`;
}

/**
 * Encrypt sensitive data using AES-256-GCM
 * PCI-DSS 3.4: Render PAN unreadable
 *
 * @param plaintext - Data to encrypt
 * @param key - Encryption key (32 bytes for AES-256)
 * @returns Object with encrypted data, IV, and auth tag
 */
export function encryptData(plaintext: string, key: Buffer): {
  encrypted: string;
  iv: string;
  authTag: string;
} {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);

  let encrypted = cipher.update(plaintext, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  const authTag = cipher.getAuthTag();

  return {
    encrypted,
    iv: iv.toString('hex'),
    authTag: authTag.toString('hex'),
  };
}

/**
 * Decrypt data encrypted with AES-256-GCM
 *
 * @param encrypted - Encrypted data
 * @param key - Decryption key
 * @param iv - Initialization vector
 * @param authTag - Authentication tag
 * @returns Decrypted plaintext
 */
export function decryptData(
  encrypted: string,
  key: Buffer,
  iv: string,
  authTag: string
): string {
  const decipher = crypto.createDecipheriv(
    'aes-256-gcm',
    key,
    Buffer.from(iv, 'hex')
  );

  decipher.setAuthTag(Buffer.from(authTag, 'hex'));

  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
}

/**
 * Generate encryption key from passphrase
 * Uses PBKDF2 with SHA-256
 *
 * @param passphrase - Secret passphrase
 * @param salt - Salt for key derivation
 * @returns 32-byte encryption key
 */
export function deriveEncryptionKey(passphrase: string, salt: Buffer): Buffer {
  return crypto.pbkdf2Sync(passphrase, salt, 100000, 32, 'sha256');
}

/**
 * Hash data using SHA-256
 * Used for data integrity verification
 *
 * @param data - Data to hash
 * @returns Hex-encoded hash
 */
export function sha256Hash(data: string): string {
  return crypto.createHash('sha256').update(data).digest('hex');
}

/**
 * Generate HMAC for data integrity
 * Used for audit log integrity
 *
 * @param data - Data to sign
 * @param secret - HMAC secret key
 * @returns HMAC signature
 */
export function generateHMAC(data: string, secret: string): string {
  return crypto.createHmac('sha256', secret).update(data).digest('hex');
}

/**
 * Verify HMAC signature
 *
 * @param data - Original data
 * @param signature - HMAC signature to verify
 * @param secret - HMAC secret key
 * @returns True if signature is valid
 */
export function verifyHMAC(data: string, signature: string, secret: string): boolean {
  const expectedSignature = generateHMAC(data, secret);
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}

/**
 * Mask sensitive data for logging
 * PCI-DSS 3.3: Mask PAN when displayed
 *
 * @param data - Data to mask
 * @param visibleChars - Number of characters to show at end
 * @returns Masked string
 */
export function maskSensitiveData(data: string, visibleChars: number = 4): string {
  if (data.length <= visibleChars) {
    return '*'.repeat(data.length);
  }

  const masked = '*'.repeat(data.length - visibleChars);
  const visible = data.slice(-visibleChars);

  return masked + visible;
}

/**
 * Sanitize phone number for storage
 * Removes all non-digit characters
 *
 * @param phone - Phone number
 * @returns Sanitized phone number
 */
export function sanitizePhoneNumber(phone: string): string {
  return phone.replace(/\D/g, '');
}

/**
 * Generate OTP (One-Time Password)
 * 6-digit numeric code
 *
 * @returns 6-digit OTP
 */
export function generateOTP(): string {
  const otp = crypto.randomInt(100000, 999999);
  return otp.toString();
}

/**
 * Constant-time string comparison
 * Prevents timing attacks
 *
 * @param a - First string
 * @param b - Second string
 * @returns True if strings are equal
 */
export function constantTimeCompare(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false;
  }

  return crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b));
}
