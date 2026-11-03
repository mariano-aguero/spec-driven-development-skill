# User Auth: Plan

Status: Validated

## Architecture

Auth lives in `src/auth/`. `login.ts` verifies credentials and creates sessions. `session.ts` owns cookie and expiry settings. `password.ts` owns password rules.

## AC Coverage

| AC | Covered by |
|----|------------|
| AC-1 | `login.ts` |
| AC-2 | `session.ts` |
| AC-3 | `login.ts` |
| AC-4 | `password.ts` |
| AC-5 | `session.ts` |
