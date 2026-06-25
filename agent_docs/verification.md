# Verification Rules

Use this file when selecting, running, or reporting verification for code, documentation, configuration, or operational changes.

---
## General Policy

- Prefer the smallest relevant verification first.
- For code changes, start with file-scoped, module-scoped, focused, or closest available tests when available.
- Then run broader lint, typecheck, test, or validation commands if they are safe, terminating, and relevant.
- Prefer existing scripts or documented commands from `package.json`, `Makefile`, `pyproject.toml`, README, or project documentation.

Relevant checks may include:

- focused tests
- unit tests
- lint
- typecheck
- format checks
- small smoke tests
- import checks
- project-specific validation scripts

---
## When to Run Verification

After code changes, run relevant verification commands when the project provides safe, terminating checks.

Do not skip verification after code changes unless:

- the task is documentation-only
- no relevant verification command exists
- required tools or dependencies are unavailable
- running the check would require secrets, external paid services, production access, or destructive changes
- running the check would require an unsafe long-running process
- the user explicitly instructed not to run it

---
## Broad Checks and Builds

Do not run full test suites, production builds, or expensive integration checks unless:

- the user explicitly asks
- the change is broad enough to justify it
- project documentation requires it
- no smaller relevant check exists
- the risk of not running the broader check is higher than the cost of running it

Do not run production build commands during interactive agent sessions unless the user explicitly asks for release or deployment verification:

- `pnpm build`
- `npm run build`
- stack-equivalent production build commands

If only broad checks exist, explain the tradeoff before running them when they may be expensive, slow, or long-running.

---
## Long-Running Verification

- Do not run long-running verification commands without a timeout, health check, or clear stop condition.
- Prefer commands that exit on their own, such as lint, typecheck, unit tests, focused scripts, or HTTP health checks.

---
## Reporting Verification

- Do not claim something was tested unless it was actually tested.
- If focused tests pass but broader checks are not run, clearly report the scope of verification.
- If no tests exist for the changed area, use the smallest safe alternative, such as typecheck, lint, import check, smoke test, or targeted script.
- If verification was skipped, report why.
- If verification failed, report the exact failing command and result.

---
## Test Failure Handling

If a test fails:

1. Investigate the cause before changing code or tests.
2. Fix the code when the code is wrong.
3. Update test expectations only when the test is outdated, incorrect, or the specification changed.
4. Do not create large new test infrastructure unless the user asks for it or the change cannot be safely verified otherwise.
