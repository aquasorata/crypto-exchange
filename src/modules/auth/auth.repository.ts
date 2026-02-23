import { Currency, Prisma, User } from '@prisma/client';
import { prisma } from '../../shared/prisma';

export type SafeUser = Prisma.UserGetPayload<{
  select: {
    id: true;
    name: true;
    email: true;
  };
}>;

export const findUserByEmail = async (
    email: string
): Promise<User | null> => {
  return prisma.user.findUnique({
    where: { email }
  });
}

export const createUser = async (
  tx: Prisma.TransactionClient,
  data: {
    name: string;
    email: string;
    password: string;
  }
): Promise<SafeUser> => {
  return tx.user.create({
    data,
    select: {
      id: true,
      name: true,
      email: true
    }
  });
};

export const findCurrenciesByCodes = async (
  tx: Prisma.TransactionClient,
  codes: string[]
): Promise<Currency[]> => {
  return tx.currency.findMany({
    where: {
      code: { in: codes }
    }
  });
};

export const createWallets = async (
  tx: Prisma.TransactionClient,
  wallets: {
    userId: bigint;
    currencyId: bigint;
    balance: number;
  }[]
) => {
  return tx.wallet.createMany({
    data: wallets
  });
};