import { Link, useParams } from "wouter";
import { usePageMeta } from "@/hooks/usePageMeta";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  getStateBySlug,
  US_STREAMS,
  US_LEVELS,
  getUSBankKey,
} from "@/lib/stateConfig";

const STREAM_ICONS: Record<string, string> = {
  water: "💧",
  ww: "🔄",
  dist: "🚰",
  coll: "🏗️",
};

const STREAM_COLORS: Record<string, string> = {
  water: "from-blue-600 to-blue-700",
  ww: "from-green-600 to-green-700",
  dist: "from-cyan-600 to-cyan-700",
  coll: "from-amber-600 to-amber-700",
};

const STREAM_BADGE: Record<string, string> = {
  water: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  ww: "bg-green-500/10 text-green-400 border-green-500/20",
  dist: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
  coll: "bg-amber-500/10 text-amber-400 border-amber-500/20",
};

// Map stream/level to quiz route
function getQuizRoute(level: string, stream: string): string {
  const levelNum = level.replace("class", "");
  const streamMap: Record<string, string> = {
    water: "water",
    ww: "ww",
    dist: "dist",
    coll: "coll",
  };
  return `/wpi-class${levelNum}-${streamMap[stream]}`;
}

function getMockRoute(level: string, stream: string): string {
  const levelNum = level.replace("class", "");
  const streamMap: Record<string, string> = {
    water: "water",
    ww: "ww",
    dist: "dist",
    coll: "coll",
  };
  return `/wpi-class${levelNum}-${streamMap[stream]}-mock`;
}

export default function USStatePage() {
  const params = useParams<{ slug: string }>();
  const state = getStateBySlug(params.slug ?? "");

  usePageMeta({
    title: state
      ? `${state.name} Water Operator Exam Prep | ABC/WPI Certification — Echelon Institute`
      : "State Not Found — Echelon Institute",
    description: state
      ? `Prepare for your ${state.name} ${state.certBodyAbbr} water or wastewater operator certification exam. AI-powered practice aligned to the 2025 WPI Need-to-Know Criteria.`
      : "State not found.",
  });

  if (!state) {
    return (
      <div className="min-h-screen bg-[#0a0f1a] text-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">State Not Found</h1>
          <Link href="/us/states">
            <Button>View All States →</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0f1a] text-white">
      {/* Nav */}
      <nav className="border-b border-white/10 bg-[#0a0f1a]/95 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/us/states">
            <span className="text-white/70 hover:text-white cursor-pointer text-sm">
              ← All States
            </span>
          </Link>
          <Link href="/us">
            <span className="text-xl font-bold text-white cursor-pointer">Echelon US</span>
          </Link>
          <Link href="/pricing">
            <Button size="sm" className="bg-blue-600 hover:bg-blue-500 text-white">
              Pricing
            </Button>
          </Link>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-4 py-16">
        {/* State header */}
        <div className="mb-12">
          <div className="flex items-center gap-3 mb-4">
            <Badge className="bg-blue-500/10 text-blue-400 border-blue-500/20 text-sm px-3 py-1">
              🇺🇸 {state.code}
            </Badge>
            <Badge className="bg-white/5 text-white/60 border-white/10 text-sm px-3 py-1">
              ABC/WPI Exam
            </Badge>
          </div>
          <h1 className="text-4xl font-bold mb-4">
            {state.name} Water Operator Exam Prep
          </h1>
          <p className="text-white/60 text-lg max-w-2xl leading-relaxed">
            {state.examNote} Echelon Institute provides AI-powered practice questions,
            timed mock exams, and flashcards aligned to the 2025 WPI Need-to-Know Criteria.
          </p>

          {/* Certifying body */}
          <div className="mt-6 bg-white/5 border border-white/10 rounded-xl p-5 inline-block">
            <div className="text-xs text-white/40 uppercase tracking-wider mb-1">Certifying Authority</div>
            <div className="font-semibold text-white">{state.certBody}</div>
            <a
              href={state.certBodyUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-400 hover:text-blue-300 text-sm mt-1 block"
            >
              Official certification page →
            </a>
          </div>
        </div>

        {/* Course grid */}
        <div className="mb-16">
          <h2 className="text-2xl font-bold mb-6">Available Courses</h2>
          <div className="grid md:grid-cols-2 gap-6">
            {US_STREAMS.map(stream => (
              <Card key={stream.key} className="bg-white/5 border-white/10 overflow-hidden">
                <div className={`h-1.5 bg-gradient-to-r ${STREAM_COLORS[stream.key]}`} />
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <span className="text-2xl">{STREAM_ICONS[stream.key]}</span>
                    <div>
                      <h3 className="font-semibold text-white">{stream.label}</h3>
                      <div className="text-xs text-white/40">4 class levels · 100 questions each</div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    {US_LEVELS.map(level => (
                      <div
                        key={level.key}
                        className="flex items-center justify-between bg-white/5 rounded-lg px-3 py-2"
                      >
                        <div className="flex items-center gap-2">
                          <Badge className={`text-xs ${STREAM_BADGE[stream.key]}`}>
                            {level.label}
                          </Badge>
                          <span className="text-xs text-white/50">{level.description}</span>
                        </div>
                        <div className="flex gap-2">
                          <Link href={getQuizRoute(level.key, stream.key)}>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-xs text-white/60 hover:text-white h-7 px-2"
                            >
                              Practice
                            </Button>
                          </Link>
                          <Link href={getMockRoute(level.key, stream.key)}>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-xs text-white/60 hover:text-white h-7 px-2"
                            >
                              Mock Exam
                            </Button>
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Exam info */}
        <div className="bg-white/5 border border-white/10 rounded-xl p-8 mb-12">
          <h2 className="text-xl font-bold mb-4">About the {state.certBodyAbbr} Exam</h2>
          <div className="grid md:grid-cols-3 gap-6 text-sm">
            <div>
              <div className="text-white/40 text-xs uppercase tracking-wider mb-1">Exam Format</div>
              <div className="text-white">100 multiple-choice questions</div>
              <div className="text-white/60 mt-1">Dual US/metric units on all calculation questions</div>
            </div>
            <div>
              <div className="text-white/40 text-xs uppercase tracking-wider mb-1">Passing Score</div>
              <div className="text-white">70% (70 of 100 questions)</div>
              <div className="text-white/60 mt-1">Up to 10 unscored pre-test questions may be included</div>
            </div>
            <div>
              <div className="text-white/40 text-xs uppercase tracking-wider mb-1">Exam Provider</div>
              <div className="text-white">ABC / Water Professionals International (WPI)</div>
              <div className="text-white/60 mt-1">Computer-based testing at Pearson VUE centers</div>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">
            Ready to Start Preparing?
          </h2>
          <p className="text-white/60 mb-8">
            Free practice questions included. No account required to begin.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/wpi-class1-water">
              <Button size="lg" className="bg-blue-600 hover:bg-blue-500 text-white">
                Start Free Practice →
              </Button>
            </Link>
            <Link href="/pricing">
              <Button
                size="lg"
                variant="outline"
                className="border-white/20 text-white hover:bg-white/10"
              >
                View Pricing
              </Button>
            </Link>
          </div>
          <p className="mt-4 text-white/30 text-xs">
            Not affiliated with {state.certBodyAbbr}, ABC, or WPI
          </p>
        </div>
      </div>
    </div>
  );
}
