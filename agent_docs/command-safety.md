# Command, Dependency, Process, and Generated-File Safety

Use this file when the task touches dependencies, commands, local processes, generated files, build outputs, caches, external services, or tool execution.

---
## Dependency Rules

Prefer the package manager or dependency manager already used by the project.

Determine the dependency manager from existing lockfiles, project files, and scripts:

- `pnpm-lock.yaml` => `pnpm`
- `package-lock.json` => `npm`
- `yarn.lock` => `yarn`
- `bun.lockb` or `bun.lock` => `bun`
- `uv.lock` => `uv`
- `poetry.lock` => `poetry`
- `pdm.lock` => `pdm`
- `requirements.txt` => `pip`
- `pyproject.toml` alone => inspect its contents and project documentation before choosing a tool

Rules:

- Do not switch dependency managers without explicit approval.
- Do not introduce a new lockfile for a different dependency manager.
- Do not add new dependencies unless absolutely necessary.
- Before adding or upgrading a dependency, report:
  1. package name
  2. purpose
  3. why existing code or dependencies cannot solve it
  4. security concerns or uncertainty
- Do not install newly published or suspicious packages without careful justification.
- Do not automatically approve dependency build scripts.
- Do not run `npm audit fix --force`.
- Do not delete or regenerate lockfiles to fix dependency problems unless explicitly approved.
- Do not mix dependency upgrades, framework migrations, and feature work unless explicitly requested.
- After dependency changes, inspect and report lockfile changes.
- If dependency or supply-chain risk is relevant, read `SECURITY.md` when it exists.

---
## Tool and Command Safety

- Do not hallucinate command names, flags, or options.
- If unsure about a command's syntax, check one of the following before running it:
  - the command's `--help`
  - project README or documentation
  - existing package scripts
  - official documentation when available
- Do not run force, global, destructive, or broad repair commands unless they are specifically justified and explicitly approved when risky.

Risky command examples:

- `npm install --force`
- `npm audit fix --force`
- global package installation
- cache deletion
- lockfile deletion
- database reset
- destructive Git commands

If a required tool such as `pnpm`, `uv`, `poetry`, `pytest`, or another project-specific tool is not found, stop and report the missing tool instead of installing it globally.

Use exact tool versions specified in project configuration when present, such as:

- `package.json` `engines`
- `.node-version`
- `.nvmrc`
- `.python-version`
- `pyproject.toml`
- tool-specific config files

---
## Long-Running Process Rules

Use development mode only when it is needed for verification.

Treat these as long-running commands:

- dev servers
- watchers
- bridge processes
- bots
- websocket servers
- HTTP servers
- local database processes
- local vector database processes
- local AI/service processes
- desktop-app helper processes

Examples include:

- `npm run dev`
- `pnpm dev`
- `next dev`
- `vite dev`
- `node index.js`
- `node index.js --source-http`
- `tsx watch`
- `nodemon`
- `python main.py`
- `python app.py`
- `uvicorn`
- `fastapi dev`
- `flask run`
- `streamlit run`

Rules:

- Do not run long-running commands unless needed for verification.
- Before running a long-running command, explain why it is needed and what output or behavior will confirm success.
- Do not leave long-running commands running in the foreground indefinitely.
- When possible, use a timeout, short test mode, health-check command, one-shot verification command, or log inspection instead.
- If a long-running command must be started, stop it after the needed verification is complete.
- Do not repeatedly restart long-running commands without changing code, configuration, dependencies, service state, or command arguments.
- If a long-running command blocks further work, stop it and switch to log inspection or targeted checks.
- For local database or service processes, first check whether the service is already running with a health check or heartbeat endpoint when available.
- Do not start local database or service processes in the foreground for long-running use.
- If a service is not running and is required, either ask the user to start it in a separate terminal or start it as a separate process only when the task requires it.
- If starting a separate process, record enough information to stop it later, verify health, and stop it after verification when appropriate.

---
## Generated Files and Commit Exclusions

Do not edit generated files, build outputs, caches, dependency folders, temporary files, secrets, or local environment files unless the task explicitly requires it.

Never treat generated files as the source of truth when source files are available.

Never commit generated files, dependency folders, build outputs, caches, temporary files, secrets, or local environment files.

Common excluded examples include:

- `node_modules`
- `.next`
- `dist`
- `build`
- `coverage`
- `.turbo`
- `.cache`
- `.pytest_cache`
- `.mypy_cache`
- `.ruff_cache`
- `__pycache__`
- `*.pyc`
- temporary files
- `.env`
- secrets
- tokens
- API keys

Adjust ignored, generated, and cache examples according to the project stack.
