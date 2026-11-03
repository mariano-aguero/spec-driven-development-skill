# Order Discounts

Status: In Progress
Version: 1.0
Mode: Full
Level: M
Last updated: 2026-10-29

## Overview

Orders over a threshold get a volume discount applied at checkout.

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
