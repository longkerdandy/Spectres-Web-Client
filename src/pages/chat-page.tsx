import { useMemo } from "react";
import { CopilotChat, useDefaultRenderTool } from "@copilotkit/react-core/v2";
import type { CopilotChatLabels } from "@copilotkit/react-core/v2";
import { useTranslation } from "react-i18next";
import { toolCardComponents } from "@/plugins";

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

/** Plugin tool-card registrars are build-time static; scan once. */
const TOOL_CARDS = toolCardComponents();

export default function ChatPage() {
  useDefaultRenderTool();
  const { t } = useTranslation("common");

  const labels: Partial<CopilotChatLabels> = useMemo(
    () =>
      Object.fromEntries(
        LABEL_KEYS.map((key) => [key, t(`chat.labels.${key}`)]),
      ),
    [t],
  );

  return (
    <>
      {/* Plugin-contributed tool-card registrars; render nothing themselves. */}
      {TOOL_CARDS.map((ToolCards, index) => (
        <ToolCards key={index} />
      ))}
      <CopilotChat className="h-full" labels={labels} />
    </>
  );
}
