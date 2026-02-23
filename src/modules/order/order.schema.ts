import { z } from 'zod'
import { decimalSchema } from '../../shared/decimal'

export const createOrderSchema = z.object({
  clientOrderId: z.string().min(1, "clientOrderId is required for idempotency"),
  currencyId: z.coerce.bigint(),
  orderType: z.enum(['BUY', 'SELL']),
  price: decimalSchema,
  amount: decimalSchema,
})

export const cancelOrderSchema = z.object({
  orderId: z.coerce.bigint()
})

export const getOrderByIdSchema = z.object({
  id: z.coerce.bigint(),
});

export const getOrderBookSchema = z.object({
  currencyId: z.coerce.bigint(),
});

export type GetOrderByIdInput = z.infer<typeof getOrderByIdSchema>

export type CreateOrderInput = z.infer<typeof createOrderSchema>

export type CancelOrderInput = z.infer<typeof cancelOrderSchema>
