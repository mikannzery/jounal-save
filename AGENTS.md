# AGENTS.md

This file defines default working rules for AI coding agents in this repository.

The goal is to keep changes safe, minimal, reviewable, and well verified across different project stacks such as Next.js, Node.js, Python, local AI tools, desktop apps, bridge processes, and documentation-heavy projects.

---
## Priority Rules

When rules conflict, follow this priority order:

1. Security and secret protection
2. User instructions
3. Existing project specifications in `spec.md`
4. Current code behavior
5. Minimal, safe implementation
6. Verification and reporting

If a requested action conflicts with these rules, stop and explain the conflict before proceeding.

Clarifications:

- Preserve current code behavior unless the user request or `spec.md` requires a change.
- Choose the smallest safe change that satisfies the request.
- Verification is required, but it must not override security, user instructions, or safe process handling.

---
## Reference Documents

- Read `SECURITY.md` before security-sensitive work when it exists.
- If `SECURITY.md` and this file conflict, follow the stricter security rule.
- Treat `spec.md` as the source of truth for intended project behavior when it exists.
- Treat `history.md` as implementation history, work log, and remaining-task notes when it exists.
- If `history.md` conflicts with current code or `spec.md`, treat `spec.md` and current code as higher priority.
- Do not reintroduce old behavior from `history.md` unless the user explicitly requests it or `spec.md` confirms that the old behavior is still required.

Detailed reference rules:

- Documentation: `agent_docs/documentation.md`
- Command, dependency, process, and generated-file safety: `agent_docs/command-safety.md`
- Modern Web Guidance: `agent_docs/modern-web-guidance.md`
- Verification: `agent_docs/verification.md`
- Error handling: `agent_docs/error-handling.md`

Read the detailed file only when it is relevant to the current task.

---
## Core Working Rules

- Before making changes, check the current working tree with `git status --short` when Git is available.
- Do not modify files that already have unrelated user changes unless the task requires it.
- If existing unrelated changes are present, preserve them and mention them in the final report.
- Do not break existing code.
- Make minimal, diff-based changes.
- Touch only the files necessary for the requested task.
- Do not refactor unrelated code.
- Do not remove existing functionality unless explicitly requested.
- Do not rename files, symbols, routes, tables, commands, configuration keys, or public APIs unless necessary.
- Do not make speculative fixes; when a failure occurs, follow `agent_docs/error-handling.md`.
- Ask questions only when ambiguity blocks safe implementation.
- If ambiguity is minor, state the assumption and proceed with the simplest safe option.

---
## Documentation

- Check `README.md`, `ARCHITECTURE.md`, `spec.md`, and `history.md` before starting work when they exist and are relevant.
- Treat `README.md` as the user-facing setup, usage, command, and operation guide.
- Treat `ARCHITECTURE.md` as the system structure, data flow, service boundary, and major design decision guide.
- Update documentation only when the task changes behavior, setup, commands, architecture, data flow, security boundaries, external integrations, or operation steps.
- Keep documentation updates minimal, factual, and directly related to the task.
- For detailed documentation creation/update rules, read `agent_docs/documentation.md`.

---
## Security

- Do not read `.env` files.
- You may read `.env.example`, README, and documentation files to understand required environment variable names.
- Never expose secrets, tokens, API keys, private keys, cookies, session values, credentials, or personally sensitive data.
- Never print actual secret values.
- Never hardcode credentials or API keys.
- Do not weaken authentication, authorization, validation, rate limits, sandboxing, or access control without explicit approval.
- Do not apply production database migrations, modify production data, change cloud settings, rotate keys, or alter external service configuration unless explicitly requested.
- For database schema changes, update migration or schema files first and report the exact manual steps required to apply them.
- Read `SECURITY.md` before making security-sensitive changes when it exists.

---
## Dependencies and Commands

- Prefer the package manager or dependency manager already used by the project.
- Do not switch dependency managers without explicit approval.
- Do not add dependencies unless necessary and justified.
- Do not run force, global, destructive, broad repair, cache deletion, lockfile deletion, or database reset commands unless explicitly approved when risky.
- Do not run `npm audit fix --force`.
- If a required tool is not found, stop and report the missing tool instead of installing it globally.
- Do not edit or commit generated files, build outputs, caches, dependency folders, temporary files, secrets, or local environment files unless the task explicitly requires it.
- For detailed dependency, command, long-running process, and generated-file rules, read `agent_docs/command-safety.md`.

---
## Rust Development Rules

Apply these rules when the task touches an existing Rust project, Rust crate, `Cargo.toml`, Rust source files, or when the user explicitly requests Rust.

These rules do not require converting existing Python, TypeScript, JavaScript, or other-language projects to Rust. Preserve the existing project stack unless the user explicitly requests a language migration or a new Rust component. Do not propose or start a Rust rewrite of an existing non-Rust project unless the user explicitly asks for it.

