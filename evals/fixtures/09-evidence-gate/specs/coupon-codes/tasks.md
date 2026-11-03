# Task List: Coupon Codes

## Tasks

- [x] **TASK-001** [S] Write tests for `applyCoupon` (AC-1, AC-2, AC-3)
  Creates: tests/coupons.test.ts
- [ ] **TASK-002** [S] Implement `applyCoupon`
  Satisfies: AC-1, AC-2, AC-3
  Modifies: src/coupons.ts
  Depends on: TASK-001
- [ ] **TASK-003** [S] Wire `applyCoupon` into `POST /checkout`
  Satisfies: AC-1
  Modifies: src/checkout.ts
  Depends on: TASK-002
