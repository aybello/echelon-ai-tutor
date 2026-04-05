import { useState, useEffect } from "react";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import SiteNav from "@/components/SiteNav";
import { usePageMeta } from "@/hooks/usePageMeta";

const LOGO_URL =
  "https://d2xsxph8kpxj0f.cloudfront.net/310519663446228701/9KAR7mkGo7x7xavTEeEpiA/echelon-icon-v2_37a8727b.png";

// Map each exam type to its display info and links
const EXAM_META: Record<
  string,
  { label: string; quizPath: string; mockPath?: string; formulaPath?: string; color: string; bg: string; icon: string }
> = {
  oit: {
    label: "OIT Practice Pass",
    quizPath: "/quiz",
    mockPath: "/oit-mock",
    formulaPath: "/formulas",
    color: "#0369A1",
    bg: "#F0F9FF",
    icon: "💧",
  },
  "oit-ww": {
    label: "OIT Wastewater Practice Pass",
    quizPath: "/oit-ww",
    mockPath: "/oit-ww-mock",
    formulaPath: "/formulas-ww1",
    color: "#065F46",
    bg: "#ECFDF5",
    icon: "🌿",
  },
  "class1-water": {
    label: "Class 1 Water Treatment Pass",
    quizPath: "/class1-water",
    mockPath: "/class1-water-mock",
    formulaPath: "/formulas-water1",
    color: "#0369A1",
    bg: "#F0F9FF",
    icon: "🚰",
  },
  "class1-ww": {
    label: "Class 1 Wastewater Treatment Pass",
    quizPath: "/class1-ww",
    mockPath: "/class1-ww-mock",
    formulaPath: "/formulas-ww1",
    color: "#0F766E",
    bg: "#F0FDFA",
    icon: "🌊",
  },
  wqa: {
    label: "Water Quality Analyst Pass",
    quizPath: "/wqa",
    mockPath: "/wqa-mock",
    formulaPath: "/formulas-wqa",
    color: "#7C3AED",
    bg: "#F5F3FF",
    icon: "🔬",
  },
  "class2-water": {
    label: "Class 2 Water Treatment Pass",
    quizPath: "/class2-water",
    mockPath: "/class2-water-mock",
    formulaPath: "/formulas-water2",
    color: "#0E7490",
    bg: "#ECFEFF",
    icon: "🚰",
  },
  "class3-water": {
    label: "Class 3 Water Treatment Pass",
    quizPath: "/class3-water",
    mockPath: "/class3-water-mock",
    formulaPath: "/formulas-water3",
    color: "#1E40AF",
    bg: "#EFF6FF",
    icon: "🚰",
  },
  "class4-water": {
    label: "Class 4 Water Treatment Pass",
    quizPath: "/class4-water",
    mockPath: "/class4-water-mock",
    formulaPath: "/formulas-water4",
    color: "#4C1D95",
    bg: "#F5F3FF",
    icon: "🚰",
  },
  "class2-ww": {
    label: "Class 2 Wastewater Treatment Pass",
    quizPath: "/class2-ww",
    mockPath: "/class2-ww-mock",
    formulaPath: "/formulas-ww2",
    color: "#0F766E",
    bg: "#F0FDFA",
    icon: "🌊",
  },
  "class3-ww": {
    label: "Class 3 Wastewater Treatment Pass",
    quizPath: "/class3-ww",
    mockPath: "/class3-ww-mock",
    formulaPath: "/formulas-ww3",
    color: "#0F766E",
    bg: "#F0FDFA",
    icon: "🌊",
  },
  "class4-ww": {
    label: "Class 4 Wastewater Treatment Pass",
    quizPath: "/class4-ww",
    color: "#0F766E",
    bg: "#F0FDFA",
    icon: "🌊",
  },
  // WPI Water Track
  "wpi-class1-water": {
    label: "WPI Class I Water Treatment Pass",
    quizPath: "/wpi-class1-water",
    mockPath: "/wpi-class1-water-mock",
    formulaPath: "/formulas-wpi-water1",
    color: "#0369A1",
    bg: "#F0F9FF",
    icon: "🏔️",
  },
  "wpi-class2-water": {
    label: "WPI Class II Water Treatment Pass",
    quizPath: "/wpi-class2-water",
    mockPath: "/wpi-class2-water-mock",
    formulaPath: "/formulas-wpi-water2",
    color: "#0E7490",
    bg: "#ECFEFF",
    icon: "🏔️",
  },
  "wpi-class3-water": {
    label: "WPI Class III Water Treatment Pass",
    quizPath: "/wpi-class3-water",
    mockPath: "/wpi-class3-water-mock",
    formulaPath: "/formulas-wpi-water3",
    color: "#1E40AF",
    bg: "#EFF6FF",
    icon: "🏔️",
  },
  "wpi-class4-water": {
    label: "WPI Class IV Water Treatment Pass",
    quizPath: "/wpi-class4-water",
    mockPath: "/wpi-class4-water-mock",
    formulaPath: "/formulas-wpi-water4",
    color: "#4C1D95",
    bg: "#F5F3FF",
    icon: "🏔️",
  },
  // WPI Wastewater Track
  "wpi-class1-wastewater": {
    label: "WPI Class I Wastewater Treatment Pass",
    quizPath: "/wpi-class1-wastewater",
    mockPath: "/wpi-class1-wastewater-mock",
    formulaPath: "/formulas-wpi-ww1",
    color: "#B45309",
    bg: "#FFFBEB",
    icon: "🌿",
  },
  "wpi-class2-wastewater": {
    label: "WPI Class II Wastewater Treatment Pass",
    quizPath: "/wpi-class2-wastewater",
    mockPath: "/wpi-class2-wastewater-mock",
    formulaPath: "/formulas-wpi-class2-ww",
    color: "#0F766E",
    bg: "#F0FDFA",
    icon: "🌿",
  },
  "wpi-class3-wastewater": {
    label: "WPI Class III Wastewater Treatment Pass",
    quizPath: "/wpi-class3-wastewater",
    mockPath: "/wpi-class3-wastewater-mock",
    formulaPath: "/formulas-wpi-class3-ww",
    color: "#1D4ED8",
    bg: "#EFF6FF",
    icon: "🌿",
  },
  "wpi-class4-wastewater": {
    label: "WPI Class IV Wastewater Treatment Pass",
    quizPath: "/wpi-class4-wastewater",
    mockPath: "/wpi-class4-wastewater-mock",
    formulaPath: "/formulas-wpi-class4-ww",
    color: "#6D28D9",
    bg: "#F5F3FF",
    icon: "🌿",
  },
};

