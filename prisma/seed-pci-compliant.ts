import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { randomBytes, createHash, createHmac } from 'crypto';

const prisma = new PrismaClient();

// ============================================================================
// CONFIGURACIÓN
// ============================================================================

const BCRYPT_ROUNDS = 12; // PCI-DSS 8.2.3: Strong password hashing
const HMAC_SECRET = process.env.HMAC_SECRET || 'CHANGE_THIS_IN_PRODUCTION';

// ============================================================================
// FUNCIONES AUXILIARES
// ============================================================================

/**
 * Hashear password con bcrypt
 * PCI-DSS 8.2.3: Passwords must be hashed with strong one-way function
 */
async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, BCRYPT_ROUNDS);
}

/**
 * Generar hash SHA-256
 * PCI-DSS 10.5.2: Audit logs must be protected against alteration
 */
function generateHash(content: string): string {
  return createHash('sha256').update(content).digest('hex');
}

/**
 * Generar HMAC signature
 * PCI-DSS 10.5.2: Ensure integrity of audit trails
 */
function generateSignature(content: string): string {
  return createHmac('sha256', HMAC_SECRET).update(content).digest('hex');
}

/**
 * Generar wallet number único
 */
function generateWalletNumber(): string {
  const prefix = 'GW'; // Guair Wallet
  const random = randomBytes(6).toString('hex').toUpperCase();
  return `${prefix}${random}`;
}

/**
 * Generar idempotency key
 */
function generateIdempotencyKey(): string {
  return randomBytes(16).toString('hex');
}

// ============================================================================
// CREAR USUARIOS DE PRUEBA
// ============================================================================

async function createUsers() {
  console.log('🔐 Creando usuarios con passwords hasheados (PCI-DSS compliant)...');

  // Admin user
  const adminPasswordHash = await hashPassword('Admin123!@#');
  const adminUser = await prisma.user.upsert({
    where: { phone: '+584121234567' },
    update: {},
    create: {
      phone: '+584121234567',
      phoneVerified: new Date(),
      email: 'admin@guair.app',
      emailVerified: new Date(),
      name: 'Administrador Sistema',
      role: 'ADMIN',
      passwordHash: adminPasswordHash,
      passwordChangedAt: new Date(),
      mfaEnabled: true,
      kycStatus: 'APPROVED',
      kycLevel: 2,
      kycVerifiedAt: new Date(),
      termsAcceptedAt: new Date(),
      termsVersion: '1.0',
      privacyAcceptedAt: new Date(),
      privacyVersion: '1.0',
    },
  });

  console.log(`✅ Admin creado: ${adminUser.name} (${adminUser.phone})`);

  // Merchant user
  const merchantPasswordHash = await hashPassword('Merchant123!@#');
  const merchantUser = await prisma.user.upsert({
    where: { phone: '+584129876543' },
    update: {},
    create: {
      phone: '+584129876543',
      phoneVerified: new Date(),
      email: 'merchant@guair.app',
      emailVerified: new Date(),
      name: 'Comerciante Demo',
      role: 'MERCHANT',
      passwordHash: merchantPasswordHash,
      passwordChangedAt: new Date(),
      mfaEnabled: false,
      kycStatus: 'APPROVED',
      kycLevel: 1,
      kycVerifiedAt: new Date(),
      termsAcceptedAt: new Date(),
      termsVersion: '1.0',
      privacyAcceptedAt: new Date(),
      privacyVersion: '1.0',
    },
  });

  console.log(`✅ Merchant creado: ${merchantUser.name} (${merchantUser.phone})`);

  // Customer user
  const customerPasswordHash = await hashPassword('Customer123!@#');
  const customerUser = await prisma.user.upsert({
    where: { phone: '+584141111111' },
    update: {},
    create: {
      phone: '+584141111111',
      phoneVerified: new Date(),
      email: 'customer@guair.app',
      emailVerified: new Date(),
      name: 'Cliente Demo',
      role: 'CUSTOMER',
      passwordHash: customerPasswordHash,
      passwordChangedAt: new Date(),
      mfaEnabled: false,
      kycStatus: 'APPROVED',
      kycLevel: 1,
      kycVerifiedAt: new Date(),
      termsAcceptedAt: new Date(),
      termsVersion: '1.0',
      privacyAcceptedAt: new Date(),
      privacyVersion: '1.0',
    },
  });

  console.log(`✅ Customer creado: ${customerUser.name} (${customerUser.phone})`);

  return { adminUser, merchantUser, customerUser };
}

