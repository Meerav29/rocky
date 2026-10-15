export interface TaskHistoryItem {
  sessionId: string;
  title: string;
  updatedAt: string;
}

export const TASK_HISTORY_KEY = "browsie:task-history:v1";

export function parseTaskHistory(value: string | null): TaskHistoryItem[] {
  if (!value) return [];

  try {
    const parsed: unknown = JSON.parse(value);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isTaskHistoryItem);
  } catch {
    return [];
  }
}

function isTaskHistoryItem(value: unknown): value is TaskHistoryItem {
  if (!value || typeof value !== "object") return false;
  const record = value as Record<string, unknown>;
  return (
    typeof record.sessionId === "string" &&
    record.sessionId.length > 0 &&
    typeof record.title === "string" &&
    record.title.length > 0 &&
    typeof record.updatedAt === "string" &&
    !Number.isNaN(Date.parse(record.updatedAt))
  );
}
