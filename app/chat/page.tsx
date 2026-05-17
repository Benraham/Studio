import { AppShell } from "@/components/app-shell";
import { ChatPanel } from "@/components/chat-panel";

export default function ChatPage() {
  return (
    <AppShell>
      <div className="mb-6">
        <h1 className="text-[28px] font-semibold tracking-tight">Chat</h1>
        <p className="text-[14px] text-[--text-muted] mt-1">
          A quiet workspace to brainstorm, refine, and pull from your channel data.
        </p>
      </div>
      <ChatPanel />
    </AppShell>
  );
}
