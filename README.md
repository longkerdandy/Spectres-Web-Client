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

## Configuration

The agent endpoint is set via a Vite environment variable. Copy
`.env.example` to `.env` to override the default:

```bash
cp .env.example .env
```

| Variable | Default | Description |
|----------|---------|-------------|
| `VITE_AGENT_ENDPOINT` | `http://localhost:7777/agui` | AG-UI endpoint of the Spectres Runtime |

This is the only configuration mechanism, in development and production
alike. No API keys are needed anywhere in this app.

## Development

```bash
npm install
npm run dev
```

Open http://localhost:3000 and chat. Reloading the page continues the same
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
├── main.tsx            # entry; mounts <App/>, imports styles
├── app.tsx             # view state, CopilotKit provider, AppShell wiring
├── nav.ts              # typed sidebar registry (nav, plugins, recent)
├── ag-ui.ts            # HttpAgent wiring + endpoint resolution
├── thread.ts           # thread_id localStorage helpers
├── components/
│   ├── app-shell.tsx   # sidebar frame (shadcn Sidebar primitives)
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
