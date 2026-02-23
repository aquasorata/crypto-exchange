import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { prisma } from '../../shared/prisma';
import { AppError } from '../../shared/errors';
import { createUser, createWallets, findCurrenciesByCodes, findUserByEmail } from './auth.repository';

const SALT_ROUNDS = 12;

export class AuthService {
  // -------------------------
  // register
  // -------------------------
  async register(data: {
    name: string;
    email: string;
    password: string;
  }) {
    const { name, email, password } = data;

    const existingUser = await findUserByEmail(email);

    if (existingUser) throw new AppError(400, "Email already in use");

    const hashPassword = await bcrypt.hash(password, SALT_ROUNDS);

    const result = await prisma.$transaction(async (tx) => {
      const user = await createUser(tx, {
        name,
        email,
        password: hashPassword
      })

      const currencies = await findCurrenciesByCodes(tx, [
        "BTC", "ETH", "THB"
      ]);

      await createWallets(
        tx, 
        currencies.map(c => ({
          userId: user.id,
          currencyId: c.id,
          balance: 0
        }))
      );

      return user;
    });

    return result;
  }
  // -------------------------
  // login
  // -------------------------
  async login(data: {
    email: string, 
    password: string
  }) {
    const {email, password} = data;

    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) throw new AppError(401, "Invalid credentials");

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) throw new AppError(401, "Invalid credentials");

    const accessToken  = this.generateToken(user.id);

    return { user, accessToken  };
  }
  // -------------------------
  // getMe
  // -------------------------
  async getMe(userId: bigint) {
    const user = prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        wallets: {
          select: {
            id: true,
            currencyId: true,
            balance: true,
            lockedBalance: true,
          }
        }
      }
    })

    if (!user) throw new AppError(404, "User not found");

    return user;
  }
  // -------------------------
  // generateToken
  // -------------------------
  private generateToken(userId: bigint) {
    return jwt.sign(
      { userId: userId.toString() },
      process.env.JWT_SECRET!,
      { expiresIn: "72h"}
    );
  }
}