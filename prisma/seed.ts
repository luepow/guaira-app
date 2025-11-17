import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

  // Create demo user
  const demoUser = await prisma.user.upsert({
    where: { phone: '+584121234567' },
    update: {},
    create: {
      phone: '+584121234567',
      password: 'demo123', // En producción, usar bcrypt para hashear
      name: 'Usuario Demo',
      email: 'demo@guair.app',
      role: 'merchant',
      avatar: '/avatars/demo.png',
      wallet: {
        create: {
          balance: 25000,
          currency: 'USD',
          status: 'active',
        },
      },
    },
  })

  console.log('✅ Created demo user:', demoUser.name)

  // Create test user
  const testUser = await prisma.user.upsert({
    where: { phone: '+584129876543' },
    update: {},
    create: {
      phone: '+584129876543',
      password: 'test123', // En producción, usar bcrypt para hashear
      name: 'Usuario Test',
      email: 'test@guair.app',
      role: 'customer',
      avatar: '/avatars/test.png',
      wallet: {
        create: {
          balance: 15000,
          currency: 'USD',
          status: 'active',
        },
      },
    },
  })

  console.log('✅ Created test user:', testUser.name)

  // Get wallets
  const demoWallet = await prisma.wallet.findUnique({
    where: { userId: demoUser.id },
  })

  const testWallet = await prisma.wallet.findUnique({
    where: { userId: testUser.id },
  })

  // Create sample transactions for demo user
  if (demoWallet) {
    await prisma.transaction.createMany({
      data: [
        {
          userId: demoUser.id,
          walletId: demoWallet.id,
          type: 'deposit',
          amount: 5000,
          currency: 'USD',
          status: 'succeeded',
          description: 'Recarga de saldo',
        },
        {
          userId: demoUser.id,
          walletId: demoWallet.id,
          type: 'payment',
          amount: 2500,
          currency: 'USD',
          status: 'succeeded',
          description: 'Pago en Restaurant La Guaira',
        },
        {
          userId: demoUser.id,
          walletId: demoWallet.id,
          type: 'deposit',
          amount: 10000,
          currency: 'USD',
          status: 'succeeded',
          description: 'Recarga de saldo',
        },
        {
          userId: demoUser.id,
          walletId: demoWallet.id,
          type: 'payment',
          amount: 1500,
          currency: 'USD',
          status: 'succeeded',
          description: 'Pago en Parking La Guaira',
        },
        {
          userId: demoUser.id,
          walletId: demoWallet.id,
          type: 'payment',
          amount: 3000,
          currency: 'USD',
          status: 'pending',
          description: 'Pago en Tienda Souvenirs',
        },
      ],
    })

    console.log('✅ Created sample transactions for demo user')
  }

  console.log('🎉 Seeding completed!')
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
