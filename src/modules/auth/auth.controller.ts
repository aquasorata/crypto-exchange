import { NextFunction, Request, Response } from "express";
import { AuthService } from "./auth.service";
import { successResponse } from "../../shared/response";
import { toLoginResponseDto, toUserResponseDto } from "./auth.dto";
import { loginSchema, registerSchema } from './auth.schema';
import { serializeBigInt } from "../../shared/utils/serializer";
import { AppError } from "../../shared/errors";
import { toUserProfileResponseDto } from "../user/user.dto";

export class AuthController {
  constructor(private authServive: AuthService) {}

  register = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const parsed = registerSchema.parse(req.body);
      const user = await this.authServive.register(parsed);
      return res.status(201).json(
        successResponse(
          toUserResponseDto(serializeBigInt(user)), "User registered successfully"
        ), 
      );
    } catch (err) {
      next(err);
    }
  }

  login = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const parsed = loginSchema.parse(req.body);
      const { user, accessToken } = await this.authServive.login(parsed);
      return res.status(200).json(
        successResponse(
          toLoginResponseDto(serializeBigInt(user), accessToken), "Login successful"
        )
      );
    } catch (err) {
      next(err);
    }
  }

  me = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) throw new AppError(401, "Unauthorized");
      const user = await this.authServive.getMe(req.user.id);
      return res.status(200).json(
        successResponse(
          toUserProfileResponseDto(serializeBigInt(user)), "User profile"
        )
      )
    } catch (err) {
      next(err);
    }
  }
}