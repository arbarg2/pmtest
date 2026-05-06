import React, { useEffect, useRef, useState } from "react";
import { Sparkles, X, Send, Loader2, FileText, Copy, Check } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";

type Msg = { role: "user" | "assistant"; content: string };

interface HollyContext {
  address?: string;
  network?: string;
  risk_score?: number;
  risk_level?: string;
  risk_factors?: any[];
  sanctions?: any[];
  counterparties?: any[];
}

interface AskHollyChatProps {
  context?: HollyContext;
  suggestedPrompts?: string[];
}

const SAR_PROMPT =
  "Generate a compliance-ready SAR narrative for this wallet using all available risk signals, sanctions exposure, and counterparty data. Follow the standard SAR section structure.";

const DEFAULT_PROMPTS = [
  "Summarize the top 3 risks for this wallet",
  "Has this wallet touched any mixers?",
  "Draft a SAR narrative for this case",
  "What are the most suspicious counterparties?",
];

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ask-holly`;

const AskHollyChat: React.FC<AskHollyChatProps> = ({ context, suggestedPrompts }) => {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Msg[]>([]);
  const [streaming, setStreaming] = useState(false);
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  const prompts = suggestedPrompts ?? DEFAULT_PROMPTS;

  const copyMessage = async (text: string, idx: number) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedIdx(idx);
      toast.success("SAR narrative copied to clipboard");
      setTimeout(() => setCopiedIdx((c) => (c === idx ? null : c)), 2000);
    } catch {
      toast.error("Could not copy to clipboard");
    }
  };

  const isSarMessage = (content: string) =>
    /SUSPICIOUS ACTIVITY REPORT/i.test(content) || /SAR — NARRATIVE/i.test(content);


  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, streaming]);

  const send = async (text: string) => {
    if (!text.trim() || streaming) return;
    const userMsg: Msg = { role: "user", content: text.trim() };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setStreaming(true);

    let acc = "";
    const upsert = (chunk: string) => {
      acc += chunk;
      setMessages((prev) => {
        const last = prev[prev.length - 1];
        if (last?.role === "assistant") {
          return prev.map((m, i) => (i === prev.length - 1 ? { ...m, content: acc } : m));
        }
        return [...prev, { role: "assistant", content: acc }];
      });
    };

    try {
      const controller = new AbortController();
      abortRef.current = controller;
      const resp = await fetch(CHAT_URL, {
        method: "POST",
        signal: controller.signal,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          messages: [...messages, userMsg].map((m) => ({ role: m.role, content: m.content })),
          context: context ?? {},
        }),
      });

      if (!resp.ok || !resp.body) {
        if (resp.status === 429) toast.error("Holly is rate-limited. Try again shortly.");
        else if (resp.status === 402) toast.error("AI credits exhausted.");
        else toast.error("Holly is unavailable right now.");
        setStreaming(false);
        return;
      }

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let done = false;

      while (!done) {
        const { done: rdone, value } = await reader.read();
        if (rdone) break;
        buffer += decoder.decode(value, { stream: true });

        let idx: number;
        while ((idx = buffer.indexOf("\n")) !== -1) {
          let line = buffer.slice(0, idx);
          buffer = buffer.slice(idx + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (!line || line.startsWith(":")) continue;
          if (!line.startsWith("data: ")) continue;
          const json = line.slice(6).trim();
          if (json === "[DONE]") {
            done = true;
            break;
          }
          try {
            const parsed = JSON.parse(json);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) upsert(content);
          } catch {
            buffer = line + "\n" + buffer;
            break;
          }
        }
      }
    } catch (e: any) {
      if (e?.name !== "AbortError") {
        console.error(e);
        toast.error("Connection error talking to Holly.");
      }
    } finally {
      setStreaming(false);
      abortRef.current = null;
    }
  };

  return (
    <>
      {/* Floating launcher */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-6 right-6 z-40 group flex items-center gap-2 pl-3 pr-4 py-3 rounded-full bg-gradient-to-r from-primary to-accent text-primary-foreground shadow-2xl hover:shadow-primary/40 transition-all hover:scale-105 animate-fade-in"
          aria-label="Ask Holly"
        >
          <span className="relative flex items-center justify-center w-7 h-7 rounded-full bg-white/15">
            <Sparkles className="w-4 h-4" />
            <span className="absolute inset-0 rounded-full ring-2 ring-white/30 animate-ping" />
          </span>
          <span className="text-sm font-semibold">Ask Holly</span>
        </button>
      )}

      {/* Panel */}
      {open && (
        <Card
          className="fixed bottom-6 right-6 z-40 w-[380px] sm:w-[420px] h-[560px] flex flex-col overflow-hidden animate-scale-in border-primary/20 shadow-2xl"
          style={{ boxShadow: "0 20px 60px -10px hsl(var(--primary) / 0.35)" }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-primary to-accent text-primary-foreground">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-white/15 flex items-center justify-center">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <p className="text-sm font-semibold leading-none">Holly</p>
                <p className="text-[10px] opacity-80">AI Investigator</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-primary-foreground hover:bg-white/15"
              onClick={() => setOpen(false)}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>

          {/* Messages */}
          <ScrollArea className="flex-1">
            <div ref={scrollRef} className="p-4 space-y-4">
              {messages.length === 0 && (
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground">
                    Hi — I can help you interpret this investigation. Try one of these:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {prompts.map((p) => (
                      <button
                        key={p}
                        onClick={() => send(p)}
                        className="text-xs px-3 py-1.5 rounded-full border border-primary/30 bg-primary/5 hover:bg-primary/10 transition-colors text-foreground"
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {messages.map((m, i) => (
                <div
                  key={i}
                  className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm ${
                      m.role === "user"
                        ? "bg-primary text-primary-foreground rounded-br-sm"
                        : "bg-muted text-foreground rounded-bl-sm"
                    }`}
                  >
                    {m.role === "assistant" ? (
                      <div className="prose prose-sm dark:prose-invert max-w-none prose-p:my-1 prose-ul:my-1 prose-ol:my-1 prose-headings:my-2 prose-strong:text-foreground">
                        <ReactMarkdown>{m.content || "…"}</ReactMarkdown>
                      </div>
                    ) : (
                      <p>{m.content}</p>
                    )}
                  </div>
                </div>
              ))}

              {streaming && messages[messages.length - 1]?.role === "user" && (
                <div className="flex justify-start">
                  <div className="bg-muted rounded-2xl rounded-bl-sm px-3.5 py-2.5 flex items-center gap-2">
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-primary" />
                    <span className="text-xs text-muted-foreground">Holly is thinking…</span>
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>

          {/* Input */}
          <form
            className="p-3 border-t flex items-center gap-2 bg-background"
            onSubmit={(e) => {
              e.preventDefault();
              send(input);
            }}
          >
            <Input
              placeholder="Ask Holly anything about this investigation…"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={streaming}
              className="text-sm"
            />
            <Button
              type="submit"
              size="icon"
              disabled={streaming || !input.trim()}
              className="shrink-0"
            >
              {streaming ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </Button>
          </form>
        </Card>
      )}
    </>
  );
};

export default AskHollyChat;
