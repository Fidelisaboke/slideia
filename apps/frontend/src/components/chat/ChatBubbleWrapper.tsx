"use client";

/**
 * ChatBubbleWrapper — bridges the GenerationContext into ChatBubble.
 *
 * layout.tsx is a Server Component and cannot call hooks, so this thin
 * client wrapper reads the generation state from context and forwards it
 * to ChatBubble as a prop.
 */

import { useGenerationState } from "@/contexts/GenerationContext";
import ChatBubble from "@/components/chat/ChatBubble";

export default function ChatBubbleWrapper() {
  const { isGenerating } = useGenerationState();
  return <ChatBubble isGenerating={isGenerating} />;
}
