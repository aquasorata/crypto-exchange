import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken';
import { prisma } from '../shared/prisma';
import { AppError } from '../shared/errors';

interface JwtPayload {
  userId: string
}

export const authMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AppError(401, 'Unauthorized')
    }

    const accessToken = authHeader.split(' ')[1]

    const decoded = jwt.verify(
      accessToken,
      process.env.JWT_SECRET!
    ) as JwtPayload

    const user = await prisma.user.findUnique({
      where: { id: BigInt(decoded.userId) }
    })

    if (!user) {
      throw new AppError(401, 'User not found')
    }

    req.user = user

    next()
  } catch (err) {
    next(new AppError(401, 'Invalid or expired token'))
  }
}
