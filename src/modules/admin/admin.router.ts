import { Router } from "express";
import * as adminController from "./admin.controller";
import { authMiddleware } from "../../middleware/auth.middleware";
import { adminMiddleware } from "../../middleware/admin.middleware";

const router = Router();

// Dashboard overview summary
router.get("/overview", authMiddleware, adminMiddleware, adminController.getOverview);

// Get recent transactions (latest N records)
router.get("/transactions", authMiddleware, adminMiddleware, adminController.getTransactions);

// Get trading volume grouped by currency
router.get("/volume", authMiddleware, adminMiddleware, adminController.getVolumeByCurrency);

// Check system health status
router.get("/system/health", authMiddleware, adminMiddleware, adminController.getSystemHealth);

export default router;