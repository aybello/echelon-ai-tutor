import { useState } from "react";
import { Link } from "wouter";
import { usePageMeta } from "@/hooks/usePageMeta";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  FEATURED_US_STATES,
  US_STATE_CONFIGS,
  US_STREAMS,
  US_LEVELS,
  type USStateCode,
} from "@/lib/stateConfig";

const STATS = [
  { value: "132,400+", label: "US Operators Employed" },
  { value: "10,700", label: "Annual Job Openings" },
  { value: "$58,260", label: "Median Annual Salary" },
  { value: "4 Streams", label: "Water, Wastewater, Distribution, Collection" },
];

const FEATURES = [
  {
    icon: "🎯",
    title: "Aligned to ABC/WPI 2025 Blueprints",
    body: "Every question maps to the official Need-to-Know Criteria published by the Association of Boards of Certification (ABC) and Water Professionals International (WPI).",
  },
  {
    icon: "🤖",
    title: "AI Tutor Explains Every Answer",
    body: "Get instant, detailed explanations for every question. The AI Tutor identifies your weak modules and adapts the session to focus where you need it most.",
  },
  {
    icon: "📋",
    title: "100-Question Timed Mock Exams",
    body: "Simulate the real exam experience with full-length 100-question timed exams matching the exact content area weightings from the WPI exam blueprints.",
  },
  {
    icon: "🗂️",
    title: "Flashcard Review Mode",
    body: "Reinforce key concepts with topic-organized flashcards covering treatment processes, equipment O&M, lab analysis, and safety procedures.",
  },
  {
    icon: "📐",
    title: "Formula Reference Sheets",
    body: "Comprehensive formula sheets covering flow calculations, chemical dosing, hydraulics, and all math topics tested on the WPI exam.",
  },
  {
    icon: "📊",
    title: "Progress Dashboard",
    body: "Track your accuracy by module, monitor your study streak, and see exactly where you stand before exam day.",
  },
];

const TESTIMONIALS = [
  {
    quote: "Passed my Class II Water Treatment exam on the first try. The AI explanations made the hard math questions click.",
    name: "Marcus T.",
    role: "Water Treatment Operator, Iowa",
  },
  {
    quote: "The mock exams are spot-on for the WPI format. I felt completely prepared walking into the testing center.",
    name: "Sandra K.",
    role: "Wastewater Treatment Operator, Colorado",
  },
  {
    quote: "Finally a study tool that covers all four streams. I used it for both my distribution and collection upgrades.",
    name: "Derek M.",
    role: "Utility Operator, Oregon",
  },
];

const STREAM_COLORS: Record<string, string> = {
  water: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  ww: "bg-green-500/10 text-green-400 border-green-500/20",
  dist: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
  coll: "bg-amber-500/10 text-amber-400 border-amber-500/20",
};

