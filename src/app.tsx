import { useCallback, useEffect, useRef, useState } from "react";
import { CopilotKit } from "@copilotkit/react-core/v2";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppShell } from "@/components/app-shell";
import { viewFor } from "@/extensions";
import { AGENT_ID, createAgent, setAgentThreadId } from "./ag-ui";
import { loadThreadId, resetThreadId, saveThreadId } from "./thread";
import {
  deleteSession,
  getSessions,
  renameSession,
  type Session,
} from "./sessions-api";
import type { ViewId } from "./nav";
import ChatPage from "./pages/chat-page";
import ScheduledTasksPage from "./pages/scheduled-tasks-page";

export default function App() {
  const [threadId, setThreadId] = useState(loadThreadId);
  const [hasExplicitThreadId, setHasExplicitThreadId] = useState(false);
  const [view, setView] = useState<ViewId>("chat");
  const [sessions, setSessions] = useState<Session[]>([]);
  const [sessionsLoading, setSessionsLoading] = useState(true);
  const [sessionsError, setSessionsError] = useState<Error | null>(null);
  const [agent] = useState(() => createAgent(threadId));

  useEffect(() => {
    setAgentThreadId(agent, threadId);
  }, [agent, threadId]);
  const knownSessionIds = useRef<Set<string>>(new Set());
  const abortController = useRef<AbortController | null>(null);

  useEffect(() => {
    knownSessionIds.current = new Set(sessions.map((s) => s.session_id));
  }, [sessions]);

  const refreshSessions = useCallback(async () => {
    abortController.current?.abort();
    const controller = new AbortController();
    abortController.current = controller;
    setSessionsLoading(true);
    try {
      const page = await getSessions({ limit: 20, signal: controller.signal });
      setSessions(page.data);
      setSessionsError(null);
    } catch (error) {
      if (controller.signal.aborted) return;
      setSessionsError(error instanceof Error ? error : new Error(String(error)));
    } finally {
      if (!controller.signal.aborted) {
        setSessionsLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    abortController.current = controller;
    getSessions({ limit: 20, signal: controller.signal })
      .then((page) => {
        setSessions(page.data);
        setSessionsError(null);
      })
      .catch((error: unknown) => {
        if (!controller.signal.aborted) {
          setSessionsError(error instanceof Error ? error : new Error(String(error)));
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setSessionsLoading(false);
        }
      });
    return () => controller.abort();
  }, []);

  const handleResetThread = useCallback(() => {
    setThreadId(resetThreadId());
    setHasExplicitThreadId(false);
    setView("chat");
  }, []);

  const handleSelectSession = useCallback((sessionId: string) => {
    saveThreadId(sessionId);
    setThreadId(sessionId);
    setHasExplicitThreadId(true);
    setView("chat");
  }, []);

  const handleRenameSession = useCallback(
    async (sessionId: string, name: string) => {
      const updated = await renameSession(sessionId, name);
      setSessions((current) =>
        current.map((session) =>
          session.session_id === sessionId
            ? { ...session, session_name: updated.session_name }
            : session,
        ),
      );
    },
    [],
  );

  const handleDeleteSession = useCallback(
    async (sessionId: string) => {
      await deleteSession(sessionId);
      setSessions((current) =>
        current.filter((session) => session.session_id !== sessionId),
      );
      if (sessionId === threadId) {
        handleResetThread();
      }
    },
    [threadId, handleResetThread],
  );

  const handleRunFinalized = useCallback(() => {
    if (!knownSessionIds.current.has(threadId)) {
      void refreshSessions();
    }
  }, [threadId, refreshSessions]);

  const extensionView = view === "chat" ? undefined : viewFor(view);

  return (
    <TooltipProvider>
      <AppShell
        activeView={view}
        activeThreadId={threadId}
        sessions={sessions}
        sessionsLoading={sessionsLoading}
        sessionsError={sessionsError}
        onSelectView={setView}
        onResetThread={handleResetThread}
        onSelectSession={handleSelectSession}
        onRenameSession={handleRenameSession}
        onDeleteSession={handleDeleteSession}
        onRefreshSessions={refreshSessions}
      >
        <CopilotKit
          agentId={AGENT_ID}
          selfManagedAgents={{ [AGENT_ID]: agent }}
          showIntelligenceIndicator={false}
        >
          {/* Kept mounted while non-chat views are shown so the conversation
              state survives view switches. */}
          <div className={view === "chat" ? "h-full" : "hidden"}>
            <ChatPage
              threadId={threadId}
              hasExplicitThreadId={hasExplicitThreadId}
              onRunFinalized={handleRunFinalized}
            />
          </div>
        </CopilotKit>
        {extensionView && <extensionView.component />}
        {view === "scheduled-tasks" && <ScheduledTasksPage mode="user" />}
      </AppShell>
    </TooltipProvider>
  );
}
