import { CopilotChat, useDefaultRenderTool } from "@copilotkit/react-core/v2";

export default function ChatPage() {
  useDefaultRenderTool();

  return <CopilotChat className="h-full" />;
}
