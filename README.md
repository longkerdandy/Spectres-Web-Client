# Spectres Web Client

Web client for the Spectres AI personal assistant. A static single-page
application that chats with the Spectres Runtime Master Agent over the AG-UI
protocol, with streaming replies and visible tool calls.

## Prerequisites

- Node.js 24 LTS (any `>=20.19` works; `.nvmrc` pins 24 for fnm/nvm users)
- [Spectres Runtime](../Spectres-Runtime) running on `localhost:7777` with:
  - the AG-UI endpoint exposed (`POST /agui`)
  - `CORS_ALLOWED_ORIGINS` including this app's origin
    (dev default: `http://localhost:3000`)
  - a configured LLM provider (see the Runtime README)
- The Logto IdP running on `http://localhost:3001` (in the Runtime repo:
  `docker compose up -d`; see Runtime ADR 0009). All Runtime endpoints except
  `/health` require a Bearer JWT, so the app signs the user in via Logto
  before any Runtime call.

## Configuration

The agent endpoint and the Logto connection are set via Vite environment
variables. Copy `.env.example` to `.env` to override the defaults:

```bash
cp .env.example .env
```

| Variable | Default | Description |
|----------|---------|-------------|
| `VITE_AGENT_ENDPOINT` | `http://localhost:7777/agui` | AG-UI endpoint of the Spectres Runtime |
| `VITE_LOGTO_ENDPOINT` | `http://localhost:3001` | Base URL of the Logto IdP (OIDC issuer: `<endpoint>/oidc`) |
| `VITE_LOGTO_APP_ID` | `20vb1euxbpw6m8nqdgkxs` | App ID of this SPA registered in the Logto Console |
| `VITE_LOGTO_API_RESOURCE` | `https://spectres.runtime/api` | API resource indicator; the Runtime only accepts JWT access tokens issued for this audience |

This is the only configuration mechanism, in development and production
alike. No API keys or secrets are needed anywhere in this app — the Logto
App ID is a public client identifier, and tokens live only inside the Logto
SDK.

## Development

```bash
npm install
npm run dev
```

Open http://localhost:3000, sign in via the Logto page, and chat. Reloading
the page continues the same
conversation (the AG-UI `thread_id` is persisted in `localStorage` and the
Runtime keeps the session); **新聊天** in the sidebar starts a fresh thread.

## One-PC MVP run (static build)

```bash
npm run build          # outputs dist/
python3 -m http.server 8080 -d dist   # or any static file server
```

Open http://localhost:8080. Note that the Runtime's `CORS_ALLOWED_ORIGINS`
must include the origin you serve `dist/` from (e.g. `http://localhost:8080`).

## Quality gates

```bash
npm run lint        # oxlint
npm run typecheck   # tsc -b
```

## Troubleshooting

- **Chat shows a connection error**: check that the Runtime is running, that
  `VITE_AGENT_ENDPOINT` points at it, and that its `CORS_ALLOWED_ORIGINS`
  contains this app's exact origin (scheme + host + port).
- **Conversation fails to continue after a Runtime reset**: the stored
  `thread_id` no longer exists server-side — click **New conversation**.

## Project layout

```text
src/
├── main.tsx            # entry; mounts LogtoProvider + AuthGate, imports styles
├── app.tsx             # view state, CopilotKit provider, AppShell wiring
├── nav.ts              # typed sidebar registry (nav, plugins, recent)
├── ag-ui.ts            # HttpAgent wiring + endpoint resolution (Bearer token per request)
├── auth.ts             # Logto config (VITE_LOGTO_*) + module-level token plumbing
├── thread.ts           # thread_id localStorage helpers
├── components/
│   ├── app-shell.tsx   # sidebar frame (shadcn Sidebar primitives)
│   ├── auth-gate.tsx   # loading / login / callback screens + token bridge
│   └── ui/             # vendored shadcn/ui components
├── hooks/
│   └── use-mobile.ts   # vendored shadcn hook (sidebar)
├── lib/
│   └── utils.ts        # cn() class-merge helper
├── pages/
│   └── chat-page.tsx   # chat view: prebuilt chat + tool renderer
└── index.css           # Tailwind entry + shadcn Neutral tokens (:root/.dark)
```

See [`docs/frontend-architecture.md`](docs/frontend-architecture.md) for the
design and [`AGENTS.md`](AGENTS.md) for project conventions.
