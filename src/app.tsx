import { useMemo, useState } from "react";
import { CopilotKit } from "@copilotkit/react-core/v2";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppShell } from "@/components/app-shell";
import { viewFor } from "@/plugins";
import { AGENT_ID, createAgent } from "./ag-ui";
import { loadThreadId, resetThreadId } from "./thread";
import type { ViewId } from "./nav";
import ChatPage from "./pages/chat-page";

export default function App() {
  const [threadId, setThreadId] = useState(loadThreadId);
  const [view, setView] = useState<ViewId>("chat");
  const agent = useMemo(() => createAgent(threadId), [threadId]);

  const pluginView = view === "chat" ? undefined : viewFor(view);

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
          {/* Kept mounted while plugin views are shown so the conversation
              state survives view switches. */}
          <div className={view === "chat" ? "h-full" : "hidden"}>
            <ChatPage />
          </div>
        </CopilotKit>
        {pluginView && <pluginView.component />}
      </AppShell>
    </TooltipProvider>
  );
}