// ============================================================================
// CREAR WALLETS
// ============================================================================

async function createWallets(users: {
  adminUser: any;
  merchantUser: any;
  customerUser: any;
}) {
  console.log('💰 Creando wallets...');

  const adminWallet = await prisma.wallet.create({
    data: {
      userId: users.adminUser.id,
      walletNumber: generateWalletNumber(),
      type: 'PERSONAL',
      balance: 100000, // $100,000 USD para pruebas
      availableBalance: 100000,
      holdBalance: 0,
      currency: 'USD',
      status: 'ACTIVE',
    },
  });

  const merchantWallet = await prisma.wallet.create({
    data: {
      userId: users.merchantUser.id,
      walletNumber: generateWalletNumber(),
      type: 'MERCHANT',
      balance: 50000, // $50,000 USD
      availableBalance: 50000,
      holdBalance: 0,
      currency: 'USD',
      status: 'ACTIVE',
      dailyLimit: 100000,
      monthlyLimit: 1000000,
    },
  });

  const customerWallet = await prisma.wallet.create({
    data: {
      userId: users.customerUser.id,
      walletNumber: generateWalletNumber(),
      type: 'PERSONAL',
      balance: 25000, // $25,000 USD
      availableBalance: 25000,
      holdBalance: 0,
      currency: 'USD',
      status: 'ACTIVE',
      dailyLimit: 10000,
      monthlyLimit: 50000,
    },
  });

  console.log(`✅ Wallet Admin: ${adminWallet.walletNumber} - $${adminWallet.balance}`);
  console.log(`✅ Wallet Merchant: ${merchantWallet.walletNumber} - $${merchantWallet.balance}`);
  console.log(`✅ Wallet Customer: ${customerWallet.walletNumber} - $${customerWallet.balance}`);

  return { adminWallet, merchantWallet, customerWallet };
}

// ============================================================================
// CREAR TRANSACCIONES CON DOUBLE-ENTRY
// ============================================================================

