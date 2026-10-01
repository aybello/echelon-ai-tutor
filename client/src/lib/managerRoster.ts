type RosterMember = { name: string | null; email: string; totalAttempts: number; lastActive: unknown };

/** These stages reflect practice evidence, not invitation delivery or sign-in. */
export function getOperatorStudyStage(member: RosterMember): "assigned" | "studying" {
  return member.totalAttempts > 0 ? "studying" : "assigned";
}

export function filterRosterMembers<T extends RosterMember>(members: T[], search: string, stage: "all" | "assigned" | "studying"): T[] {
  const term = search.trim().toLocaleLowerCase();
  return members.filter(member => (
    stage === "all" || getOperatorStudyStage(member) === stage
  ) && (!term || `${member.name ?? ""} ${member.email}`.toLocaleLowerCase().includes(term)));
}
