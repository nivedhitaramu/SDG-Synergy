import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { MessageCircle, X, Send, Bot, Loader2, Minimize2 } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

type Message = {
  role: "user" | "assistant";
  content: string;
};

const WELCOME: Message = {
  role: "assistant",
  content: "Hi! I'm **Synergy**, your SDG collaboration assistant 🌿\n\nAsk me anything — how to find the right match, what an SDG means, how to list a project, or anything about sustainability in India!",
};

const SUGGESTED = [
  "How do I find matches?",
  "What is SDG 13?",
  "How can I list a Help Wanted project?",
];

function parseMarkdown(text: string) {
  return text
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.*?)\*/g, "<em>$1</em>")
    .replace(/\n- /g, "\n• ")
    .split("\n")
    .map((line, i) => `<span key="${i}">${line}</span>`)
    .join("<br/>");
}

export function ChatWidget() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [minimized, setMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([WELCOME]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open && !minimized) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
      inputRef.current?.focus();
    }
  }, [messages, open, minimized]);

  if (!user) return null;

  const sendMessage = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || loading) return;

    const userMsg: Message = { role: "user", content: trimmed };
    const history = [...messages.filter(m => m !== WELCOME || messages.length > 1), userMsg];
    const apiHistory = history.filter(m => m !== WELCOME);

    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: apiHistory }),
      });
      const data = await res.json();
      setMessages(prev => [...prev, { role: "assistant", content: data.reply || "Sorry, I couldn't respond." }]);
    } catch {
      setMessages(prev => [...prev, { role: "assistant", content: "Something went wrong. Please try again." }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
      {open && (
        <div
          className={`bg-background border border-border rounded-2xl shadow-2xl flex flex-col transition-all duration-200 ${
            minimized ? "w-72 h-14" : "w-80 sm:w-96 h-[480px]"
          }`}
          data-testid="chat-widget"
        >
          {/* Header */}
          <div className="flex items-center gap-2.5 px-4 py-3 border-b border-border/60 bg-primary/5 rounded-t-2xl flex-shrink-0">
            <div className="w-8 h-8 rounded-full bg-primary/15 flex items-center justify-center flex-shrink-0">
              <Bot className="w-4 h-4 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground leading-none">Synergy AI</p>
              <p className="text-xs text-muted-foreground mt-0.5">SDG Collaboration Assistant</p>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setMinimized(p => !p)}
                className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                data-testid="button-minimize-chat"
              >
                <Minimize2 className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setOpen(false)}
                className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                data-testid="button-close-chat"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {!minimized && (
            <>
              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-3 space-y-3 min-h-0">
                {messages.map((msg, i) => (
                  <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                    {msg.role === "assistant" && (
                      <div className="w-6 h-6 rounded-full bg-primary/15 flex items-center justify-center flex-shrink-0 mr-2 mt-0.5">
                        <Bot className="w-3 h-3 text-primary" />
                      </div>
                    )}
                    <div
                      className={`max-w-[78%] rounded-2xl px-3 py-2 text-sm leading-relaxed ${
                        msg.role === "user"
                          ? "bg-primary text-primary-foreground rounded-br-sm"
                          : "bg-muted text-foreground rounded-bl-sm"
                      }`}
                      data-testid={`chat-message-${msg.role}-${i}`}
                    >
                      {msg.role === "assistant" ? (
                        <span dangerouslySetInnerHTML={{ __html: parseMarkdown(msg.content) }} />
                      ) : (
                        msg.content
                      )}
                    </div>
                  </div>
                ))}

                {loading && (
                  <div className="flex justify-start">
                    <div className="w-6 h-6 rounded-full bg-primary/15 flex items-center justify-center flex-shrink-0 mr-2 mt-0.5">
                      <Bot className="w-3 h-3 text-primary" />
                    </div>
                    <div className="bg-muted rounded-2xl rounded-bl-sm px-3 py-2.5 flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 bg-muted-foreground/60 rounded-full animate-bounce [animation-delay:0ms]" />
                      <span className="w-1.5 h-1.5 bg-muted-foreground/60 rounded-full animate-bounce [animation-delay:150ms]" />
                      <span className="w-1.5 h-1.5 bg-muted-foreground/60 rounded-full animate-bounce [animation-delay:300ms]" />
                    </div>
                  </div>
                )}

                {messages.length === 1 && !loading && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {SUGGESTED.map(s => (
                      <button
                        key={s}
                        onClick={() => sendMessage(s)}
                        className="text-xs px-3 py-1.5 rounded-full bg-accent text-accent-foreground hover:bg-primary/10 hover:text-primary border border-border/60 transition-colors"
                        data-testid={`button-suggestion-${s}`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                )}

                <div ref={bottomRef} />
              </div>

              {/* Input */}
              <div className="p-3 border-t border-border/60 flex-shrink-0">
                <div className="flex items-center gap-2 bg-muted rounded-xl px-3 py-2">
                  <input
                    ref={inputRef}
                    type="text"
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Ask Synergy anything..."
                    className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none min-w-0"
                    disabled={loading}
                    data-testid="input-chat-message"
                  />
                  <button
                    onClick={() => sendMessage(input)}
                    disabled={!input.trim() || loading}
                    className="text-primary disabled:opacity-30 hover:opacity-70 transition-opacity flex-shrink-0"
                    data-testid="button-send-chat"
                  >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-center text-xs text-muted-foreground/60 mt-1.5">Powered by AI · SDG Synergy</p>
              </div>
            </>
          )}
        </div>
      )}

      {/* Floating toggle button */}
      <Button
        onClick={() => { setOpen(p => !p); setMinimized(false); }}
        size="icon"
        className="w-14 h-14 rounded-full shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all"
        data-testid="button-open-chat"
      >
        {open ? <X className="w-5 h-5" /> : <MessageCircle className="w-6 h-6" />}
      </Button>
    </div>
  );
}
