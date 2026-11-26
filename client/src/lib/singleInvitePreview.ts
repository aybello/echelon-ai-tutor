export interface SingleInvitePreview {
  licenceId: number;
  operatorEmail: string;
  courseName: string;
  termMonths: number;
}

export function prepareSingleInvitePreview(input: SingleInvitePreview): SingleInvitePreview | null {
  const operatorEmail = input.operatorEmail.trim().toLowerCase();
  if (!operatorEmail) return null;
  return { ...input, operatorEmail };
}
