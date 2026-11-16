/**
 * Desktop side panel for the practice page: how this session is going, topic by topic.
 * Shown only on wide screens (CSS) and only while the AI tutor panel is closed.
 */
type Answered = { module?: string; correct?: boolean };

export function summariseByModule(history: readonly Answered[]): Array<{ module: string; total: number; correct: number }> {
  const byModule = new Map<string, { total: number; correct: number }>();
  for (const item of history) {
    const name = item.module?.trim();
    if (!name) continue;
    const entry = byModule.get(name) ?? { total: 0, correct: 0 };
    entry.total += 1;
    if (item.correct) entry.correct += 1;
    byModule.set(name, entry);
  }
  return Array.from(byModule, ([module, v]) => ({ module, ...v })).sort((a, b) => b.total - a.total);
}

export default function PracticeSessionRail({ history, missedCount }: { history: readonly Answered[]; missedCount: number }) {
  const rows = summariseByModule(history);
  return (
    <aside className="practice-session-rail" aria-label="This session">
      <h2>This session</h2>
      {rows.length === 0 ? (
        <p className="practice-rail-empty">Answer a question and your topics will show up here.</p>
      ) : (
        <ul>
          {rows.map(row => {
            const pct = Math.round((row.correct / row.total) * 100);
            return (
              <li key={row.module}>
                <div className="practice-rail-row"><span>{row.module}</span><strong>{row.correct}/{row.total}</strong></div>
                <div className="practice-rail-bar" role="img" aria-label={`${pct}% correct in ${row.module}`}><span style={{ width: `${pct}%` }} /></div>
              </li>
            );
          })}
        </ul>
      )}
      {missedCount > 0 && <p className="practice-rail-missed">{missedCount} missed {missedCount === 1 ? "question" : "questions"} waiting for a retry. Use Retry Mistakes in Practice options.</p>}
    </aside>
  );
}