async function createTransactions(
  users: any,
  wallets: any
) {
  console.log('📊 Creando transacciones con double-entry accounting...');

  // Transacción 1: Depósito para customer
  const depositAmount = 5000;
  const depositIdempotencyKey = generateIdempotencyKey();
  const depositLedgerRef = randomBytes(16).toString('hex');

  const depositTransaction = await prisma.transaction.create({
    data: {
      userId: users.customerUser.id,
      walletId: wallets.customerWallet.id,
      type: 'DEPOSIT',
      amount: depositAmount,
      currency: 'USD',
      status: 'SUCCEEDED',
      description: 'Depósito inicial de prueba',
      idempotencyKey: depositIdempotencyKey,
      ipAddress: '127.0.0.1',
      userAgent: 'Seed Script',
      hash: generateHash(`deposit-${depositAmount}-${depositIdempotencyKey}`),
      signature: generateSignature(`deposit-${depositAmount}-${depositIdempotencyKey}`),
    },
  });

  // Double-entry: Crédito a wallet del customer
  await prisma.ledgerEntry.create({
    data: {
      ledgerRef: depositLedgerRef,
      entryType: 'CR',
      userId: users.customerUser.id,
      walletId: wallets.customerWallet.id,
      accountType: 'ASSET',
      debit: 0,
      credit: depositAmount,
      balanceAfter: wallets.customerWallet.balance + depositAmount,
      currency: 'USD',
      description: 'Depósito - Crédito a wallet',
      requestId: generateIdempotencyKey(),
      transactionId: depositTransaction.id,
      hash: generateHash(`ledger-cr-${depositAmount}`),
      signature: generateSignature(`ledger-cr-${depositAmount}`),
    },
  });

  // Double-entry: Débito de cuenta de sistema (contra-partida)
  await prisma.ledgerEntry.create({
    data: {
      ledgerRef: depositLedgerRef,
      entryType: 'DR',
      accountType: 'LIABILITY',
      debit: depositAmount,
      credit: 0,
      balanceAfter: 0,
      currency: 'USD',
      description: 'Depósito - Débito de sistema',
      requestId: generateIdempotencyKey(),
      transactionId: depositTransaction.id,
      hash: generateHash(`ledger-dr-${depositAmount}`),
      signature: generateSignature(`ledger-dr-${depositAmount}`),
    },
  });

  console.log(`✅ Depósito creado: $${depositAmount} (double-entry)`);

  // Transacción 2: Pago de customer a merchant
  const paymentAmount = 2500;
  const feeAmount = 75; // 3% fee
  const merchantAmount = paymentAmount - feeAmount;
  const paymentIdempotencyKey = generateIdempotencyKey();
  const paymentLedgerRef = randomBytes(16).toString('hex');

  const payment = await prisma.payment.create({
    data: {
      userId: users.customerUser.id,
      merchantId: users.merchantUser.id,
      amount: paymentAmount,
      feeAmount: feeAmount,
      merchantAmount: merchantAmount,
      currency: 'USD',
      status: 'SUCCEEDED',
      description: 'Pago de prueba a comerciante',
      idempotencyKey: paymentIdempotencyKey,
      ipAddress: '127.0.0.1',
      userAgent: 'Seed Script',
      hash: generateHash(`payment-${paymentAmount}-${paymentIdempotencyKey}`),
      signature: generateSignature(`payment-${paymentAmount}-${paymentIdempotencyKey}`),
      completedAt: new Date(),
    },
  });

  const paymentTransaction = await prisma.transaction.create({
    data: {
      userId: users.customerUser.id,
      walletId: wallets.customerWallet.id,
      type: 'PAYMENT',
      amount: paymentAmount,
      currency: 'USD',
      status: 'SUCCEEDED',
      description: 'Pago a comerciante',
      idempotencyKey: generateIdempotencyKey(),
      ipAddress: '127.0.0.1',
      userAgent: 'Seed Script',
      hash: generateHash(`payment-txn-${paymentAmount}`),
      signature: generateSignature(`payment-txn-${paymentAmount}`),
    },
  });

  // Double-entry para el pago:
  // 1. Débito de wallet del customer
  await prisma.ledgerEntry.create({
    data: {
      ledgerRef: paymentLedgerRef,
      entryType: 'DR',
      userId: users.customerUser.id,
      walletId: wallets.customerWallet.id,
      accountType: 'ASSET',
      debit: paymentAmount,
      credit: 0,
      balanceAfter: wallets.customerWallet.balance - paymentAmount,
      currency: 'USD',
      description: 'Pago - Débito de wallet customer',
      requestId: generateIdempotencyKey(),
      transactionId: paymentTransaction.id,
      paymentId: payment.id,
      hash: generateHash(`payment-dr-${paymentAmount}`),
      signature: generateSignature(`payment-dr-${paymentAmount}`),
    },
  });

  // 2. Crédito a wallet del merchant (menos fee)
  await prisma.ledgerEntry.create({
    data: {
      ledgerRef: paymentLedgerRef,
      entryType: 'CR',
      merchantId: users.merchantUser.id,
      walletId: wallets.merchantWallet.id,
      accountType: 'ASSET',
      debit: 0,
      credit: merchantAmount,
      balanceAfter: wallets.merchantWallet.balance + merchantAmount,
      currency: 'USD',
      description: 'Pago - Crédito a wallet merchant',
      requestId: generateIdempotencyKey(),
      transactionId: paymentTransaction.id,
      paymentId: payment.id,
      hash: generateHash(`payment-cr-merchant-${merchantAmount}`),
      signature: generateSignature(`payment-cr-merchant-${merchantAmount}`),
    },
  });

  // 3. Crédito de fee a cuenta de ingresos
  await prisma.ledgerEntry.create({
    data: {
      ledgerRef: paymentLedgerRef,
      entryType: 'CR',
      accountType: 'REVENUE',
      debit: 0,
      credit: feeAmount,
      balanceAfter: feeAmount,
      currency: 'USD',
      description: 'Fee de transacción',
      requestId: generateIdempotencyKey(),
      transactionId: paymentTransaction.id,
      paymentId: payment.id,
      hash: generateHash(`fee-cr-${feeAmount}`),
      signature: generateSignature(`fee-cr-${feeAmount}`),
    },
  });

  console.log(`✅ Pago creado: $${paymentAmount} (fee: $${feeAmount}, merchant: $${merchantAmount})`);

  // Actualizar balances de wallets
  await prisma.wallet.update({
    where: { id: wallets.customerWallet.id },
    data: {
      balance: wallets.customerWallet.balance + depositAmount - paymentAmount,
      availableBalance: wallets.customerWallet.balance + depositAmount - paymentAmount,
    },
  });

  await prisma.wallet.update({
    where: { id: wallets.merchantWallet.id },
    data: {
      balance: wallets.merchantWallet.balance + merchantAmount,
      availableBalance: wallets.merchantWallet.balance + merchantAmount,
    },
  });

  console.log('✅ Balances de wallets actualizados');
}

