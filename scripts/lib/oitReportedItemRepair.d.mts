export interface OitReportedItemContent {
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  sourceTitle: string | null;
  sourceReference: string | null;
  sourceUrl: string | null;
}

export interface OitReportedItemRepair {
  bankKey: string;
  questionNum: number;
  expectedId: number;
  expected: OitReportedItemContent;
  replacement: OitReportedItemContent;
  previousContents?: readonly OitReportedItemContent[];
}

export interface OitReportedItemRow {
  id: number;
  bankKey: string;
  questionNum: number;
  question: string;
  options: string | string[];
  correctIndex: number;
  explanation: string;
  sourceTitle: string | null;
  sourceReference: string | null;
  sourceUrl: string | null;
  reviewStatus: string;
}

export interface OitReportedItemRepairPlan {
  ready: boolean;
  errors: string[];
  changes: OitReportedItemRepair[];
  unchanged: Array<{ bankKey: string; questionNum: number }>;
  planHash: string;
  applied?: boolean;
  alreadyApplied?: boolean;
  postApplyPlanHash?: string;
}

export interface OitQuestionBankMetadata {
  bankKey: string;
  totalQuestions: number;
  contentVersion: number;
}

export const OIT_REPORTED_ITEM_REPAIR_VERSION: string;
export const REPAIR_FIELDS: string[];
export const reportedOitItemRepairs: readonly OitReportedItemRepair[];
export function contentSnapshot(value: OitReportedItemContent | OitReportedItemRow): OitReportedItemContent;
export function hashReportedItemContent(value: OitReportedItemContent | OitReportedItemRow): string;
export function planReportedOitItemRepair(
  rows: OitReportedItemRow[],
  metadataBefore: OitQuestionBankMetadata,
  repairs?: readonly OitReportedItemRepair[],
): OitReportedItemRepairPlan;
export function applyReportedOitItemRepair(
  connection: any,
  options?: {
    apply?: boolean;
    expectedPlanHash?: string;
    backup?: (input: { repairVersion: string; planHash: string; rows: OitReportedItemRow[]; metadataBefore: OitQuestionBankMetadata }) => Promise<void>;
  },
): Promise<OitReportedItemRepairPlan>;
