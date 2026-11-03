# Order Discounts

Status: In Progress
Version: 1.0
Mode: Full
Level: M
Last updated: 2026-10-29

## Overview

Orders over a threshold get a volume discount applied at checkout.

## Handoff

Goal: Orders of 500.00 or more get 5% off, rounded to cents; smaller orders pay the subtotal.
Done when:

- [ ] `pnpm test tests/discounts.test.ts` exits 0 (AC-1, AC-2)
Isolation: branch `feature/order-discounts` off `main`
Permissions: edit `src/discounts.ts` and `tests/` only
Stop if: the discount needs data beyond the subtotal. Then stop and write why in decision_log.md

## Acceptance Criteria

### AC-1: Volume discount [MUST]

Given an order subtotal of 500.00 or more, When the total is computed, Then a 5% discount is
applied and the total is rounded to cents.
**Proof:** test: `pnpm test tests/discounts.test.ts -t AC-1`

### AC-2: No discount below threshold [MUST]

Given an order subtotal under 500.00, When the total is computed, Then the total equals the
subtotal.
**Proof:** test: `pnpm test tests/discounts.test.ts -t AC-2`

## Out of Scope

- Coupon codes.
