# AGENTS.md — Spectres Web Client

> This document is for coding agents working on the project. It defines the project background, the position of this subproject within the Spectres system, its scope, and its development conventions.
>
> Last updated: 2026-09-20

---

## 1. Project Background

**Spectres** is an AI personal assistant system. Users interact with AI agents through natural language to complete daily tasks, retrieve information, control devices, and automate routines.

The system is split into three layers:

- **Client** (this repository): user-facing UI.
- **Runtime** (sibling project `../Spectres-Runtime`): agent core runtime on Agno AgentOS — orchestration, tools, memory, security policy.
- **Edge** (future): home-LAN device gateway.

**Spectres-Web-Client** is the first Client-layer project: a web application through which the user chats with the Runtime's Master Agent. For the full product vision (Master/Slave agents, long-term user profiles, multi-tenant future), read the Runtime project's [`AGENTS.md`](../Spectres-Runtime/AGENTS.md) and [`docs/architecture.md`](../Spectres-Runtime/docs/architecture.md) first.

---

## 2. Position in the Architecture

```
Browser (this app, static SPA)
        │  AG-UI over HTTP(S) — configurable endpoint
        ▼
Spectres Runtime (AgentOS, POST /agui, SSE event stream)
```

- **Protocol**: AG-UI only. The app connects **directly** to the Runtime's `/agui` endpoint. There is no backend-for-frontend, no CopilotKit Runtime, no CopilotKit Cloud, no API keys.
- **Independent app**: the client serves its own static files and calls the Runtime **cross-origin** (CORS is configured Runtime-side). The Runtime never hosts this app.
- **Endpoint-configurable**: the agent endpoint URL comes from an environment variable (`VITE_AGENT_ENDPOINT`, default `http://localhost:7777/agui`) — the same mechanism in development and production. Deployment location is a variable, not an architecture decision (Runtime ADR 0005).

### 2.1 MVP Topology (current milestone)

Everything runs on a single home PC: Runtime on `localhost:7777`, this app on its own local port (dev server or a static file server over `dist/`), browser on the same machine. No tunneling, no remote access, no cloud.

### 2.2 Deployment Evolution (context, not current work)

Later phases add Tailscale/overlay access from the owner's other devices, then a cloud entry point when mini-program, public access, or multi-tenancy requires it. This app must remain deployable in any of these shapes by changing only `VITE_AGENT_ENDPOINT`. See Runtime ADR 0005.

---

## 3. Scope

### 3.1 Core Capabilities (long-term direction)

1. **Conversation UI**: streaming chat with the Master Agent, message history rendering, markdown display.
2. **Agent activity visibility**: tool-call rendering (generic cards now; dispatch cards and per-Slave expandable subtasks later, per Runtime ADR 0004).
3. **Human-in-the-loop**: confirmation UIs for sensitive agent actions (once the Runtime registers confirmation-gated tools).
4. **Thread management**: continue, list, and start conversations backed by the Runtime's session store.
5. **Proactive updates** (future): a notification/updates stream for automation results, separate from the chat thread (Runtime ADR 0003).

### 3.2 Current Milestone (v0.1.0 — MVP, completed)

One page, one chat: streaming over AG-UI, built-in generic tool-call renderer, `thread_id` persisted in `localStorage` with a "New conversation" button. Completed per [`docs/plan/v0.1.0-mvp-chat-client.md`](docs/plan/v0.1.0-mvp-chat-client.md).

### 3.3 Explicitly Out of Scope

The following belong to other layers or later milestones:

- **Agent logic, tools, memory, persistence**: the Runtime layer. This app contains no business logic beyond presentation concerns.
- **Backend services of any kind**: no BFF, no server-side state; the only server is the Runtime.
- **Authentication / multi-tenancy**: deferred (single-user phase).
- **Mini-program and native mobile apps**: separate future projects; design choices here must not preclude them.

---

## 4. Design Principles

1. **Minimalism**: the smallest code and architecture that satisfies the milestone goal. No state-management library, no router, no UI component library beyond what the milestone requires. Add structure only when a milestone forces it.
2. **Protocol over vendor**: AG-UI is the contract. CopilotKit is used purely as an open-source (MIT) React component library; nothing in its commercial offerings (CopilotKit Cloud / Intelligence) may be introduced.
3. **Phase-1 visibility** (Runtime ADR 0004): single assistant voice; tool calls use the built-in generic renderer. Custom cards arrive in later milestones with concrete requirements.
4. **Presentation-only state**: local UI state (theme, draft input, `thread_id` in `localStorage`) is fine; anything durable belongs to the Runtime via AG-UI.

---

## 5. Tech Stack

