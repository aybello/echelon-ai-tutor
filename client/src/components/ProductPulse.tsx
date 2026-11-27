import { useEffect, useState } from "react";
import { trpc } from "@/lib/trpc";

type ProductPulseProps = {
  courseKey: string;
  source: "practice" | "quick10" | "dashboard";
};

type PulseChoice = "found_what_needed" | "got_stuck" | "suggestion";

const COOLDOWN_MS = 14 * 24 * 60 * 60 * 1000;
const COOLDOWN_KEY = "echelon_product_pulse_last_shown";

const choices: Array<{ value: PulseChoice; label: string }> = [
  { value: "found_what_needed", label: "I found what I needed" },
  { value: "got_stuck", label: "I got stuck" },
  { value: "suggestion", label: "I have a suggestion" },
];

function isCoolingDown() {
  try {
    const lastShown = Number(window.localStorage.getItem(COOLDOWN_KEY) ?? 0);
    return Number.isFinite(lastShown) && Date.now() - lastShown < COOLDOWN_MS;
  } catch {
    return false;
  }
}

export default function ProductPulse({ courseKey, source }: ProductPulseProps) {
  const [visible, setVisible] = useState(false);
  const [choice, setChoice] = useState<PulseChoice | null>(null);
  const [comment, setComment] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const submit = trpc.productPulse.submit.useMutation();

  useEffect(() => {
    if (isCoolingDown()) return;
    try { window.localStorage.setItem(COOLDOWN_KEY, String(Date.now())); } catch { /* optional prompt */ }
    setVisible(true);
  }, []);

  if (!visible) return null;
  if (submitted) {
    return <p className="mt-4 text-center text-sm text-muted-foreground" role="status">Thanks. Your feedback helps us improve Echelon.</p>;
  }

  const needsComment = choice === "got_stuck" || choice === "suggestion";
  const submitPulse = async () => {
    if (!choice || submit.isPending) return;
    await submit.mutateAsync({ courseKey, source, pagePath: window.location.pathname, response: choice, comment });
    setSubmitted(true);
  };

  return (
    <section className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-5 text-left" aria-labelledby="product-pulse-title">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 id="product-pulse-title" className="font-bold text-slate-900">How is Echelon working for you?</h3>
          <p className="mt-1 text-sm text-slate-600">Optional, private feedback. This is not a public review.</p>
        </div>
        <button type="button" onClick={() => setVisible(false)} className="text-sm text-slate-500 underline underline-offset-2">Not now</button>
      </div>
      <div className="mt-4 grid gap-2 sm:grid-cols-3">
        {choices.map(item => (
          <button key={item.value} type="button" aria-pressed={choice === item.value} onClick={() => setChoice(item.value)}
            className={`min-h-11 rounded-xl border px-3 py-2 text-sm font-semibold transition ${choice === item.value ? "border-sky-600 bg-sky-50 text-sky-800" : "border-slate-200 bg-white text-slate-700 hover:border-sky-300"}`}>
            {item.label}
          </button>
        ))}
      </div>
      {needsComment && <label className="mt-4 block text-sm font-medium text-slate-700">What happened? <span className="font-normal text-slate-500">(optional)</span>
        <textarea value={comment} onChange={event => setComment(event.target.value)} maxLength={2000} rows={3}
          className="mt-2 w-full rounded-xl border border-slate-200 bg-white p-3 text-sm outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100" />
      </label>}
      <button type="button" disabled={!choice || submit.isPending} onClick={() => void submitPulse()}
        className="mt-4 min-h-11 rounded-xl bg-slate-900 px-5 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50">
        {submit.isPending ? "Sending…" : "Send private feedback"}
      </button>
      {submit.error && <p role="alert" className="mt-2 text-sm text-red-700">We could not save that feedback. Please try again later.</p>}
    </section>
  );
}
