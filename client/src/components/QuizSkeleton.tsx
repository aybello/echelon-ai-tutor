/**
 * QuizSkeleton — loading placeholder shown while question data
 * is being fetched from the database.
 */
export default function QuizSkeleton() {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="text-center space-y-4">
        <div className="relative w-16 h-16 mx-auto">
          <div className="absolute inset-0 rounded-full border-4 border-slate-200" />
          <div className="absolute inset-0 rounded-full border-4 border-t-blue-600 animate-spin" />
        </div>
        <p className="text-slate-600 font-medium text-lg">
          Loading questions...
        </p>
        <p className="text-slate-400 text-sm">
          Preparing your study session
        </p>
      </div>
    </div>
  );
}
