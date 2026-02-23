import express from "express";
import cors from "cors";
import morgan from "morgan";
import adminRouter from "./modules/admin/admin.router"
import authRouter from "./modules/auth/auth.router";
import orderRouter from "./modules/order/order.router";
import transferRouter from "./modules/transfer/transfer.router"
import { errorHandler } from "./middleware/error.middleware";

const app = express();

// ====== Global Middleware ======
app.use(cors({
  origin: "http://localhost:3000"
}));
app.use(express.json());
app.use(morgan("dev")); // log http request

// ====== Routes ======
app.use("/dashboard", adminRouter);
app.use("/auth", authRouter);
app.use("/api/orders", orderRouter);
app.use("/transfer/", transferRouter)

// ====== Global Error Handler ======
app.use(errorHandler);

export default app;