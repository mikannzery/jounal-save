# Modern Web Guidance Rules

Use this file for frontend or browser-facing work that touches UI, CSS, HTML, forms, accessibility, image loading, client-side JavaScript, browser APIs, responsive layout, or web performance.

---
## Availability Check

Treat Modern Web Guidance as optional local or repository documentation, not as a required CLI command, package, or project dependency.

Preferred repository-local path:

- `.agents/skills/modern-web-guidance/SKILL.md`

User-level paths may also exist:

- Windows local Codex app environment: `C:\Users\youno\.agents\skills\modern-web-guidance\SKILL.md`
- Linux local environment: `~/.agents/skills/modern-web-guidance/SKILL.md`

Use a user-level path only when that file actually exists in the current environment.

---
## Usage Rules

If a Modern Web Guidance skill is available and relevant to the task:

1. Read `SKILL.md` before choosing the implementation approach.
2. Search its guide/reference files with filename matching and content search such as `rg`.
3. Prefer Baseline-compatible native web platform features where they fit the project constraints.
4. Apply guidance in a way that preserves existing project behavior and style.

---
## Prohibited Actions

Do not run the `modern-web-guidance` CLI command just to use Modern Web Guidance.

Do not use any of the following just to use Modern Web Guidance unless the user explicitly approves it for the current task:

- `npx`
- `@latest`
- `npm install`
- global package installation
- dependency changes
- package file changes
- lockfile changes
- `node_modules` changes
- project configuration changes

---
## If Unavailable

If Modern Web Guidance is unavailable in the current environment:

1. Report that it was unavailable.
2. Proceed using existing project patterns, local repository documentation, stable web platform knowledge, and the most conservative safe implementation.

---
## Final Report

For frontend or browser-facing tasks, include Modern Web Guidance status in the final report:

- `used`: skill was available, read, and applied
- `unavailable`: task was relevant, but the skill was not available
- `not relevant`: task did not touch frontend or browser-facing behavior

If used, briefly mention the relevant guidance applied.
