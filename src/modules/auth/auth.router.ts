import { Router } from "express";
import { authMiddleware } from "../../middleware/auth.middleware";
import { AuthModule } from "./auth.module";

const { authController } = AuthModule()

const router = Router();

// Register new user
router.post("/register", authController.register);

// Login user and receive JWT
router.post("/login", authController.login);

// Get current authenticated user profile
router.get("/me", authMiddleware, authController.me);

export default router;