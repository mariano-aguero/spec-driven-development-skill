import { describe, expect, test } from 'vitest'
import { applyCoupon } from '../src/coupons'

const future = new Date('2099-01-01')
const past = new Date('2000-01-01')

describe('applyCoupon', () => {
  test('AC-1: percentage coupon', () => {
    const result = applyCoupon(200, { code: 'SAVE10', kind: 'percent', value: 10, expiresAt: future })
    expect(result).toEqual({ ok: true, total: 180 })
  })

  test('AC-2: expired coupon', () => {
    const result = applyCoupon(200, { code: 'OLD', kind: 'percent', value: 10, expiresAt: past })
    expect(result).toEqual({ ok: false, error: 'COUPON_EXPIRED', total: 200 })
  })

  test('AC-3: floor at zero', () => {
    const result = applyCoupon(30, { code: 'BIG', kind: 'fixed', value: 50, expiresAt: future })
    expect(result).toEqual({ ok: true, total: 0 })
  })
})
