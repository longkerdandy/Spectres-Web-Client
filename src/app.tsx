import { useMemo, useState } from "react";
import { CopilotKit } from "@copilotkit/react-core/v2";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppShell } from "@/components/app-shell";
import { AGENT_ID, createAgent } from "./ag-ui";
import { loadThreadId, resetThreadId } from "./thread";
import type { ViewId } from "./nav";
import ChatPage from "./pages/chat-page";

export default function App() {
  const [threadId, setThreadId] = useState(loadThreadId);
  const [view, setView] = useState<ViewId>("chat");
  const agent = useMemo(() => createAgent(threadId), [threadId]);

  return (
    <TooltipProvider>
      <AppShell
        activeView={view}
        onSelectView={setView}
        onResetThread={() => setThreadId(resetThreadId())}
      >
        <CopilotKit
          key={threadId}
          agentId={AGENT_ID}
          selfManagedAgents={{ [AGENT_ID]: agent }}
        >
          {view === "chat" && <ChatPage />}
        </CopilotKit>
      </AppShell>
    </TooltipProvider>
  );
}
