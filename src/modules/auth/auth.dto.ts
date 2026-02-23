import { SafeUser } from "./auth.repository"

export interface UserResponseDto {
  id: bigint
  name: string
  email: string
}

export const toUserResponseDto = (user: SafeUser): UserResponseDto => ({
  id: user.id,
  name: user.name,
  email: user.email
})

export interface LoginResponseDto {
  user: {
    id: bigint
    name: string
    email: string
  }
  accessToken: string
}

export const toLoginResponseDto = (
  user: SafeUser,
  accessToken: string
): LoginResponseDto => ({
  user: {
    id: user.id,
    name: user.name,
    email: user.email
  },
  accessToken
})

export interface UserProfileResponseDto {
  id: string
  name: string
  email: string
  createdAt: Date
  wallets: {
    id: string
    currencyId: string
    balance: string
    lockedBalance: string
  }[]
}