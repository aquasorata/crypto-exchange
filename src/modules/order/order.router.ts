import { Router } from "express";
import { authMiddleware } from "../../middleware/auth.middleware";
import { OrderModule } from "./order.module";

const { orderController } = OrderModule();

const router = Router();

// Create new order (BUY / SELL)
router.post("/", authMiddleware, orderController.create);

// Cancel order
router.delete("/", authMiddleware, orderController.cancel);

// Get order by ID
router.get("/:id", authMiddleware, orderController.getOrderById);

// Get order book by currency
router.get("/book/:currencyId", orderController.getOrderBook);

export default router;