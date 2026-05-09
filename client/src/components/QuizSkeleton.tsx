/**
 * QuizSkeleton — loading placeholder shown while question data
 * is being fetched from the database.
 *
 * When `dbUnavailable` is true, shows a friendly "starting up" message
 * with a 5-second auto-retry countdown and a progress bar animation.
 */
import { useState, useEffect, useRef } from "react";

interface QuizSkeletonProps {
  dbUnavailable?: boolean;
}

export default function QuizSkeleton({ dbUnavailable = false }: QuizSkeletonProps) {
  const [retrying, setRetrying] = useState(false);
  const [countdown, setCountdown] = useState(5);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Auto-retry countdown when DB is waking up
  useEffect(() => {
    if (!dbUnavailable) return;

    timerRef.current = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          setRetrying(true);
          window.location.reload();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [dbUnavailable]);

  if (dbUnavailable) {
    const progress = ((5 - countdown) / 5) * 100;

    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
        <div className="text-center space-y-5 max-w-md">
          {/* Animated icon */}
          <div className="mx-auto w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center">
            <svg className="w-8 h-8 text-blue-500 animate-spin" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          </div>

          {/* Message */}
          <div>
            <h2 className="text-xl font-semibold text-slate-800 mb-2">
              Starting Up…
            </h2>
            <p className="text-slate-500 text-sm leading-relaxed">
              The question database is spinning up. This takes just a few seconds on the first visit of the day.
            </p>
          </div>

          {/* Progress bar */}
          <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-blue-500 h-1.5 rounded-full transition-all duration-1000 ease-linear"
              style={{ width: `${progress}%` }}
            />
          </div>

          {/* Countdown */}
          <p className="text-sm text-slate-500">
            Retrying automatically in <strong className="text-slate-700">{countdown}s</strong>…
          </p>

          {/* Manual retry */}
          <button
            onClick={() => { setRetrying(true); window.location.reload(); }}
            disabled={retrying}
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed text-sm"
          >
            {retrying ? (
              <>
                <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Retrying…
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Retry Now
              </>
            )}
          </button>

          <p className="text-slate-400 text-xs">
            If this keeps happening, please contact support.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="text-center space-y-4">
        <div className="relative w-16 h-16 mx-auto">
          <div className="absolute inset-0 rounded-full border-4 border-slate-200" />
          <div className="absolute inset-0 rounded-full border-4 border-t-blue-600 animate-spin" />
        </div>
        <p className="text-slate-600 font-medium text-lg">
          Loading questions…
        </p>
        <p className="text-slate-400 text-sm">
          Preparing your study session
        </p>
      </div>
    </div>
  );
}
