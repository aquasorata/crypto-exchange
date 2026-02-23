import { prisma } from "../../shared/prisma";
import { AppError } from "../../shared/errors";
import { logger } from "../../shared/logger";
// -------------------------
// getOverview
// -------------------------
export const getOverview = async () => {
  const [totalUsers, totalOrders, totalTrades, totalVolume24h] =
    await prisma.$transaction([
      prisma.user.count(),
      prisma.order.count(),
      prisma.trade.count(),
      prisma.trade.aggregate({
        _sum: { amount: true },
        where: {
          createdAt: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
          },
        },
      }),
    ]);

  const totalVolume = await prisma.trade.aggregate({
    _sum: { amount: true },
  });

  return {
    totalUsers,
    totalOrders,
    totalTrades,
    totalVolume: totalVolume._sum.amount || "0",
    volume24h: totalVolume24h._sum.amount || "0",
  };
};
// -------------------------
// getTransactions
// -------------------------
export const getTransactions = async (limit: number, page: number) => {
  if (limit > 100) throw new AppError(400, "Limit too large");

  const skip = (page - 1) * limit;

  const [data, total] = await prisma.$transaction([
    prisma.transaction.findMany({
      take: limit,
      skip,
      orderBy: { createdAt: "desc" },
      include: {
        user: {
          select: { id: true, email: true },
        },
        currency: {
          select: { code: true },
        },
      },
    }),
    prisma.transaction.count(),
  ]);

  return {
    total,
    page,
    limit,
    data,
  };
};
// -------------------------
// getVolumeByCurrency
// -------------------------
export const getVolumeByCurrency = async () => {
  const volume = await prisma.trade.groupBy({
    by: ["currencyId"],
    _sum: {
      amount: true,
    },
  });

  const currencies = await prisma.currency.findMany();

  const currencyMap = new Map(
    currencies.map((c) => [c.id.toString(), c.code])
  );

  return volume.map((v) => ({
    currency: currencyMap.get(v.currencyId.toString()) || "UNKNOWN",
    volume: v._sum.amount || "0",
  }));
};
// -------------------------
// getSystemHealth
// -------------------------
export const getSystemHealth = async () => {
  try {
    await prisma.$queryRaw`SELECT 1`;

    const activeOrders = await prisma.order.count({
      where: { status: "OPEN" },
    });

    return {
      status: "OK",
      database: "connected",
      activeOrders,
      timestamp: new Date(),
    };
  } catch (error) {
    logger.error("Health check failed", error);
    throw new AppError(500, "System unhealthy");
  }
};