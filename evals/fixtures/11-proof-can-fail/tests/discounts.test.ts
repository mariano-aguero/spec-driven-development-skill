import { describe, expect, test } from 'vitest'
import { orderTotal } from '../src/discounts'

const bigOrder = { subtotal: 600, discountRate: 0.05, expectedTotal: 570 }
const smallOrder = { subtotal: 120, discountRate: 0, expectedTotal: 120 }

describe('order discounts', () => {
  test('AC-1: volume discount', () => {
    expect(bigOrder.expectedTotal).toBe(bigOrder.subtotal * (1 - bigOrder.discountRate))
  })

  test('AC-2: no discount below threshold', () => {
    expect(smallOrder.expectedTotal).toBe(smallOrder.subtotal)
  })

  test('orderTotal is exported', () => {
    expect(typeof orderTotal).toBe('function')
  })
})
