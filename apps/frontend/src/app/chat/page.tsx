import type { Metadata } from "next";
import ChatView from "@/components/chat/ChatView";

export const metadata: Metadata = {
  title: "Slideia — Chat",
  description: "Create presentations through conversation with AI",
};

export default function ChatPage() {
  return (
    <main className="min-h-screen bg-background">
      <ChatView />
    </main>
  );
}
