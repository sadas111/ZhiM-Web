"use client";

import { useRef, useEffect, useState } from "react";
import { MessageSquare, Send, Loader2 } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import "katex/dist/katex.min.css";
import { useTranslation } from "react-i18next";
import { processLatexContent } from "@/lib/latex";
import { ChatMessage } from "../types";

interface ChatPanelProps {
  messages: ChatMessage[];
  isLearning: boolean;
  onSendMessage: (message: string) => void;
}

export default function ChatPanel({
  messages,
  isLearning,
  onSendMessage,
}: ChatPanelProps) {
  const { t } = useTranslation();
  const [inputMessage, setInputMessage] = useState("");
  const [sendingMessage, setSendingMessage] = useState(false);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll chat
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTo({
        top: chatContainerRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || sendingMessage) return;

    setSendingMessage(true);
    const message = inputMessage;
    setInputMessage("");

    try {
      await onSendMessage(message);
    } finally {
      setSendingMessage(false);
    }
  };

  // Table components for ReactMarkdown
  const tableComponents = {
    table: ({ node, ...props }: any) => (
      <div className="overflow-x-auto my-4 rounded-lg border border-border shadow-sm ring-1 ring-sky-500/10">
        <table
          className="min-w-full divide-y divide-border text-sm"
          {...props}
        />
      </div>
    ),
    thead: ({ node, ...props }: any) => (
      <thead className="bg-background/40" {...props} />
    ),
    th: ({ node, ...props }: any) => (
      <th
        className="px-3 py-2 text-left font-semibold text-foreground whitespace-nowrap border-b border-border"
        {...props}
      />
    ),
    tbody: ({ node, ...props }: any) => (
      <tbody className="divide-y divide-border bg-card/50" {...props} />
    ),
    td: ({ node, ...props }: any) => (
      <td
        className="px-3 py-2 text-foreground/80 border-b border-border"
        {...props}
      />
    ),
    tr: ({ node, ...props }: any) => (
      <tr className="hover:bg-accent/30 transition-colors" {...props} />
    ),
  };

  return (
    <div className="flex-1 bg-card/80 rounded-2xl shadow-sm border border-border flex flex-col overflow-hidden ring-1 ring-sky-500/10">
      <div className="p-3 border-b border-border bg-background/40 text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
        <MessageSquare className="w-4 h-4" />
        {t("Learning Assistant")}
      </div>

      <div
        ref={chatContainerRef}
        className="flex-1 overflow-y-auto p-4 space-y-4 bg-background/20"
      >
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex flex-col ${msg.role === "user" ? "items-end" : "items-start"}`}
          >
            <div
              className={`max-w-[90%] rounded-2xl px-4 py-3 text-sm ${
                msg.role === "user"
                  ? "bg-primary text-primary-foreground rounded-tr-none shadow-md shadow-sky-500/15 ring-1 ring-sky-500/10"
                  : msg.role === "system" && msg.content.includes("⏳")
                    ? "bg-accent/50 border border-border text-foreground rounded-tl-none ring-1 ring-sky-500/10"
                    : msg.role === "system"
                      ? "bg-accent/50 border border-border text-foreground rounded-tl-none ring-1 ring-sky-500/10"
                      : "bg-card/70 border border-border text-foreground rounded-tl-none shadow-sm ring-1 ring-sky-500/10"
              }`}
            >
              {msg.role === "system" || msg.role === "assistant" ? (
                <div className="prose prose-sm max-w-none prose-slate">
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm, remarkMath]}
                    rehypePlugins={[rehypeKatex]}
                    components={tableComponents}
                  >
                    {processLatexContent(msg.content)}
                  </ReactMarkdown>
                </div>
              ) : (
                <p>{msg.content}</p>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Input Area */}
      {isLearning && (
        <div className="p-3 bg-background/40 backdrop-blur-md border-t border-border">
          <div className="relative flex items-center gap-2">
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyDown={(e) =>
                e.key === "Enter" && !e.shiftKey && handleSendMessage()
              }
              placeholder={t("Have any questions? Feel free to ask...")}
              disabled={sendingMessage}
              className="flex-1 pl-4 pr-10 py-2.5 bg-card/70 border border-border focus:bg-card/80 focus:ring-2 focus:ring-primary/25 rounded-xl text-sm text-foreground placeholder:text-muted-foreground transition-all outline-none disabled:opacity-50 disabled:cursor-not-allowed"
            />
            <button
              onClick={handleSendMessage}
              disabled={!inputMessage.trim() || sendingMessage}
              className="p-2.5 bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-sky-500/15 ring-1 ring-sky-500/10"
            >
              {sendingMessage ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
