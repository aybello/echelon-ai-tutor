import { useState } from "react";
import { Link } from "wouter";
import { usePageMeta } from "@/hooks/usePageMeta";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { US_STREAMS, US_LEVELS } from "@/lib/stateConfig";

const STREAM_COLORS: Record<string, string> = {
  water: "border-blue-500/30 hover:border-blue-400/50",
  ww: "border-green-500/30 hover:border-green-400/50",
  dist: "border-cyan-500/30 hover:border-cyan-400/50",
  coll: "border-amber-500/30 hover:border-amber-400/50",
};

const STREAM_BADGE: Record<string, string> = {
  water: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  ww: "bg-green-500/10 text-green-400 border-green-500/20",
  dist: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
  coll: "bg-amber-500/10 text-amber-400 border-amber-500/20",
};

const STREAM_HEADER: Record<string, string> = {
  water: "from-blue-900/40 to-blue-800/20",
  ww: "from-green-900/40 to-green-800/20",
  dist: "from-cyan-900/40 to-cyan-800/20",
  coll: "from-amber-900/40 to-amber-800/20",
};

const STREAM_DESCRIPTIONS: Record<string, string> = {
  water: "Covers coagulation, flocculation, sedimentation, filtration, disinfection, chemical feed, source water quality, and regulatory compliance.",
  ww: "Covers primary/secondary/tertiary treatment, activated sludge, nutrient removal, biosolids, lab analysis, and equipment operation.",
  dist: "Covers pipe materials, pressure zones, cross-connection control, water quality monitoring, hydrant maintenance, and system hydraulics.",
  coll: "Covers gravity sewers, force mains, lift stations, infiltration/inflow, CCTV inspection, cleaning equipment, and confined space safety.",
};

function getQuizRoute(level: string, stream: string): string {
  const levelNum = level.replace("class", "");
  return `/wpi-class${levelNum}-${stream}`;
}

function getMockRoute(level: string, stream: string): string {
  const levelNum = level.replace("class", "");
  return `/wpi-class${levelNum}-${stream}-mock`;
}

function getFlashcardRoute(level: string, stream: string): string {
  const levelNum = level.replace("class", "");
  return `/wpi-class${levelNum}-${stream}-flashcards`;
}

export default function USCourses() {
  usePageMeta({
    title: "US Water Operator Exam Courses | All 4 Streams & 4 Levels — Echelon Institute",
    description:
      "Browse all ABC/WPI water operator certification prep courses. Water treatment, wastewater treatment, distribution, and collection — Class I through Class IV.",
  });

  const [activeStream, setActiveStream] = useState<string | null>(null);

  const displayStreams = activeStream
    ? US_STREAMS.filter(s => s.key === activeStream)
    : US_STREAMS;

  return (
    <div className="min-h-screen bg-[#0a0f1a] text-white">
      {/* Nav */}
      <nav className="border-b border-white/10 bg-[#0a0f1a]/95 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/us">
            <span className="text-white/70 hover:text-white cursor-pointer text-sm">
              ← Echelon US
            </span>
          </Link>
          <span className="text-xl font-bold text-white">All Courses</span>
          <Link href="/pricing">
            <Button size="sm" className="bg-blue-600 hover:bg-blue-500 text-white">
              Pricing
            </Button>
          </Link>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-4 py-16">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">
            All ABC/WPI Certification Courses
          </h1>
          <p className="text-white/60 max-w-xl mx-auto">
            16 courses covering all four certification streams and all four class levels.
            All courses use the same WPI question banks available to Canadian WPI provinces.
          </p>
        </div>

        {/* Stream filter */}
        <div className="flex flex-wrap justify-center gap-3 mb-12">
          <Button
            variant={activeStream === null ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveStream(null)}
            className={activeStream === null ? "bg-white text-black" : "border-white/20 text-white/70 hover:text-white"}
          >
            All Streams
          </Button>
          {US_STREAMS.map(s => (
            <Button
              key={s.key}
              variant={activeStream === s.key ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveStream(s.key)}
              className={
                activeStream === s.key
                  ? "bg-white text-black"
                  : "border-white/20 text-white/70 hover:text-white"
              }
            >
              {s.icon} {s.label}
            </Button>
          ))}
        </div>

        {/* Course cards */}
        <div className="space-y-10">
          {displayStreams.map(stream => (
            <div key={stream.key} id={stream.key}>
              {/* Stream header */}
              <div className={`bg-gradient-to-r ${STREAM_HEADER[stream.key]} border border-white/10 rounded-xl p-6 mb-4`}>
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-2xl">{stream.icon}</span>
                  <h2 className="text-xl font-bold text-white">{stream.label}</h2>
                </div>
                <p className="text-white/60 text-sm">{STREAM_DESCRIPTIONS[stream.key]}</p>
              </div>

              {/* Level cards */}
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                {US_LEVELS.map((level, idx) => (
                  <Card
                    key={level.key}
                    className={`bg-white/5 border ${STREAM_COLORS[stream.key]} transition-colors`}
                  >
                    <CardContent className="p-5">
                      <div className="flex items-center justify-between mb-3">
                        <Badge className={`text-xs ${STREAM_BADGE[stream.key]}`}>
                          {level.label}
                        </Badge>
                        {idx === 0 && (
                          <Badge className="text-xs bg-emerald-500/10 text-emerald-400 border-emerald-500/20">
                            Free Trial
                          </Badge>
                        )}
                      </div>
                      <h3 className="font-semibold text-white text-sm mb-1">
                        {stream.label}
                      </h3>
                      <p className="text-xs text-white/50 mb-4">{level.description}</p>
                      <div className="space-y-2">
                        <Link href={getQuizRoute(level.key, stream.key)}>
                          <Button
                            size="sm"
                            className="w-full bg-white/10 hover:bg-white/20 text-white text-xs"
                          >
                            Practice Quiz
                          </Button>
                        </Link>
                        <Link href={getMockRoute(level.key, stream.key)}>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="w-full text-white/60 hover:text-white text-xs"
                          >
                            Mock Exam
                          </Button>
                        </Link>
                        <Link href={getFlashcardRoute(level.key, stream.key)}>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="w-full text-white/60 hover:text-white text-xs"
                          >
                            Flashcards
                          </Button>
                        </Link>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Bottom CTA */}
        <div className="mt-16 text-center bg-white/5 border border-white/10 rounded-xl p-8">
          <h2 className="text-2xl font-bold mb-3">Need All Streams?</h2>
          <p className="text-white/60 mb-6">
            The All Access bundle gives you unlimited practice for all four streams and all four class levels.
          </p>
          <Link href="/pricing">
            <Button size="lg" className="bg-blue-600 hover:bg-blue-500 text-white">
              View Pricing →
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