| Concern | Choice | Notes |
|---------|--------|-------|
| Build tool | Vite | `react-ts` template |
| Framework | React 19 + TypeScript | Strict mode |
| Agent communication | CopilotKit React SDK (direct AG-UI) | MIT; wiring per official "connect AG-UI agents" docs |
| Styling | Tailwind CSS | Layout only in v0.1.0; CopilotKit components are themselves Tailwind-styled |
| Toolchain runtime | Node.js | **Build-time only** (bundler + dev server); production serves static files, no Node process |
| Package manager | npm | Lockfile committed |

Deliberately **not** used (v0.1.0): Next.js, state-management libraries, shadcn/ui, test frameworks, CopilotKit Runtime/Cloud.

---

## 6. Development Guidelines

- **Language**: TypeScript; keep `strict` mode clean, avoid `any`.
- **Configuration**: Environment variables via Vite (`VITE_*`), documented in `.env.example`. Secrets must not be committed (this app should never need any).
- **Quality gates**: `npm run lint` and `npm run typecheck` must pass. Tests are introduced in a later milestone; until then, manual verification steps are recorded in each milestone plan.
- **Verification**: every milestone ends with a browser walkthrough against a locally running Runtime with the real LLM; steps live in the milestone plan.
- **Milestone plans**: Write `docs/plan/vX.Y.Z-*.md` before coding, using the Runtime project's template style; keep status field current.

---

## 7. Confirmed Decisions

The following decisions are confirmed by the project owner (derived from the Runtime project's ADRs, which remain the canonical records):

1. **AG-UI only**: the app talks to the Runtime exclusively via AG-UI over HTTP(S); no framework-private protocols.
2. **Direct connection**: no CopilotKit Runtime, no CopilotKit Cloud, no API keys; CopilotKit is an MIT-licensed component library only.
3. **Independent app**: the client serves itself and calls the Runtime cross-origin; the Runtime does not host it.
4. **Endpoint-configurable**: `VITE_AGENT_ENDPOINT` is the single configuration mechanism for all environments.
5. **Single-PC MVP**: the first milestone targets one home PC with no tunneling or remote access.
6. **Phase-1 visibility**: flattened single-voice stream, generic tool-call renderer; per-Slave transparency is deferred to a later milestone with a custom AG-UI event mapping on the Runtime side.

---

## 8. Agent Conventions

Behavior expectations for coding agents working on this project:

- **Language for code and docs**: Write all code comments, documentation, and commit messages in **English**.
- **Language for user conversation**: When interacting with the project owner, respond in **Chinese**.
- **Version control**: Do **not** run `git commit`, `git push`, `git reset`, `git rebase`, or any other git mutation without explicit user permission. Ask for confirmation each time.
- **Commit messages**: See Section 9 for detailed conventions.

---

## 9. Commit Message Conventions

All commit messages must be written in **English** and follow the [Conventional Commits](https://www.conventionalcommits.org/) specification.

### 9.1 Format

```text
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

### 9.2 Common Types

| Type | Use when |
|------|----------|
| `feat` | Adding a new feature |
| `fix` | Fixing a bug |
| `docs` | Changing documentation only |
| `style` | Formatting, semicolons, etc.; no code logic change |
| `refactor` | Code change that neither fixes a bug nor adds a feature |
| `perf` | Improving performance |
| `test` | Adding or correcting tests |
| `chore` | Build process, tooling, dependency updates, etc. |
| `ci` | CI/CD configuration changes |

### 9.3 Description Rules

- Use the imperative mood and present tense (e.g., `add`, `fix`, `update`).
- Start with a lowercase letter.
- Do not end with a period.
- Keep the subject line within 50 characters when possible.

### 9.4 Body and Footer

- **Body** (optional): explain the **why** and **what**, wrapped at 72 characters.
- **Footer** (optional): reference issues (`Fixes #123`) or describe breaking changes (`BREAKING CHANGE: ...`).

### 9.5 Examples

```text
feat(chat): add new conversation button

Reset the AG-UI thread id so users can start a fresh conversation
without clearing site data manually.
```

```text
chore(deps): bump vite from 6 to 7
```

---

## 10. References

- Frontend architecture (living document): [`docs/frontend-architecture.md`](docs/frontend-architecture.md)
- Milestone plans: [`docs/plan/`](docs/plan/)
- Runtime project (canonical architecture): `../Spectres-Runtime`
  - [`AGENTS.md`](../Spectres-Runtime/AGENTS.md)
  - [`docs/architecture.md`](../Spectres-Runtime/docs/architecture.md)
  - [`docs/adr/`](../Spectres-Runtime/docs/adr/README.md) — especially ADR 0004 (AG-UI visibility) and ADR 0005 (deployment topology)
- CopilotKit — connect AG-UI agents: https://docs.copilotkit.ai/backend/ag-ui
- AG-UI protocol: https://docs.ag-ui.com/
- Agno AG-UI interface: https://docs.agno.com/agent-os/interfaces/ag-ui/introduction
- Repository: current directory `Spectres-Web-Client`