export default function USLanding() {
  usePageMeta({
    title: "US Water Operator Exam Prep | ABC/WPI Certification Study — Echelon Institute",
    description:
      "Prepare for your ABC/WPI water or wastewater operator certification exam. 500+ questions per level, AI tutor, timed mock exams, and flashcards for all 4 streams and 4 class levels.",
  });

  const [stateSearch, setStateSearch] = useState("");

  const filteredStates = stateSearch.trim()
    ? Object.values(US_STATE_CONFIGS).filter(s =>
        s.name.toLowerCase().includes(stateSearch.toLowerCase()) ||
        s.code.toLowerCase().includes(stateSearch.toLowerCase())
      )
    : FEATURED_US_STATES.map(code => US_STATE_CONFIGS[code]);

  return (
    <div className="min-h-screen bg-[#0a0f1a] text-white">
      {/* Nav */}
      <nav className="border-b border-white/10 bg-[#0a0f1a]/95 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/">
            <span className="text-xl font-bold text-white cursor-pointer">
              Echelon Institute
            </span>
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/us/courses">
              <Button variant="ghost" size="sm" className="text-white/70 hover:text-white">
                All Courses
              </Button>
            </Link>
            <Link href="/pricing">
              <Button variant="ghost" size="sm" className="text-white/70 hover:text-white">
                Pricing
              </Button>
            </Link>
            <Link href="/us/courses">
              <Button size="sm" className="bg-blue-600 hover:bg-blue-500 text-white">
                Start Free →
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative pt-20 pb-24 px-4 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-900/20 via-transparent to-cyan-900/10 pointer-events-none" />
        <div className="max-w-5xl mx-auto text-center relative">
          <Badge className="mb-6 bg-blue-500/10 text-blue-400 border-blue-500/20 text-sm px-4 py-1.5">
            🇺🇸 Now Available for US Operators
          </Badge>
          <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">
            Pass Your{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400">
              ABC/WPI Exam
            </span>
            <br />
            on the First Try
          </h1>
          <p className="text-xl text-white/70 mb-10 max-w-2xl mx-auto leading-relaxed">
            AI-powered exam prep for US water and wastewater operators. Aligned to the
            official 2025 WPI Need-to-Know Criteria for all four streams and all four class levels.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/us/courses">
              <Button size="lg" className="bg-blue-600 hover:bg-blue-500 text-white text-lg px-8 py-6">
                Start Studying Free →
              </Button>
            </Link>
            <Link href="/us/states">
              <Button
                size="lg"
                variant="outline"
                className="border-white/20 text-white hover:bg-white/10 text-lg px-8 py-6"
              >
                Find Your State
              </Button>
            </Link>
          </div>
          <p className="mt-4 text-white/40 text-sm">
            Free practice included · No credit card required
          </p>
        </div>
      </section>

      {/* Stats */}
      <section className="border-y border-white/10 bg-white/5 py-10 px-4">
        <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8">
          {STATS.map(s => (
            <div key={s.label} className="text-center">
              <div className="text-3xl font-bold text-white mb-1">{s.value}</div>
              <div className="text-white/50 text-sm">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Streams */}
      <section className="py-20 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">All Four Certification Streams</h2>
            <p className="text-white/60 max-w-xl mx-auto">
              Whether you're pursuing water treatment, wastewater treatment, distribution, or
              collection certification, Echelon has you covered for all four class levels.
            </p>
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            {US_STREAMS.map(stream => (
              <Card key={stream.key} className="bg-white/5 border-white/10 hover:border-white/20 transition-colors">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <span className="text-3xl">{stream.icon}</span>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-white mb-2">{stream.label}</h3>
                      <div className="flex flex-wrap gap-2 mb-4">
                        {US_LEVELS.map(level => (
                          <Badge
                            key={level.key}
                            className={`text-xs ${STREAM_COLORS[stream.key]}`}
                          >
                            {level.label}
                          </Badge>
                        ))}
                      </div>
                      <Link href={`/us/courses#${stream.key}`}>
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-white/20 text-white/70 hover:text-white hover:bg-white/10"
                        >
                          View Courses →
                        </Button>
                      </Link>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* State Finder */}
      <section className="py-20 px-4 bg-white/5 border-y border-white/10">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold mb-4">Find Your State</h2>
            <p className="text-white/60 max-w-xl mx-auto">
              Echelon covers operators in all 45 states that use the ABC/WPI standardized exam.
              Select your state to see your specific certifying authority and exam requirements.
            </p>
          </div>
          <div className="max-w-md mx-auto mb-8">
            <Input
              placeholder="Search by state name or abbreviation..."
              value={stateSearch}
              onChange={e => setStateSearch(e.target.value)}
              className="bg-white/10 border-white/20 text-white placeholder:text-white/40"
            />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
            {filteredStates.slice(0, 20).map(state => (
              <Link key={state.code} href={`/us/states/${state.slug}`}>
                <div className="bg-white/5 border border-white/10 hover:border-blue-500/40 hover:bg-blue-500/5 rounded-lg p-3 text-center cursor-pointer transition-all group">
                  <div className="text-sm font-semibold text-white group-hover:text-blue-400 transition-colors">
                    {state.code}
                  </div>
                  <div className="text-xs text-white/50 mt-0.5 truncate">{state.name}</div>
                </div>
              </Link>
            ))}
          </div>
          {!stateSearch && (
            <div className="text-center mt-6">
              <Link href="/us/states">
                <Button variant="ghost" className="text-white/50 hover:text-white">
                  View all 45 states →
                </Button>
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Everything You Need to Pass</h2>
            <p className="text-white/60 max-w-xl mx-auto">
              Built specifically for the ABC/WPI exam format, with content aligned to the
              2025 Need-to-Know Criteria for every stream and class level.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map(f => (
              <div key={f.title} className="bg-white/5 border border-white/10 rounded-xl p-6">
                <div className="text-2xl mb-3">{f.icon}</div>
                <h3 className="font-semibold text-white mb-2">{f.title}</h3>
                <p className="text-white/60 text-sm leading-relaxed">{f.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 px-4 bg-white/5 border-y border-white/10">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">Operators Who Passed</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {TESTIMONIALS.map(t => (
              <div key={t.name} className="bg-white/5 border border-white/10 rounded-xl p-6">
                <p className="text-white/80 italic mb-4 leading-relaxed">"{t.quote}"</p>
                <div>
                  <div className="font-semibold text-white text-sm">{t.name}</div>
                  <div className="text-white/50 text-xs">{t.role}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-4xl font-bold mb-6">
            Ready to Pass Your{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400">
              Operator Exam?
            </span>
          </h2>
          <p className="text-white/60 text-lg mb-10">
            Start with free practice questions today. No account required to begin.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/us/courses">
              <Button size="lg" className="bg-blue-600 hover:bg-blue-500 text-white text-lg px-10 py-6">
                Start Free Practice →
              </Button>
            </Link>
            <Link href="/pricing">
              <Button
                size="lg"
                variant="outline"
                className="border-white/20 text-white hover:bg-white/10 text-lg px-10 py-6"
              >
                View Pricing
              </Button>
            </Link>
          </div>
          <p className="mt-6 text-white/40 text-sm">
            Aligned to 2025 ABC/WPI Need-to-Know Criteria · Not affiliated with ABC or WPI
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 py-10 px-4">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="text-white/40 text-sm">
            © {new Date().getFullYear()} Echelon Institute. Not affiliated with ABC, WPI, or any state certifying authority.
          </div>
          <div className="flex gap-6 text-sm text-white/40">
            <Link href="/"><span className="hover:text-white cursor-pointer">Canada</span></Link>
            <Link href="/pricing"><span className="hover:text-white cursor-pointer">Pricing</span></Link>
            <Link href="/privacy"><span className="hover:text-white cursor-pointer">Privacy</span></Link>
            <Link href="/terms"><span className="hover:text-white cursor-pointer">Terms</span></Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
