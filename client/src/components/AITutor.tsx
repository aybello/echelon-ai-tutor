// ECHELON AI TUTOR — AITutor Panel Component
// Design: Slide-in right panel with gradient header, chat bubbles, quick prompts
// Philosophy: Professional SaaS — Clean Dark-Accent

import { useState, useRef, useEffect } from "react";
import { Question, HistoryEntry } from "@/lib/questions";

interface Props {
  question: Question | null;
  userAnswer: number | null;
  history: HistoryEntry[];
  patternMode: boolean;
  onClose: () => void;
}

function renderMsg(text: string) {
  return text.split("\n").map((line, i, arr) => (
    <span key={i}>
      {line.split(/(\*\*[^*]+\*\*)/g).map((p, j) =>
        p.startsWith("**") && p.endsWith("**") ? (
          <strong key={j}>{p.slice(2, -2)}</strong>
        ) : (
          p
        )
      )}
      {i < arr.length - 1 && <br />}
    </span>
  ));
}

export default function AITutor({
  question,
  userAnswer,
  history,
  patternMode,
  onClose,
}: Props) {
  const [messages, setMessages] = useState<
    { role: "user" | "assistant"; content: string }[]
  >([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const chatRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    let initMsg: string;

    if (patternMode) {
      const byModule: Record<string, { wrong: number; total: number }> = {};
      history.forEach((h) => {
        if (!byModule[h.module]) byModule[h.module] = { wrong: 0, total: 0 };
        byModule[h.module].total++;
        if (!h.correct) byModule[h.module].wrong++;
      });
      const worst = Object.entries(byModule).sort(
        (a, b) => b[1].wrong / b[1].total - a[1].wrong / a[1].total
      )[0];
      if (worst) {
        initMsg = `I've noticed you're getting ${Math.round((worst[1].wrong / worst[1].total) * 100)}% of **${worst[0]}** questions wrong — that's ${worst[1].wrong} out of ${worst[1].total}.\n\nThis tells me there's likely a core concept that isn't clicking yet, not just exam nerves. Let me figure out exactly where the confusion is.\n\nCan you tell me: when you see a **${worst[0]}** question, what's your thought process? Walk me through how you approach it.`;
      } else {
        initMsg = `Hi! I'm your Echelon AI Tutor. I'm here to help you understand any topic. What would you like to work on?`;
      }
    } else if (userAnswer !== null && question) {
      const isCorrect = userAnswer === question.correct;
      if (isCorrect) {
        initMsg = `✓ Correct! You selected **${question.options[userAnswer]}**.\n\nWould you like me to explain *why* this is right in more depth, or show you the step-by-step working so you can apply the same logic to harder questions?`;
      } else {
        initMsg = `Let's work through this together.\n\nYou selected **${question.options[userAnswer]}** — ${question.wrongExp?.[userAnswer] || "that's not quite right."}\n\nThe correct answer is **${question.options[question.correct]}**.\n\nWould you like me to walk through the solution step by step, or would you like me to explain the underlying concept first?`;
      }
    } else {
      initMsg = `Hi! I'm your Echelon AI Tutor — here to help you master the Ontario water and wastewater operator exam.\n\nI can explain concepts, walk through calculations step by step, and help you understand *why* answers are right or wrong.\n\nWhat would you like to work on?`;
    }

    setMessages([{ role: "assistant", content: initMsg }]);
  }, []);

  const sendMessage = async (userMsg: string) => {
    if (!userMsg.trim() || loading) return;
    setInput("");
    const newMessages = [
      ...messages,
      { role: "user" as const, content: userMsg },
    ];
    setMessages(newMessages);
    setLoading(true);

    const historyContext =
      history.length > 0
        ? `\n\nStudent's recent performance:\n${history
            .slice(-5)
            .map(
              (h) =>
                `- Q${h.questionId} (${h.module}): ${h.correct ? "✓ Correct" : "✗ Wrong"} | Confidence: ${h.confidence}/5`
            )
            .join("\n")}`
        : "";

    const systemPrompt = `You are an expert AI tutor for Echelon Institute — Ontario water and wastewater operator certification exam preparation.

${
  patternMode
    ? `PATTERN ANALYSIS MODE: The student has a pattern of getting ${question?.module || "certain"} questions wrong. Your goal is to diagnose the root misconception through Socratic questioning. Ask them to explain their thinking, identify the exact point where their mental model breaks down, and rebuild it correctly.`
    : `
Current question: ${question?.q}
Module: ${question?.module}
Type: ${question?.type}
Correct answer: ${question?.options[question?.correct ?? 0]}
Explanation: ${question?.explanation}
${question?.formula ? `Formula: ${question.formula}` : ""}
${question?.steps ? `Steps: ${question.steps.map((s, i) => `${i + 1}. ${s.l}: ${s.c}`).join(" | ")}` : ""}
${userAnswer !== null ? `Student selected: ${question?.options[userAnswer ?? 0]} (${userAnswer === question?.correct ? "CORRECT" : "INCORRECT"})` : "Student hasn't answered yet."}
${userAnswer !== null && userAnswer !== question?.correct ? `Why student was wrong: ${question?.wrongExp?.[userAnswer ?? 0]}` : ""}
${question?.tip ? `Operator tip: ${question.tip}` : ""}`
}
${historyContext}

Your approach:
- Be encouraging, warm, and patient — exam anxiety is real
- Use ** for bold on key numbers, formulas, and terms
- Show calculations step by step with clear formatting
- Connect everything to real operator practice and Ontario regulations
- Keep responses concise (3-5 sentences) unless doing a full worked example
- If the student seems confused, ask a clarifying question rather than lecturing
- Reference O. Reg. 170/03, OWWCO, EOCP where relevant
- If they've made the same mistake before (check the history), mention it gently`;

    try {
      const apiKey = import.meta.env.VITE_FRONTEND_FORGE_API_KEY;
      const apiUrl = import.meta.env.VITE_FRONTEND_FORGE_API_URL;

      const res = await fetch(`${apiUrl}/v1/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: "claude-sonnet-4-5",
          max_tokens: 1000,
          messages: [
            { role: "system", content: systemPrompt },
            ...newMessages.map((m) => ({ role: m.role, content: m.content })),
          ],
        }),
      });

      const data = await res.json();
      const reply =
        data.choices?.[0]?.message?.content ||
        data.content?.[0]?.text ||
        "I'm having trouble connecting right now — please try again.";
      setMessages((prev) => [...prev, { role: "assistant", content: reply }]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Connection issue — please try again in a moment.",
        },
      ]);
    }
    setLoading(false);
  };

  const QUICK = patternMode
    ? [
        "My thought process for these questions",
        "What concept am I missing?",
        "Give me the simplest explanation",
        "Show me a worked example from scratch",
      ]
    : [
        "Walk me through step by step",
        "Why exactly was I wrong?",
        "Give me a similar question",
        "How does this apply on the job?",
      ];

  const headerGradient = patternMode
    ? "linear-gradient(135deg, #B45309, #92400E)"
    : "linear-gradient(135deg, #1D4ED8, #0F766E)";

  return (
    <div
      style={{
        position: "fixed",
        right: 0,
        top: 0,
        bottom: 0,
        width: 420,
        background: "#fff",
        borderLeft: "1px solid #E5E7EB",
        display: "flex",
        flexDirection: "column",
        zIndex: 100,
        boxShadow: "-8px 0 32px rgba(0,0,0,0.12)",
        animation: "slideIn 0.3s ease both",
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: "18px 20px",
          background: headerGradient,
          color: "#fff",
          flexShrink: 0,
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: patternMode ? 10 : 0,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div
              style={{
                width: 38,
                height: 38,
                borderRadius: "50%",
                background: "rgba(255,255,255,0.2)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 20,
              }}
            >
              {patternMode ? "🧠" : "🤖"}
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700 }}>
                {patternMode ? "Pattern Analysis Mode" : "Echelon AI Tutor"}
              </div>
              <div style={{ fontSize: 10, opacity: 0.8 }}>
                {patternMode
                  ? "Diagnosing your learning gap"
                  : "Always here to help"}
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: "rgba(255,255,255,0.15)",
              border: "none",
              color: "#fff",
              width: 30,
              height: 30,
              borderRadius: "50%",
              cursor: "pointer",
              fontSize: 18,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontFamily: "inherit",
            }}
          >
            ×
          </button>
        </div>
        {patternMode && (
          <div
            style={{
              background: "rgba(255,255,255,0.15)",
              borderRadius: 8,
              padding: "8px 12px",
              fontSize: 11,
            }}
          >
            🎯 I'm analysing your mistake patterns to find the root cause — not
            just the symptoms.
          </div>
        )}
      </div>

      {/* Context strip */}
      {!patternMode && question && (
        <div
          style={{
            padding: "12px 18px",
            background: "#F8FAFC",
            borderBottom: "1px solid #E5E7EB",
            flexShrink: 0,
          }}
        >
          <div
            style={{
              fontSize: 9,
              fontWeight: 700,
              color: "#94A3B8",
              letterSpacing: "0.1em",
              marginBottom: 3,
            }}
          >
            CURRENT QUESTION
          </div>
          <div
            style={{ fontSize: 11, fontWeight: 600, color: "#0F172A", lineHeight: 1.4 }}
          >
            {question.module} — {question.difficulty}
          </div>
          {question.formula && (
            <div
              style={{
                fontFamily:
                  "'JetBrains Mono', 'Fira Code', 'Courier New', monospace",
                fontSize: 11,
                color: "#1D4ED8",
                fontWeight: 700,
                background: "#EFF6FF",
                padding: "4px 8px",
                borderRadius: 6,
                marginTop: 4,
              }}
            >
              {question.formula}
            </div>
          )}
        </div>
      )}

      {/* Chat messages */}
      <div
        ref={chatRef}
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "16px",
          display: "flex",
          flexDirection: "column",
          gap: 12,
        }}
      >
        {messages.map((m, i) => (
          <div
            key={i}
            style={{
              display: "flex",
              justifyContent: m.role === "user" ? "flex-end" : "flex-start",
              animation: "fadeUp 0.3s ease both",
            }}
          >
            {m.role === "assistant" && (
              <div
                style={{
                  width: 30,
                  height: 30,
                  borderRadius: "50%",
                  background: headerGradient,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 13,
                  flexShrink: 0,
                  marginRight: 8,
                  marginTop: 2,
                }}
              >
                {patternMode ? "🧠" : "🤖"}
              </div>
            )}
            <div
              style={{
                maxWidth: "82%",
                padding: "10px 14px",
                borderRadius:
                  m.role === "user"
                    ? "14px 14px 4px 14px"
                    : "14px 14px 14px 4px",
                background: m.role === "user" ? "#1D4ED8" : "#F1F5F9",
                color: m.role === "user" ? "#fff" : "#1E293B",
                fontSize: 12,
                lineHeight: 1.65,
              }}
            >
              {renderMsg(m.content)}
            </div>
          </div>
        ))}

        {/* Loading dots */}
        {loading && (
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div
              style={{
                width: 30,
                height: 30,
                borderRadius: "50%",
                background: headerGradient,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 13,
              }}
            >
              {patternMode ? "🧠" : "🤖"}
            </div>
            <div
              style={{
                background: "#F1F5F9",
                padding: "10px 14px",
                borderRadius: "14px 14px 14px 4px",
                display: "flex",
                gap: 4,
                alignItems: "center",
              }}
            >
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: "50%",
                    background: "#94A3B8",
                    animation: "pulse 1.2s ease infinite",
                    animationDelay: `${i * 0.2}s`,
                  }}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Quick prompts */}
      <div
        style={{
          padding: "10px 16px",
          borderTop: "1px solid #F1F5F9",
          flexShrink: 0,
        }}
      >
        <div
          style={{
            fontSize: 9,
            fontWeight: 700,
            color: "#CBD5E1",
            letterSpacing: "0.1em",
            marginBottom: 6,
          }}
        >
          QUICK PROMPTS
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
          {QUICK.map((q) => (
            <button
              key={q}
              onClick={() => sendMessage(q)}
              disabled={loading}
              style={{
                padding: "5px 10px",
                borderRadius: 20,
                border: "1px solid #E5E7EB",
                background: "#F8FAFC",
                color: "#374151",
                fontSize: 10,
                fontWeight: 500,
                cursor: loading ? "not-allowed" : "pointer",
                opacity: loading ? 0.5 : 1,
                fontFamily: "inherit",
                transition: "all 0.15s",
              }}
            >
              {q}
            </button>
          ))}
        </div>
      </div>

      {/* Input area */}
      <div
        style={{
          padding: "12px 16px",
          borderTop: "1px solid #E5E7EB",
          display: "flex",
          gap: 8,
          flexShrink: 0,
        }}
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) sendMessage(input);
          }}
          placeholder="Ask anything..."
          disabled={loading}
          style={{
            flex: 1,
            padding: "10px 14px",
            borderRadius: 10,
            border: "1px solid #E5E7EB",
            fontSize: 12,
            outline: "none",
            background: "#F8FAFC",
            color: "#0F172A",
            fontFamily: "inherit",
          }}
        />
        <button
          onClick={() => sendMessage(input)}
          disabled={loading || !input.trim()}
          style={{
            padding: "10px 16px",
            borderRadius: 10,
            border: "none",
            background: input.trim() && !loading ? "#1D4ED8" : "#E5E7EB",
            color: input.trim() && !loading ? "#fff" : "#94A3B8",
            fontSize: 12,
            fontWeight: 700,
            cursor: input.trim() && !loading ? "pointer" : "not-allowed",
            fontFamily: "inherit",
            transition: "all 0.15s",
          }}
        >
          Send
        </button>
      </div>
    </div>
  );
}
