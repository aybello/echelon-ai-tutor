import type { CeuLearningRecord } from "../../shared/ceuLearning";
import { torontoDate } from "./learningState";

/** WWOCS upload layout: operator ID;approved WWOCS course ID;YYYYMMDD. */
export function formatWWOCSUpload(
  records: CeuLearningRecord[],
  approvedCourseId?: string
) {
  if (!approvedCourseId || !/^\d+$/.test(approvedCourseId))
    throw new Error(
      "An approved WWOCS course ID is required before preparing an upload file."
    );
  if (records.length === 0)
    throw new Error("No completed operator records to export.");
  return (
    records
      .map(record => {
        const completion = record.completion;
        if (!completion || !/^\d+$/.test(completion.operatorNumber))
          throw new Error(
            "Each exported record needs a completion and a numeric WWOCS operator ID."
          );
        const date = torontoDate(completion.at).replaceAll("-", "");
        return `${completion.operatorNumber};${approvedCourseId};${date}`;
      })
      .join("\r\n") + "\r\n"
  );
}
