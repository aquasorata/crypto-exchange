import { User, Wallet } from "@prisma/client";

export type SafeWallet = Omit<Wallet, "userId">;

export type SafeUser = Omit<User, "password"> & {
  wallets?: SafeWallet[];
};