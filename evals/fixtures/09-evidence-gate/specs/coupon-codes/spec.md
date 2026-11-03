# Coupon Codes

Status: In Progress
Version: 1.0
Mode: Full
Level: M
Last updated: 2026-10-28

## Overview

Shoppers can apply one coupon code at checkout to reduce the order total.

## Handoff

- **Goal:** a valid coupon reduces the checkout total; an invalid one is rejected with a reason.
- **Done when:** `pnpm test tests/coupons.test.ts` passes; `validation.md` shows every `[MUST]` AC `pass`.
- **Permissions:** see Boundaries.
- **Isolation:** branch `feature/coupon-codes` off `main`.
- **Stop condition:** if a coupon rule needs a schema change, stop and write why in `decision_log.md`.

## Boundaries

**Always do:** validate the code before touching the total.

**Never do:** let a total go below zero.

## Acceptance Criteria

### AC-1: Percentage coupon [MUST]

Given a cart totalling 200.00 and the coupon `SAVE10` (10%), When it is applied, Then the total is 180.00.
**Proof:** test: `pnpm test tests/coupons.test.ts -t AC-1`

### AC-2: Expired coupon [MUST]

Given a coupon whose `expiresAt` is in the past, When it is applied, Then it is rejected with `COUPON_EXPIRED` and the total is unchanged.
**Proof:** test: `pnpm test tests/coupons.test.ts -t AC-2`

### AC-3: Floor at zero [MUST]

Given a fixed coupon larger than the cart total, When it is applied, Then the total is 0.00.
**Proof:** test: `pnpm test tests/coupons.test.ts -t AC-3`

## Out of Scope

- Stacking more than one coupon.