- Prefer safe, idiomatic, minimal Rust changes that preserve existing behavior.
- Do not introduce `unsafe` code unless it is strictly necessary. If `unsafe` is required, explain why, document the safety assumptions, and keep the unsafe block as small as possible.
- Do not use `unwrap()` or `expect()` in production code unless failure is impossible by construction or the surrounding code already uses that style. Prefer returning `Result`, using `?`, or handling the error explicitly.
- Preserve existing public APIs, module boundaries, CLI arguments, config keys, database schemas, and serialized formats unless the task explicitly requires a change.
- Prefer clear types and small functions over clever abstractions.
- Avoid unnecessary `clone()`, `Arc<Mutex<_>>`, global mutable state, and broad lifetime workarounds. If these are needed, keep the reason clear and local.
- Do not add new crates unless necessary. Prefer the standard library or existing dependencies when reasonable.
- When adding a crate, explain why it is needed and choose a mature, maintained crate with minimal feature flags.
- Keep Cargo feature changes minimal. Do not enable broad default features unless they are required.
- Do not edit `Cargo.lock` manually.
- Do not commit `target/`, generated binaries, caches, temporary files, or local tool output.
- For async Rust, use the runtime already used by the project. Do not introduce a new async runtime unless explicitly required.
- Avoid blocking operations inside async tasks unless they are moved to an appropriate blocking thread or the existing project pattern allows it.
- For filesystem, network, database, and external-process code, use explicit error context so failures are diagnosable.
- For FFI or C/C++ interop, isolate unsafe boundaries, validate inputs and ownership assumptions, and keep safe wrappers around unsafe code.
- For long-running Rust services, prefer health checks, short smoke tests, or commands that exit on their own for verification.
- After Rust changes, prefer the smallest relevant verification first, such as `cargo check`, targeted `cargo test`, or package-specific checks documented by the project.
- Use `cargo clippy` when it is already part of the project workflow or when the change affects non-trivial Rust logic.
- Do not claim Rust verification passed unless the command was actually run.

---
## Modern Web Guidance

For frontend or browser-facing work, check whether Modern Web Guidance is available when the task touches UI, CSS, HTML, forms, accessibility, image loading, client-side JavaScript, browser APIs, responsive layout, or web performance.

Preferred paths:

- `.agents/skills/modern-web-guidance/SKILL.md`
- `C:\Users\youno\.agents\skills\modern-web-guidance\SKILL.md` when running in the user's Windows local Codex app environment and the file exists
- `~/.agents/skills/modern-web-guidance/SKILL.md` when running in a Linux local environment and the file exists

If relevant and available, read `SKILL.md` before choosing the implementation approach.

Report Modern Web Guidance status in the final report for frontend or browser-facing tasks:

- used
- unavailable
- not relevant

For detailed usage limits and safety rules, read `agent_docs/modern-web-guidance.md`.

---
## Development Workflow

- Use development mode only when needed for verification.
- Treat dev servers, watchers, bridge processes, bots, websocket servers, HTTP servers, local databases, local AI/service processes, and desktop-app helper processes as long-running commands.
- Do not leave long-running commands running in the foreground indefinitely.
- Prefer commands that exit on their own, health checks, short smoke tests, or log inspection.
- If a local service is required, first check whether it is already running with a health check or heartbeat endpoint when available.
- Do not repeatedly restart long-running commands without a specific reason.
- For detailed process rules, read `agent_docs/command-safety.md`.

---
## Verification

- Prefer the smallest relevant verification first.
- Use existing scripts or documented commands from `package.json`, `Makefile`, `pyproject.toml`, README, or project documentation.
- After code changes, run relevant verification commands when safe, terminating checks are available.
- Do not run production build commands during interactive agent sessions unless the user explicitly asks for release or deployment verification.
- Do not claim something was tested unless it was actually tested.
- Report skipped or partial verification clearly.
- For detailed verification rules, read `agent_docs/verification.md`.

---
## Error Handling

- Do not run the same failing command more than twice.
- Retry only after changing code, configuration, dependencies, service state, or command arguments.
- If the same command fails twice, stop retrying and diagnose before applying fixes.
- Do not loop through random fixes.
- Prefer reading logs, checking configuration, inspecting changed files, and narrowing the cause before retrying.
- For the full diagnosis format, read `agent_docs/error-handling.md`.

---
## Git Rules

- Keep changes focused and atomic.
- Do not overwrite user changes.
- Do not force-push unless explicitly instructed.
- Do not use destructive Git commands unless explicitly approved.
- Review changed files before final reporting.
- Do not commit generated files, dependency folders, build outputs, caches, temporary files, secrets, or local environment files.

---
## Final Report

After completing work, report:

1. files changed
2. summary of changes
3. verification commands actually run and their results
4. verification not run and why, if applicable
5. remaining risks or limitations
6. follow-up work if needed
7. Modern Web Guidance status for frontend or browser-facing work

Do not claim success without verification.
Do not hide failed checks.
Clearly separate completed work from recommendations.
