// Shared ReviewAITutor component for mock exam review mode
// Works with any question shape — accepts pre-formatted strings
import { useState, useRef, useEffect } from "react";
import { trpc } from "@/lib/trpc";

interface ReviewAITutorProps {
  questionText: string;
  options: string[];
  correctIndex: number;
  userAnswerIndex: number | null;
  explanation?: string;
  module?: string;
  examType: string;
  questionNum: number;
}

export default function ReviewAITutor({ questionText, options, correctIndex, userAnswerIndex, explanation, module, examType, questionNum }: ReviewAITutorProps) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<{ role: "user" | "assistant"; content: string }[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const chatMutation = trpc.tutor.chat.useMutation();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const sendMessage = async (text: string) => {
    if (!text.trim() || loading) return;
    const userMsg = { role: "user" as const, content: text };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput("");
    setLoading(true);
    try {
      const result = await chatMutation.mutateAsync({
        messages: newMessages,
        examType,
        questionNum,
        selectedIndex: userAnswerIndex,
        patternMode: false,
        recentPerformance: [],
        accessToken: (() => {
          try { return localStorage.getItem("echelon_access_token") ?? undefined; }
          catch { return undefined; }
        })(),
      });
      setMessages(prev => [...prev, { role: "assistant" as const, content: String(result.reply) }]);
    } catch {
      setMessages(prev => [...prev, { role: "assistant" as const, content: "Connection issue — please try again." }]);
    } finally {
      setLoading(false);
    }
  };

  const handleOpen = () => {
    setOpen(true);
    if (messages.length === 0) {
      sendMessage("Explain why the correct answer is right and what I got wrong.");
    }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div style={{ marginTop: 8 }}>
      {!open ? (
        <button
          onClick={handleOpen}
          style={{
            padding: "6px 14px", borderRadius: 8, border: "1.5px solid #6366F1",
            background: "#EEF2FF", color: "#4338CA", fontSize: 12, fontWeight: 700,
            cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", gap: 6,
          }}
        >
          🤖 Ask AI Tutor
        </button>
      ) : (
        <div style={{ background: "#F8FAFC", borderRadius: 10, border: "1.5px solid #E0E7FF", padding: "12px 14px", marginTop: 4 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: "#4338CA", letterSpacing: "0.06em" }}>🤖 AI TUTOR</span>
            <button
              onClick={() => setOpen(false)}
              style={{ background: "none", border: "none", cursor: "pointer", color: "#94A3B8", fontSize: 14, padding: 0 }}
            >✕</button>
          </div>
          <div style={{ maxHeight: 200, overflowY: "auto", marginBottom: 8 }}>
            {messages.map((m, i) => (
              <div key={i} style={{
                marginBottom: 8,
                padding: "8px 10px", borderRadius: 8,
                background: m.role === "user" ? "#EEF2FF" : "#fff",
                border: m.role === "assistant" ? "1px solid #E0E7FF" : "none",
                fontSize: 12, color: "#0F172A", lineHeight: 1.6,
              }}>
                {m.role === "user" && <span style={{ fontWeight: 700, color: "#4338CA", marginRight: 4 }}>You:</span>}
                {m.content}
              </div>
            ))}
            {loading && (
              <div style={{ padding: "8px 10px", borderRadius: 8, background: "#fff", border: "1px solid #E0E7FF", fontSize: 12, color: "#94A3B8" }}>
                Thinking…
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
          <div style={{ display: "flex", gap: 6 }}>
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(input); } }}
              placeholder="Ask a follow-up question…"
              style={{
                flex: 1, padding: "7px 10px", borderRadius: 8, border: "1.5px solid #E0E7FF",
                fontSize: 12, fontFamily: "inherit", outline: "none", background: "#fff",
              }}
            />
            <button
              onClick={() => sendMessage(input)}
              disabled={loading || !input.trim()}
              style={{
                padding: "7px 12px", borderRadius: 8, border: "none",
                background: loading || !input.trim() ? "#E0E7FF" : "#4338CA",
                color: loading || !input.trim() ? "#94A3B8" : "#fff",
                fontWeight: 700, fontSize: 12, cursor: loading || !input.trim() ? "not-allowed" : "pointer",
                fontFamily: "inherit",
              }}
            >
              Send
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