/** Write product keys + email to localStorage so PurchaseGate can verify access */
function restoreLocalStorage(email: string, productKeys: string[]) {
  try {
    localStorage.setItem("echelon_purchase_email", email);
    localStorage.setItem(
      "echelon_purchased_products",
      JSON.stringify(productKeys)
    );
  } catch {
    // ignore
  }
}

export default function Account() {
  usePageMeta({
    title: "My Passes — Echelon Institute",
    description:
      "Restore access to your Echelon Institute practice passes. Enter your purchase email to unlock your exams on any device.",
    keywords: "restore access, my passes, Echelon Institute account",
  });

  const [email, setEmail] = useState("");
  const [submittedEmail, setSubmittedEmail] = useState<string | null>(null);
  const [emailError, setEmailError] = useState("");
  const [restored, setRestored] = useState(false);

  const getPurchases = trpc.stripe.getMyPurchases.useQuery(
    { email: submittedEmail ?? "" },
    {
      enabled: !!submittedEmail,
      retry: false,
    }
  );

  // Restore localStorage when purchases are fetched
  useEffect(() => {
    const data = getPurchases.data;
    if (data && data.purchases.length > 0 && !restored && submittedEmail) {
      const keys = data.purchases.map((p) => p.productKey);
      restoreLocalStorage(submittedEmail, keys);
      setRestored(true);
    }
  }, [getPurchases.data, submittedEmail, restored]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = email.trim().toLowerCase();
    if (!trimmed || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setEmailError("Please enter a valid email address.");
      return;
    }
    setEmailError("");
    setRestored(false);
    setSubmittedEmail(trimmed);
  };

  const unlockedExamTypes =
    getPurchases.data?.unlockedExamTypes ?? [];
  const productKeys = getPurchases.data?.purchases.map((p) => p.productKey) ?? [];
  const hasPurchases = unlockedExamTypes.length > 0;

  return (
    <div className="min-h-screen" style={{ background: "#0F172A" }}>
      <SiteNav currentPath="/account" />

      <div className="max-w-2xl mx-auto px-4 py-16">
        {/* Header */}
        <div className="text-center mb-10">
          <img
            src={LOGO_URL}
            alt="Echelon Institute"
            className="mx-auto mb-4"
            style={{ height: 56, width: "auto", filter: "brightness(0) invert(1)" }}
          />
          <h1 className="text-3xl font-bold text-white mb-2">My Passes</h1>
          <p className="text-slate-400 text-base">
            Enter the email you used at checkout to restore access on this device.
          </p>
        </div>

        {/* Email form */}
        <form
          onSubmit={handleSubmit}
          className="bg-slate-800 border border-slate-700 rounded-2xl p-6 mb-8"
        >
          <label
            htmlFor="restore-email"
            className="block text-sm font-medium text-slate-300 mb-2"
          >
            Purchase email address
          </label>
          <div className="flex gap-3">
            <input
              id="restore-email"
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setEmailError("");
              }}
              placeholder="jane@example.com"
              className="flex-1 bg-slate-900 border border-slate-600 text-white placeholder-slate-500 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              autoComplete="email"
            />
            <button
              type="submit"
              disabled={getPurchases.isFetching}
              className="px-5 py-2.5 rounded-lg text-sm font-semibold text-white transition-colors"
              style={{ background: "#2563EB" }}
            >
              {getPurchases.isFetching ? "Checking…" : "Restore Access"}
            </button>
          </div>
          {emailError && (
            <p className="mt-2 text-sm text-red-400">{emailError}</p>
          )}
        </form>

        {/* Results */}
        {submittedEmail && !getPurchases.isFetching && (
          <>
            {hasPurchases ? (
              <div>
                {/* Success banner */}
                <div className="flex items-center gap-3 bg-emerald-900/40 border border-emerald-700 rounded-xl px-5 py-4 mb-6">
                  <span className="text-2xl">✅</span>
                  <div>
                    <p className="text-emerald-300 font-semibold text-sm">
                      Access restored for {submittedEmail}
                    </p>
                    <p className="text-emerald-400/80 text-xs mt-0.5">
                      Your passes are now active on this device.
                    </p>
                  </div>
                </div>

                {/* Pass cards */}
                <div className="space-y-3">
                  {unlockedExamTypes.map((examType) => {
                    const meta = EXAM_META[examType];
                    if (!meta) return null;
                    return (
                      <div
                        key={examType}
                        className="flex items-center justify-between bg-slate-800 border border-slate-700 rounded-xl px-5 py-4"
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">{meta.icon}</span>
                          <div>
                            <p className="text-white font-semibold text-sm">
                              {meta.label}
                            </p>
                            <p className="text-slate-400 text-xs mt-0.5">
                              Unlimited access · AI Tutor included
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-2 flex-shrink-0 ml-4">
                          <Link href={meta.quizPath}>
                            <button
                              className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white transition-colors"
                              style={{ background: meta.color }}
                            >
                              Practice
                            </button>
                          </Link>
                          {meta.mockPath && (
                            <Link href={meta.mockPath}>
                              <button className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-700 text-slate-200 hover:bg-slate-600 transition-colors">
                                Mock Exam
                              </button>
                            </Link>
                          )}
                          {meta.formulaPath && (
                            <Link href={meta.formulaPath}>
                              <button className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors" style={{ background: "#064E3B", color: "#6EE7B7" }}>
                                📐 Formulas
                              </button>
                            </Link>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                <p className="text-center text-slate-500 text-xs mt-6">
                  Access is saved to this browser. Re-enter your email if you
                  switch devices.
                </p>
              </div>
            ) : (
              /* No purchases found */
              <div className="bg-slate-800 border border-slate-700 rounded-2xl p-8 text-center">
                <span className="text-4xl block mb-4">🔍</span>
                <h2 className="text-white font-semibold text-lg mb-2">
                  No purchases found
                </h2>
                <p className="text-slate-400 text-sm mb-6">
                  We couldn't find any purchases for{" "}
                  <span className="text-white font-medium">{submittedEmail}</span>.
                  Make sure you're using the same email you entered at checkout.
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <Link href="/pricing">
                    <button
                      className="px-5 py-2.5 rounded-lg text-sm font-semibold text-white"
                      style={{ background: "#2563EB" }}
                    >
                      Browse Practice Passes →
                    </button>
                  </Link>
                  <a
                    href="mailto:support@echeloninstitute.ca"
                    className="px-5 py-2.5 rounded-lg text-sm font-semibold bg-slate-700 text-slate-200 hover:bg-slate-600 transition-colors text-center"
                  >
                    Contact Support
                  </a>
                </div>
              </div>
            )}
          </>
        )}

        {/* First-time visitor prompt */}
        {!submittedEmail && (
          <div className="text-center">
            <p className="text-slate-500 text-sm">
              Don't have a pass yet?{" "}
              <Link href="/pricing">
                <span className="text-blue-400 hover:text-blue-300 cursor-pointer">
                  Browse Practice Passes →
                </span>
              </Link>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
