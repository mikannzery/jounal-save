# Error Handling Policy

Use this file when a command, test, script, server, integration, or implementation attempt fails.

---
## Core Rule

Do not fight the same error repeatedly.

- Do not run the same failing command more than twice.
- Do not retry a command unless something has changed since the previous attempt.
- Before retrying, state what changed and why the retry is expected to produce a different result.
- If the same command fails twice, stop retrying it and switch to diagnosis.

---
## Diagnosis Format

When repeated failure occurs, diagnose with:

1. the exact error message or symptom
2. the likely root cause
3. 3-5 possible fixes using available sources
4. tradeoffs and risks
5. the simplest safe fix to try next

---
## Avoid Random Fixes

Do not loop through random fixes.

Do not repeatedly do these actions without a specific reason:

- restart dev servers
- reinstall dependencies
- clear caches
- reset databases
- delete lockfiles
- rerun builds
- change unrelated files

Prefer:

- reading logs
- checking configuration
- inspecting changed files
- narrowing the cause
- running focused checks

If web access is unavailable, report that limitation and use local documentation, repository context, and known error context instead.
