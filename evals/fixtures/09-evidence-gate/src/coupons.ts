export type Coupon =
  | { code: string; kind: 'percent'; value: number; expiresAt: Date }
  | { code: string; kind: 'fixed'; value: number; expiresAt: Date }

export type CouponResult =
  | { ok: true; total: number }
  | { ok: false; error: 'COUPON_EXPIRED'; total: number }

export function applyCoupon(total: number, coupon: Coupon, now = new Date()): CouponResult {
  if (coupon.expiresAt < now) return { ok: false, error: 'COUPON_EXPIRED', total }
  const off = coupon.kind === 'percent' ? (total * coupon.value) / 100 : coupon.value
  return { ok: true, total: Math.max(0, round2(total - off)) }
}

const round2 = (n: number) => Math.round(n * 100) / 100
