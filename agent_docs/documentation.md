# Documentation Rules

Use this file when the task may affect documentation, project behavior, setup, architecture, operation, or handoff notes.

---
## Files and Roles

- `README.md`: user-facing setup, usage, commands, operation, and troubleshooting guide.
- `ARCHITECTURE.md`: system structure, data flow, service boundaries, persistence, external integrations, and major runtime behavior.
- `spec.md`: source of truth for intended behavior.
- `history.md`: implementation history, work log, verification notes, and remaining tasks.

---
## Read Rules

- Check `README.md`, `ARCHITECTURE.md`, `spec.md`, and `history.md` before starting work when they exist and are relevant to the task.
- If `history.md` conflicts with current code or `spec.md`, treat `spec.md` and current code as higher priority.
- Do not reintroduce old behavior from `history.md` unless the user explicitly requests it or `spec.md` confirms that the old behavior is still required.

---
## Creation Rules

Do not create large documentation files for tiny changes.

Create a minimal `README.md` when:

- starting a new project
- adding a runnable application
- changing setup or usage commands
- completing a user-owned project handoff

Create a minimal `ARCHITECTURE.md` when:

- the project has multiple modules, services, data flows, integrations, local AI processes, bridges, databases, or non-trivial runtime architecture
- the task changes system structure, persistence, service boundaries, or major runtime behavior

Create a minimal `spec.md` before or during the first behavior-changing implementation task if it does not exist.

Create a minimal `history.md` when implementation work is completed if it does not exist.

---
## Update Rules

Update `README.md` when the task changes:

- setup
- commands
- environment assumptions
- usage flow
- operation steps
- troubleshooting steps

Update `ARCHITECTURE.md` when the task changes:

- system structure
- data flow
- service boundaries
- persistence
- external integrations
- security boundaries
- major runtime behavior

Update `spec.md` when the task changes intended behavior.

Update `history.md` after completed implementation work with:

- what changed
- files changed
- verification performed
- remaining risks or tasks

---
## Style Rules

- Keep documentation minimal, factual, and directly related to the current project and task.
- Do not invent broad product requirements, future roadmap items, or speculative architecture.
- Do not rewrite large documentation files for small changes unless the task requires it.
- Prefer narrow patches over broad reorganization.
