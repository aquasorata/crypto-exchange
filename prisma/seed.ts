import "dotenv/config";
import { PrismaClient, CurrencyType, OrderType, OrderStatus, Role } from '@prisma/client'
import Decimal from 'decimal.js'
import bcrypt from 'bcrypt'
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

const adapter = new PrismaPg(pool);

const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('🌱 Start seeding...')

  // =========================
  // 1. Clear old data
  // =========================
  await prisma.$transaction([
    prisma.trade.deleteMany(),
    prisma.transaction.deleteMany(),
    prisma.internalTransfer.deleteMany(),
    prisma.externalTransfer.deleteMany(),
    prisma.order.deleteMany(),
    prisma.wallet.deleteMany(),
    prisma.user.deleteMany(),
    prisma.currency.deleteMany(),
  ])

  await prisma.$executeRawUnsafe(`
    ALTER SEQUENCE "User_id_seq" RESTART WITH 100;
  `);

  await prisma.$executeRawUnsafe(`
    ALTER SEQUENCE "Currency_id_seq" RESTART WITH 100;
  `);

  console.log('🗑 Old data cleared')

  // =========================
  // 2. Create currencies (deterministic IDs)
  // =========================
  const currencies = await prisma.$transaction([
    prisma.currency.create({
      data: { id: 1n, code: 'BTC', type: CurrencyType.CRYPTO },
    }),
    prisma.currency.create({
      data: { id: 2n, code: 'ETH', type: CurrencyType.CRYPTO },
    }),
    prisma.currency.create({
      data: { id: 3n, code: 'XRP', type: CurrencyType.CRYPTO },
    }),
    prisma.currency.create({
      data: { id: 4n, code: 'THB', type: CurrencyType.FIAT }, // 👈 ตำแหน่ง 4
    }),
    prisma.currency.create({
      data: { id: 5n, code: 'DOGE', type: CurrencyType.CRYPTO },
    }),
    prisma.currency.create({
      data: { id: 6n, code: 'USD', type: CurrencyType.FIAT },
    }),
  ])

  const btc = currencies[0]
  const thb = currencies[3]
  const tradableCryptos = currencies.filter((currency) => currency.type === CurrencyType.CRYPTO)

  console.log('💰 Currencies created')

  // =========================
  // 3. Create SYSTEM user (id = 1)
  // =========================
  const systemPassword = await bcrypt.hash('system_password', 10)

  const systemUser = await prisma.user.create({
    data: {
      id: 1n,
      name: 'SYSTEM',
      email: 'system@exchange.local',
      password: systemPassword,
      role: Role.ADMIN,
      wallets: {
        create: currencies.map((currency) => ({
          currencyId: currency.id,
          balance: new Decimal(0).toFixed(8),
          lockedBalance: new Decimal(0).toFixed(8),
        })),
      },
    },
  })

  console.log('🏦 SYSTEM user created')

  // =========================
  // 4. Create ADMIN user (id = 2)
  // =========================
  const adminPassword = await bcrypt.hash('admin123', 10)

  await prisma.user.create({
    data: {
      id: 2n,
      name: 'Admin',
      email: 'admin@test.com',
      password: adminPassword,
      role: Role.ADMIN,
      wallets: {
        create: currencies.map((currency) => {
          if (currency.id === btc.id) {
            return {
              currencyId: currency.id,
              balance: new Decimal(10).toFixed(8),
            }
          }

          if (currency.id === thb.id) {
            return {
              currencyId: currency.id,
              balance: new Decimal(1000000000).toFixed(8),
            }
          }

          return {
            currencyId: currency.id,
            balance: new Decimal(0.5).toFixed(8),
          }
        }),
      },
    },
  })

  console.log('👑 Admin user created')

  // =========================
  // 5. Create normal users
  // =========================
  const users = []

  for (let i = 1; i <= 5; i++) {
    const hashedPassword = await bcrypt.hash('password123', 10)

    const user = await prisma.user.create({
      data: {
        name: `User ${i}`,
        email: `user${i}@test.com`,
        password: hashedPassword,
        role: Role.USER,
        wallets: {
          create: currencies.map((currency) => {
            if (currency.id === thb.id) {
              return {
                currencyId: currency.id,
                balance: new Decimal(500000 + Math.random() * 10000).toFixed(8),
              }
            }

            if (currency.id === btc.id) {
              return {
                currencyId: currency.id,
                balance: new Decimal(1 + Math.random()).toFixed(8),
              }
            }

            return {
              currencyId: currency.id,
              balance: new Decimal(0.2 + Math.random() * 0.8).toFixed(8),
            }
          }),
        },
      },
      include: { wallets: true },
    })

    users.push(user)
  }

  console.log('👤 Users + Wallets created')

  // =========================
  // 6. Create Random Orders
  // =========================
  const allCurrencies = tradableCryptos
  
  for (let i = 0; i < 40; i++) {
    const randomUser = users[Math.floor(Math.random() * users.length)]
    const randomCurrency =
      allCurrencies[Math.floor(Math.random() * allCurrencies.length)]
  
    const orderType = Math.random() > 0.5 ? OrderType.BUY : OrderType.SELL
  
    const price = new Decimal(100 + Math.random() * 1000).toDecimalPlaces(8)
    const amount = new Decimal(0.01 + Math.random()).toDecimalPlaces(8)
  
    let lockedAmount: Decimal
    let walletCurrencyId: bigint
  
    if (orderType === OrderType.BUY) {
      walletCurrencyId = thb.id
      lockedAmount = price.mul(amount)
    } else {
      walletCurrencyId = randomCurrency.id
      lockedAmount = amount
    }
  
    const wallet = await prisma.wallet.findFirst({
      where: {
        userId: randomUser.id,
        currencyId: walletCurrencyId,
      },
    })
  
    if (!wallet) continue
  
    const walletBalance = new Decimal(wallet.balance.toString())
  
    if (walletBalance.lessThan(lockedAmount)) {
      continue
    }
  
    await prisma.$transaction([
      prisma.wallet.update({
        where: { id: wallet.id },
        data: {
          balance: walletBalance.minus(lockedAmount).toFixed(8),
          lockedBalance: new Decimal(wallet.lockedBalance.toString())
            .plus(lockedAmount)
            .toFixed(8),
        },
      }),
      prisma.order.create({
        data: {
          clientOrderId: `ORD-${Date.now()}-${i}-${Math.floor(
            Math.random() * 10000
          )}`,
          userId: randomUser.id,
          currencyId: randomCurrency.id,
          orderType,
          price: price.toFixed(8),
          amount: amount.toFixed(8),
          remainingAmount: amount.toFixed(8),
          lockedWalletId: wallet.id,
          lockedAmount: lockedAmount.toFixed(8),
          status: OrderStatus.OPEN,
        },
      }),
    ])
  }

  console.log('📊 40 Random Orders created')

  console.log('✅ Seeding completed')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
