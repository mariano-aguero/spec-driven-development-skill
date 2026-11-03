# Review: login-rate-limit

Reviewer: code critic (same session that implemented TASK-001 to TASK-004)

[ISSUE] [AC-1] Security [Bypass] [CONFIRMED] Rate limit can be bypassed by changing the email's letter case
[ISSUE] [AC-1] Security [Risk] [CONFIRMED] Possible race condition when two failed logins arrive at the same time
[ISSUE] [src/login.ts] Style [Naming] [CONFIRMED] `cnt` is an unclear name for a list of timestamps
[ISSUE] [AC-2] Correctness [Risk] [CONFIRMED] Window may not reset correctly across server restarts

4 issues (4 confirmed)
