import { SafeUser } from "./user.types";
import Decimal from "decimal.js";

export interface WalletResponseDto {
  id: string;
  currencyId: string;
  balance: string;
  lockedBalance: string;
  availableBalance: string;
}

export interface UserResponseDto {
  id: string;
  name: string;
  email: string;
  wallets?: WalletResponseDto[];
}

export const toUserProfileResponseDto = (user: SafeUser): UserResponseDto => ({
  id: user.id.toString(),
  name: user.name,
  email: user.email,
  wallets: user.wallets?.map(wallet => {
    const balance = new Decimal(wallet.balance);
    const locked = new Decimal(wallet.lockedBalance);

    return {
      id: wallet.id.toString(),
      currencyId: wallet.currencyId.toString(),
      balance: balance.toString(),
      lockedBalance: locked.toString(),
      availableBalance: balance.minus(locked).toString()
    };
  })
});