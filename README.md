# Spectres Web Client

Web client for the Spectres AI personal assistant. A static single-page
application that chats with the Spectres Runtime Master Agent over the AG-UI
protocol, with streaming replies and visible tool calls.

## Prerequisites

- Node.js 24 LTS (any `>=20.19` works; `.nvmrc` pins 24 for fnm/nvm users)
- [Spectres Runtime](../Spectres-Runtime) running on `localhost:7777` with:
  - the AG-UI endpoint exposed (`POST /agui`)
  - `CORS_ALLOWED_ORIGINS` including this app's origin
    (dev default: `http://localhost:5173`)
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

Open http://localhost:5173 and chat. Reloading the page continues the same
conversation (the AG-UI `thread_id` is persisted in `localStorage` and the
Runtime keeps the session); **New conversation** starts a fresh thread.

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
├── App.tsx             # shell: layout, branding, New conversation button
├── agent.ts            # CopilotKit provider setup + HttpAgent wiring
├── thread.ts           # thread_id localStorage helpers
├── pages/
│   └── ChatPage.tsx    # the only page: prebuilt chat + tool renderer
└── index.css           # Tailwind entry
```

See [`docs/frontend-architecture.md`](docs/frontend-architecture.md) for the
design and [`AGENTS.md`](AGENTS.md) for project conventions.
