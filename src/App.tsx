import { useMemo, useState } from "react";
import { CopilotKit } from "@copilotkit/react-core/v2";
import { AGENT_ID, createAgent } from "./agent";
import { loadThreadId, resetThreadId } from "./thread";
import ChatPage from "./pages/ChatPage";

export default function App() {
  const [threadId, setThreadId] = useState(loadThreadId);
  const agent = useMemo(() => createAgent(threadId), [threadId]);

  return (
    <div className="flex h-dvh flex-col">
      <header className="flex items-center justify-between border-b border-gray-200 px-4 py-2">
        <h1 className="text-lg font-semibold">Spectres</h1>
        <button
          type="button"
          onClick={() => setThreadId(resetThreadId())}
          className="rounded border border-gray-300 px-3 py-1 text-sm hover:bg-gray-100"
        >
          New conversation
        </button>
      </header>
      <main className="min-h-0 flex-1">
        <CopilotKit
          key={threadId}
          agentId={AGENT_ID}
          selfManagedAgents={{ [AGENT_ID]: agent }}
        >
          <ChatPage />
        </CopilotKit>
      </main>
    </div>
  );
}
