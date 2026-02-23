import { Router } from "express";
import { TransferModule } from "./transfer.module";
import { authMiddleware } from "../../middleware/auth.middleware";

const { transferController } = TransferModule();

const router = Router();

// Internal transfer between users
router.post("/internal", authMiddleware, transferController.internalTransfer);

// External withdrawal transfer
router.post("/external", authMiddleware, transferController.externalTransfer);

export default router;