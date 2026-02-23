import { OrderService } from "./order.service";
import { OrderController } from "./order.controller";

export const OrderModule = () => {
  const orderService = new OrderService();
  const orderController = new OrderController(orderService);

  return { orderController };
};