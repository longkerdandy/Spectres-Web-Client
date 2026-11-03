import { useEffect, useMemo, useRef } from "react";
import {
  CopilotChat,
  CopilotChatConfigurationProvider,
  useAgent,
  useDefaultRenderTool,
} from "@copilotkit/react-core/v2";
import type { CopilotChatLabels } from "@copilotkit/react-core/v2";
import type { Message } from "@ag-ui/core";
import { useTranslation } from "react-i18next";
import { AGENT_ID } from "@/ag-ui";
import { toolCardComponents } from "@/extensions";
import { getSession, type SessionMessage } from "@/sessions-api";

/** Keys of `CopilotChatLabels` sourced from the `common` namespace. */
const LABEL_KEYS = [
  "chatInputPlaceholder",
  "chatInputToolbarStartTranscribeButtonLabel",
  "chatInputToolbarCancelTranscribeButtonLabel",
  "chatInputToolbarFinishTranscribeButtonLabel",
  "chatInputToolbarAddButtonLabel",
  "chatInputToolbarToolsButtonLabel",
  "assistantMessageToolbarCopyCodeLabel",
  "assistantMessageToolbarCopyCodeCopiedLabel",
  "assistantMessageToolbarCopyMessageLabel",
  "assistantMessageToolbarThumbsUpLabel",
  "assistantMessageToolbarThumbsDownLabel",
  "assistantMessageToolbarReadAloudLabel",
  "assistantMessageToolbarRegenerateLabel",
  "userMessageToolbarCopyMessageLabel",
  "userMessageToolbarEditMessageLabel",
  "chatDisclaimerText",
  "chatToggleOpenLabel",
  "chatToggleCloseLabel",
  "modalHeaderTitle",
  "welcomeMessageText",
] as const satisfies readonly (keyof CopilotChatLabels)[];

/** Extension tool-card registrars are build-time static; scan once. */
const TOOL_CARDS = toolCardComponents();

function flattenContent(content: unknown): string {
  if (typeof content === "string") return content;
  if (Array.isArray(content)) {
    return content
      .map((part) => {
        if (typeof part === "string") return part;
        if (
          part &&
          typeof part === "object" &&
          "text" in part &&
          typeof part.text === "string"
        ) {
          return part.text;
        }
        return "";
      })
      .join("");
  }
  return "";
}

function toAgUiMessages(history: SessionMessage[] | undefined): Message[] {
  if (!history) return [];
  return history
    .filter(
      (msg): msg is SessionMessage & { role: "user" | "assistant" } =>
        msg.role === "user" || msg.role === "assistant",
    )
    .map((msg) => ({
      id: crypto.randomUUID(),
      role: msg.role,
      content: flattenContent(msg.content),
    }));
}

interface ChatPageProps {
  threadId: string;
  hasExplicitThreadId: boolean;
  onRunFinalized?: () => void;
}

function ChatContent({ threadId, onRunFinalized }: ChatPageProps) {
  useDefaultRenderTool();
  const { agent } = useAgent({ agentId: AGENT_ID });
  const agentRef = useRef(agent);

  useEffect(() => {
    agentRef.current = agent;
  }, [agent]);

  useEffect(() => {
    let cancelled = false;
    getSession(threadId)
      .then((session) => {
        if (!cancelled) {
          agentRef.current.setMessages(toAgUiMessages(session.chat_history));
        }
      })
      .catch(() => {
        // A 404 means the thread has not been persisted yet; keep the empty state.
      });
    return () => {
      cancelled = true;
    };
  }, [threadId]);

  useEffect(() => {
    if (!onRunFinalized) return;
    const subscription = agent.subscribe({
      onRunFinalized: () => {
        onRunFinalized();
      },
    });
    return () => subscription.unsubscribe();
  }, [agent, onRunFinalized]);

  const { t } = useTranslation("common");
  const labels: Partial<CopilotChatLabels> = useMemo(
    () =>
      Object.fromEntries(
        LABEL_KEYS.map((key) => [key, t(`chat.labels.${key}`)]),
      ),
    [t],
  );

  return <CopilotChat className="h-full" labels={labels} />;
}

export default function ChatPage(props: ChatPageProps) {
  return (
    <CopilotChatConfigurationProvider
      agentId={AGENT_ID}
      threadId={props.threadId}
      hasExplicitThreadId={props.hasExplicitThreadId}
    >
      {TOOL_CARDS.map((ToolCards, index) => (
        <ToolCards key={index} />
      ))}
      <ChatContent {...props} />
    </CopilotChatConfigurationProvider>
  );
}
