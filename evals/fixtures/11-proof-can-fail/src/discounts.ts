const THRESHOLD = 500
const RATE = 0.05

export function orderTotal(subtotal: number): number {
  if (subtotal < THRESHOLD) return subtotal
  return Math.round(subtotal * (1 - RATE) * 100) / 100
}