// ============================================================================
// CREAR AUDIT LOGS
// ============================================================================

async function createAuditLogs(users: any) {
  console.log('📝 Creando audit logs (PCI-DSS 10)...');

  const auditLogs = [
    {
      userId: users.adminUser.id,
      userName: users.adminUser.name,
      action: 'USER_LOGIN',
      resource: 'User',
      resourceId: users.adminUser.id,
      result: 'SUCCESS',
      ipAddress: '127.0.0.1',
      userAgent: 'Mozilla/5.0',
    },
    {
      userId: users.customerUser.id,
      userName: users.customerUser.name,
      action: 'PAYMENT_CREATED',
      resource: 'Payment',
      result: 'SUCCESS',
      ipAddress: '127.0.0.1',
    },
  ];

  for (const log of auditLogs) {
    const content = `${log.userId}|${log.action}|${log.resource || ''}|${log.result}`;
    await prisma.auditLog.create({
      data: {
        ...log,
        hash: generateHash(content),
        signature: generateSignature(content),
      },
    });
  }

  console.log(`✅ ${auditLogs.length} audit logs creados`);
}

// ============================================================================
// CREAR PAYMENT METHODS
// ============================================================================

async function createPaymentMethods(users: any, wallets: any) {
  console.log('💳 Creando payment methods...');

  // Payment method para customer (tokenizado - PCI-DSS compliant)
  await prisma.paymentMethod.create({
    data: {
      userId: users.customerUser.id,
      type: 'CARD',
      provider: 'stripe',
      providerId: 'pm_test_' + randomBytes(12).toString('hex'),
      last4: '4242', // Solo últimos 4 dígitos (PCI-DSS 3.2)
      brand: 'visa',
      expiryMonth: 12,
      expiryYear: 2026,
      isDefault: true,
      status: 'ACTIVE',
    },
  });

  // Payment method de wallet para customer
  await prisma.paymentMethod.create({
    data: {
      userId: users.customerUser.id,
      type: 'WALLET',
      provider: 'guair_wallet',
      providerId: wallets.customerWallet.walletNumber,
      sourceWalletId: wallets.customerWallet.id,
      isDefault: false,
      status: 'ACTIVE',
    },
  });

  console.log('✅ Payment methods creados');
}

// ============================================================================
// CREAR NOTIFICACIONES
// ============================================================================

async function createNotifications(users: any) {
  console.log('🔔 Creando notificaciones...');

  await prisma.notification.create({
    data: {
      userId: users.customerUser.id,
      type: 'PAYMENT_SENT',
      title: 'Pago enviado',
      message: 'Tu pago de $2,500 USD fue procesado exitosamente',
      read: false,
    },
  });

  await prisma.notification.create({
    data: {
      userId: users.merchantUser.id,
      type: 'PAYMENT_RECEIVED',
      title: 'Pago recibido',
      message: 'Has recibido un pago de $2,425 USD',
      read: false,
    },
  });

  console.log('✅ Notificaciones creadas');
}

// ============================================================================
// MAIN
// ============================================================================

async function main() {
  console.log('🌱 Iniciando seed de base de datos (PCI-DSS Compliant)...\n');

  try {
    // 1. Crear usuarios
    const users = await createUsers();

    // 2. Crear wallets
    const wallets = await createWallets(users);

    // 3. Crear transacciones con double-entry
    await createTransactions(users, wallets);

    // 4. Crear audit logs
    await createAuditLogs(users);

    // 5. Crear payment methods
    await createPaymentMethods(users, wallets);

    // 6. Crear notificaciones
    await createNotifications(users);

    console.log('\n🎉 Seed completado exitosamente!');
    console.log('\n📋 Credenciales de prueba:');
    console.log('==========================================');
    console.log('Admin:');
    console.log('  Phone: +584121234567');
    console.log('  Password: Admin123!@#');
    console.log('');
    console.log('Merchant:');
    console.log('  Phone: +584129876543');
    console.log('  Password: Merchant123!@#');
    console.log('');
    console.log('Customer:');
    console.log('  Phone: +584141111111');
    console.log('  Password: Customer123!@#');
    console.log('==========================================');
    console.log('\n⚠️  IMPORTANTE: Cambiar estas credenciales en producción!');
  } catch (error) {
    console.error('❌ Error durante el seed:', error);
    throw error;
  }
}

main()
  .catch((e) => {
    console.error('❌ Error fatal:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
