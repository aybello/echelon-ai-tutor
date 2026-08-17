// ECHELON AI TUTOR — AITutor Panel Component
// Design: Slide-in right panel with gradient header, chat bubbles, quick prompts
// Philosophy: Professional SaaS — Clean Dark-Accent

import { useState, useRef, useEffect, useCallback } from "react";
import { Question, HistoryEntry } from "@/lib/questionTypes";
import { trpc } from "@/lib/trpc";
import { getTutorFailureMessage, isTutorDismissKey } from "@/lib/tutorInteraction";

interface Props {
  question: Question | null;
  userAnswer: number | null;
  history: HistoryEntry[];
  patternMode: boolean;
  onClose: () => void;
  examType: string; // canonical course key for server-owned tutor context
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
  examType,
}: Props) {
  const [sessionStartMs] = useState(() => Date.now());
  const saveSessionMutation = trpc.tutor.saveSession.useMutation();
  // Support both OAuth and verified email session users for session saving
  const emailSessionQuery = trpc.dashboardAuth.me.useQuery(undefined, { retry: false, staleTime: 5 * 60 * 1000 });
  const hasSession = !!emailSessionQuery.data?.email;
  // Normalise field names — Ontario uses `correct`, WPI uses `correctAnswer`
  const correctIdx: number | undefined =
    (question as any)?.correctIndex ?? (question as any)?.correctAnswer ?? (question as any)?.correct ?? undefined;
  // Normalise question text — Ontario uses `q`, WPI uses `question`
  const questionText: string =
    (question as any)?.question ?? (question as any)?.q ?? "";
  // Normalise history entries — Ontario uses { q, selected, confidence } at top level,
  // WPI uses { questionId, module, correct, confidence } at top level
  const normHistory = (history as any[]).map((h: any) => ({
    questionId: h.questionId ?? h.q?.id ?? 0,
    module: h.module ?? h.q?.module ?? "Unknown",
    correct: h.correct,
    confidence: h.confidence ?? 3,
  }));
  const [messages, setMessages] = useState<
    { role: "user" | "assistant"; content: string }[]
  >([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [lastUserMsg, setLastUserMsg] = useState<string | null>(null);
  const chatRef = useRef<HTMLDivElement>(null);
  const accessToken = (() => {
    try { return localStorage.getItem("echelon_access_token") ?? undefined; }
    catch { return undefined; }
  })();

  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }
  }, [messages]);

  const handleClose = useCallback(() => {
    // A tutor opened by the ?panel=tutor deep link must remove that parameter
    // as well as close local state, otherwise later workspace state changes can
    // silently reopen it.
    try {
      const url = new URL(window.location.href);
      if (url.searchParams.get("panel") === "tutor") {
        url.searchParams.delete("panel");
        window.history.replaceState({}, "", `${url.pathname}${url.search}${url.hash}`);
      }
    } catch {
      // The local close action is still safe if browser history is unavailable.
    }

    if (hasSession && examType && messages.some((message) => message.role === "user")) {
      saveSessionMutation.mutate({
        examType,
        messages: messages.filter((message) => message.role === "user" || message.role === "assistant"),
        sessionStartMs,
        accessToken,
      });
    }
    onClose();
  }, [accessToken, examType, hasSession, messages, onClose, saveSessionMutation, sessionStartMs]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (isTutorDismissKey(event.key)) handleClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [handleClose]);

  useEffect(() => {
    let initMsg: string;
    const isElectrician309A = examType === "electrician-309a";

    if (patternMode) {
      const byModule: Record<string, { wrong: number; total: number }> = {};
      normHistory.forEach((h) => {
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
    } else if (userAnswer !== null && question && correctIdx !== undefined) {
      const isCorrect = userAnswer === correctIdx;
      const selectedText = question.options?.[userAnswer] ?? "your selection";
      const correctText = question.options?.[correctIdx] ?? "the correct option";
      if (isCorrect) {
        initMsg = `✓ Correct! You selected **${selectedText}**.\n\nWould you like me to explain *why* this is right in more depth, or show you the step-by-step working so you can apply the same logic to harder questions?`;
      } else {
        initMsg = `Let's work through this together.\n\nYou selected **${selectedText}** — ${(question as any).wrongExp?.[userAnswer] || "that's not quite right."}\n\nThe correct answer is **${correctText}**.\n\nWould you like me to walk through the solution step by step, or would you like me to explain the underlying concept first?`;
      }
    } else {
      initMsg = isElectrician309A
        ? `Hi! I'm your Echelon 309A AI Tutor — here to help you study for the Ontario Construction Electrician exam.\n\nI can explain electrical concepts, walk through calculations, interpret the course diagrams, and help you understand *why* an answer is right or wrong.\n\nWhat would you like to work on?`
        : `Hi! I'm your Echelon AI Tutor — here to help you master your Canadian water and wastewater operator certification exam.\n\nI can explain concepts, walk through calculations step by step, and help you understand *why* answers are right or wrong.\n\nWhat would you like to work on?`;
    }

    setMessages([{ role: "assistant", content: initMsg }]);
  }, []);

  const chatMutation = trpc.tutor.chat.useMutation();

  const sendMessage = async (userMsg: string) => {
    if (!userMsg.trim() || loading) return;
    setInput("");
    const newMessages = [
      ...messages,
      { role: "user" as const, content: userMsg },
    ];
    setMessages(newMessages);
    setLoading(true);
    setLastUserMsg(userMsg);

    try {
      const result = await chatMutation.mutateAsync({
        messages: newMessages.map((m) => ({
          role: m.role as "user" | "assistant",
          content: typeof m.content === "string" ? m.content : String(m.content),
        })),
        examType,
        // Question.id in the learner model is the bank-scoped questionNum.
        questionNum: question?.id && question.id > 0 ? question.id : undefined,
        selectedIndex: userAnswer,
        patternMode,
        recentPerformance: normHistory.slice(-6).map((entry) => ({
          module: entry.module,
          correct: entry.correct === true,
          confidence: typeof entry.confidence === "number" ? entry.confidence : null,
        })),
        accessToken,
      });
      const replyText = typeof result.reply === "string" ? result.reply : String(result.reply);
      setMessages((prev) => [...prev, { role: "assistant" as const, content: replyText }]);
    } catch (error) {
      const message = getTutorFailureMessage(error);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: `__ERROR__:${message}`,
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
    <>
      {/* Mobile backdrop */}
      <style>{`
        @media (max-width: 640px) {
          .ai-tutor-panel {
            width: 100% !important;
            left: 0 !important;
            top: 56px !important;
            border-left: none !important;
            border-top: 1px solid #E5E7EB !important;
          }
        }
      `}</style>
    <div
      className="ai-tutor-panel"
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
            aria-label="Close AI Tutor"
            onClick={handleClose}
            style={{
              background: "rgba(255,255,255,0.15)",
              border: "1px solid rgba(255,255,255,0.38)",
              color: "#fff",
              minWidth: 78,
              height: 30,
              borderRadius: 8,
              cursor: "pointer",
              fontSize: 12,
              fontWeight: 700,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontFamily: "inherit",
            }}
          >
            Close ×
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
            {question.module}{(question as any).difficulty ? ` — ${(question as any).difficulty}` : ""}
          </div>
          {(question as any).formula && (
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
              {(question as any).formula}
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
        {/* Spacer pushes messages to bottom when few, collapses when many */}
        <div style={{ marginTop: "auto" }} />
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
                background: m.role === "user" ? "#1D4ED8" : (m.content === "__ERROR__" ? "#FEF2F2" : "#F1F5F9"),
                color: m.role === "user" ? "#fff" : "#1E293B",
                fontSize: 12,
                lineHeight: 1.65,
              }}
            >
              {m.content.startsWith("__ERROR__:") ? (
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  <span style={{ color: "#DC2626", fontWeight: 600 }}>⚠️ {m.content.slice("__ERROR__:".length)}</span>
                  {lastUserMsg && i === messages.length - 1 && (
                    <button
                      onClick={() => {
                        setMessages(prev => prev.slice(0, -1));
                        sendMessage(lastUserMsg);
                      }}
                      style={{
                        padding: "6px 12px",
                        borderRadius: 8,
                        background: "#1D4ED8",
                        color: "#fff",
                        fontWeight: 700,
                        fontSize: 11,
                        border: "none",
                        cursor: "pointer",
                        alignSelf: "flex-start",
                        fontFamily: "inherit",
                      }}
                    >
                      🔄 Retry
                    </button>
                  )}
                </div>
              ) : renderMsg(m.content)}
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
    </>
  );
}
