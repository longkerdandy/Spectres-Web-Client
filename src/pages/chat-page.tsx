import { CopilotChat, useDefaultRenderTool } from "@copilotkit/react-core/v2";
import type { CopilotChatLabels } from "@copilotkit/react-core/v2";
import { useTranslation } from "react-i18next";

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

export default function ChatPage() {
  useDefaultRenderTool();
  const { t } = useTranslation("common");

  const labels: Partial<CopilotChatLabels> = Object.fromEntries(
    LABEL_KEYS.map((key) => [key, t(`chat.labels.${key}`)]),
  );

  return <CopilotChat className="h-full" labels={labels} />;
}
