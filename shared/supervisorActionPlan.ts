/**
 * Advisory next-action logic for institutional team supervisors.
 * These are study-coaching signals derived from existing platform evidence:
 * never represent them as regulatory qualification or exam-pass guarantees.
 */
export interface SupervisorEvidence {
  memberStatus: "assigned" | "revoked";
  totalAttempts: number;
  readinessScore: number;
  weakestTopic: string | null;
  examRisk: "none" | "low" | "medium" | "high" | "critical";
  daysUntilExam: number | null;
  lastActive: string | Date | null;
}
const DAY_MS = 86_400_000;
export function supervisorNextAction(record: SupervisorEvidence, now = new Date()): string {
  if (record.memberStatus !== "assigned") return "Access inactive; retain records for historical review";
  if (record.totalAttempts <= 0) return "Confirm onboarding and schedule a first diagnostic";
  if (record.examRisk === "critical" || record.examRisk === "high") {
    return "Schedule supervisor check-in before exam; review mock scores and weak topics";
  }
  if (record.lastActive) {
    const last = new Date(record.lastActive).getTime();
    if (Number.isFinite(last) && now.getTime() - last >= 14 * DAY_MS) {
      return "Follow up on study inactivity and agree a new study schedule";
    }
  }
  if (record.weakestTopic && record.readinessScore < 80) {
    return "Assign targeted practice in " + record.weakestTopic;
  }
  if (record.daysUntilExam !== null && record.daysUntilExam <= 21) {
    return "Review recent mock results and confirm exam preparation plan";
  }
  if (record.readinessScore >= 80) {
    return "Maintain practice and validate progress with a timed mock exam";
  }
  return "Continue the study plan and review progress at the next check-in";
}
/** Protect against spreadsheet formula injection as well as commas and newlines. */
export function safeSupervisorCsvCell(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return "";
  // A real number is never a formula. Prefixing it would turn -5 into the text
  // '-5, which a supervisor then cannot sort or total in a spreadsheet.
  if (typeof value === "number" && Number.isFinite(value)) return '"' + String(value) + '"';
  let cell = String(value);
  if (/^[\s\t\r\n]*[=+@-]/.test(cell)) cell = "'" + cell;
  return '"' + cell.replace(/"/g, '""') + '"';
}
