import { createFileRoute } from "@tanstack/react-router";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { MessageSquare } from "lucide-react";
import { useMemo } from "react";
import { toast } from "sonner";

import {
  Conversation,
  ConversationContent,
  ConversationEmptyState,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import { Message, MessageContent, MessageResponse } from "@/components/ai-elements/message";
import {
  PromptInput,
  PromptInputFooter,
  PromptInputSubmit,
  PromptInputTextarea,
} from "@/components/ai-elements/prompt-input";
import { Shimmer } from "@/components/ai-elements/shimmer";

export const Route = createFileRoute("/chat")({
  head: () => ({
    meta: [
      { title: "AI Workplace Chatbot — L&L Services" },
      {
        name: "description",
        content:
          "Chat with an AI workplace assistant to draft emails, summarise text, build agendas, and answer questions.",
      },
      { property: "og:title", content: "AI Workplace Chatbot — L&L Services" },
      {
        property: "og:description",
        content: "Draft emails, agendas, summaries, and more with an AI workplace assistant.",
      },
    ],
  }),
  component: ChatPage,
});

const SUGGESTIONS = [
  "Draft a polite email declining a meeting request",
  "Create an agenda for a 30-min project kickoff",
  "Summarise this paragraph in 3 bullet points",
  "Rewrite this message to sound more professional",
];

function ChatPage() {
  const transport = useMemo(() => new DefaultChatTransport({ api: "/api/chat" }), []);
  const { messages, sendMessage, status, stop } = useChat({
    transport,
    onError: (e) => toast.error(e.message || "Chat failed"),
  });

  const isBusy = status === "submitted" || status === "streaming";

  return (
    <div className="mx-auto flex h-full max-w-4xl flex-col p-4 md:p-6">
      <div className="mb-4 flex items-center gap-3">
        <MessageSquare className="h-6 w-6 text-primary" />
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Workplace Chatbot</h1>
          <p className="text-sm text-muted-foreground">
            Ask for drafts, summaries, agendas, or workplace guidance.
          </p>
        </div>
      </div>

      <div className="flex min-h-[60vh] flex-1 flex-col overflow-hidden rounded-lg border bg-card">
        <Conversation className="flex-1">
          <ConversationContent>
            {messages.length === 0 ? (
              <ConversationEmptyState
                icon={<MessageSquare className="h-8 w-8" />}
                title="Start a conversation"
                description="Try one of these:"
              >
                <div className="mt-3 flex flex-wrap justify-center gap-2">
                  {SUGGESTIONS.map((s) => (
                    <button
                      key={s}
                      type="button"
                      className="rounded-full border bg-background px-3 py-1.5 text-xs text-foreground transition-colors hover:bg-accent"
                      onClick={() => sendMessage({ text: s })}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </ConversationEmptyState>
            ) : (
              messages.map((m) => {
                const text = m.parts
                  .filter((p) => p.type === "text")
                  .map((p) => (p as { text: string }).text)
                  .join("");
                return (
                  <Message from={m.role} key={m.id}>
                    <MessageContent>
                      {m.role === "assistant" ? (
                        <MessageResponse>{text}</MessageResponse>
                      ) : (
                        <p className="whitespace-pre-wrap">{text}</p>
                      )}
                    </MessageContent>
                  </Message>
                );
              })
            )}
            {status === "submitted" && (
              <Message from="assistant">
                <MessageContent>
                  <Shimmer>Thinking...</Shimmer>
                </MessageContent>
              </Message>
            )}
          </ConversationContent>
          <ConversationScrollButton />
        </Conversation>

        <div className="border-t p-3">
          <PromptInput
            onSubmit={(msg) => {
              if (!msg.text.trim()) return;
              sendMessage({ text: msg.text });
            }}
          >
            <PromptInputTextarea placeholder="Ask the workplace assistant..." />
            <PromptInputFooter className="justify-end">
              <PromptInputSubmit status={status} onStop={stop} disabled={isBusy && !stop} />
            </PromptInputFooter>
          </PromptInput>
        </div>
      </div>
    </div>
  );
}
