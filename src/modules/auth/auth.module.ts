import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";

export const AuthModule = () => {
  const authService = new AuthService();
  const authController = new AuthController(authService);

  return { authController };
}