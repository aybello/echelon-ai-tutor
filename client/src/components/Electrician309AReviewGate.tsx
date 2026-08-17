import { lazy, Suspense } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";

const Electrician309ADemo = lazy(() => import("@/pages/Electrician309ADemo"));

function ReviewAccessRequired() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-6 text-center text-white">
      <section className="max-w-md rounded-3xl border border-white/10 bg-white/[0.04] p-8 shadow-2xl shadow-teal-950/30">
        <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-amber-200">
          Internal review workspace
        </p>
        <h1 className="mt-3 text-3xl font-black">309A draft access is restricted</h1>
        <p className="mt-4 text-sm leading-6 text-slate-300">
          This diagnostic contains unreleased, SME-review content. Sign in with an Echelon Institute administrator account to review it.
        </p>
        <button
          type="button"
          onClick={() => { window.location.href = getLoginUrl(); }}
          className="mt-6 rounded-xl bg-teal-400 px-5 py-3 font-extrabold text-slate-950 transition hover:bg-teal-300"
        >
          Sign in to review
        </button>
      </section>
    </main>
  );
}

export default function Electrician309AReviewGate() {
  const { user, loading } = useAuth();

  if (loading) {
    return <main className="min-h-screen bg-slate-950" aria-label="Loading private review workspace" />;
  }

  if (user?.role !== "admin") {
    return <ReviewAccessRequired />;
  }

  return (
    <Suspense fallback={<main className="min-h-screen bg-slate-950" aria-label="Loading 309A review workspace" />}>
      <Electrician309ADemo />
    </Suspense>
  );
}
