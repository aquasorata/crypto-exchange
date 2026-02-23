import { z } from 'zod'
import Decimal from 'decimal.js'

Decimal.set({
  precision: 20,
  rounding: Decimal.ROUND_DOWN
})

export const toDecimal = (value: string | number | Decimal) => {
  return new Decimal(value)
}

export const add = (a: Decimal, b: Decimal) => a.plus(b)
export const sub = (a: Decimal, b: Decimal) => a.minus(b)
export const mul = (a: Decimal, b: Decimal) => a.times(b)
export const div = (a: Decimal, b: Decimal) => a.div(b)

export const decimalSchema = z
  .string()
  .refine((val) => {
    try {
      const d = toDecimal(val)
      return d.isPositive() && d.decimalPlaces() <= 8
    } catch {
      return false
    }
  }, 'Invalid decimal value')
  .transform((val) => toDecimal(val));