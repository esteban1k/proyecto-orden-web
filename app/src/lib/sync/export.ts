import {
  EXPORT_FORMAT,
  type AssistantManifest,
  type ExportDocument,
  type ExportList,
  type ExportTask,
  type ListSummary,
  type SyncManifest,
} from "./types";

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === "object" && !Array.isArray(value);
}

function readString(value: unknown): string {
  if (typeof value !== "string" || !value.trim()) {
    throw new Error("invalid_envelope");
  }
  return value;
}

export function contentHash(entity: unknown): string {
  const canonical = JSON.stringify(entity);
  let h = 2166136261;
  for (let i = 0; i < canonical.length; i++) {
    h ^= canonical.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return `fnv1a-${(h >>> 0).toString(16)}`;
}

export function parseExportDocument(raw: unknown): ExportDocument {
  if (!isRecord(raw)) throw new Error("invalid_envelope");
  if (raw.format !== EXPORT_FORMAT) throw new Error("invalid_envelope");
  const version = raw.version;
  if (typeof version !== "number" || !Number.isFinite(version)) {
    throw new Error("invalid_envelope");
  }
  const listsRaw = raw.lists;
  const tasksRaw = raw.tasks;
  if (!Array.isArray(listsRaw) || !Array.isArray(tasksRaw)) {
    throw new Error("invalid_envelope");
  }
  const lists: ExportList[] = listsRaw.map((row) => {
    if (!isRecord(row)) throw new Error("invalid_envelope");
    return {
      id: readString(row.id),
      title: readString(row.title),
      iconKey: typeof row.iconKey === "string" ? row.iconKey : undefined,
      focusN: typeof row.focusN === "number" ? row.focusN : undefined,
      sortOrder: typeof row.sortOrder === "number" ? row.sortOrder : undefined,
    };
  });
  const tasks: ExportTask[] = tasksRaw.map((row) => {
    if (!isRecord(row)) throw new Error("invalid_envelope");
    return {
      id: readString(row.id),
      listId: readString(row.listId),
      title: readString(row.title),
      status: typeof row.status === "string" ? row.status : undefined,
      completed: row.completed === true,
    };
  });
  return {
    format: EXPORT_FORMAT,
    version,
    exportedAt: typeof raw.exportedAt === "string" ? raw.exportedAt : undefined,
    prefs: isRecord(raw.prefs) ? raw.prefs : undefined,
    lists,
    tasks,
  };
}

export function parseExportJson(text: string): ExportDocument {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text) as unknown;
  } catch {
    throw new Error("invalid_envelope");
  }
  return parseExportDocument(parsed);
}

export function buildManifest(doc: ExportDocument): SyncManifest {
  const lists = doc.lists.map((list) => ({
    id: list.id,
    entity_rev: 1,
    content_hash: contentHash(list),
  }));
  const tasks = doc.tasks.map((task) => ({
    id: task.id,
    list_id: task.listId,
    entity_rev: 1,
    content_hash: contentHash(task),
  }));
  return { lists, tasks };
}

export function buildAssistantManifest(doc: ExportDocument): AssistantManifest {
  const prefs = doc.prefs;
  const userName =
    prefs && typeof prefs.userName === "string" ? prefs.userName : undefined;
  const dailySummary =
    prefs && typeof prefs.dailySummaryEnabled === "boolean"
      ? prefs.dailySummaryEnabled
      : undefined;
  return {
    lists: doc.lists.map((list) => ({
      id: list.id,
      title: list.title,
      icon: list.iconKey,
      focus_n: list.focusN,
    })),
    tasks: doc.tasks.map((task) => ({
      id: task.id,
      list_id: task.listId,
      title: task.title,
      state: taskStatus(task),
    })),
    prefs: {
      nickname: userName,
      summary_enabled: dailySummary,
    },
  };
}

function taskStatus(task: ExportTask): string {
  if (task.status === "completada" || task.completed) return "completada";
  if (task.status === "enProgreso") return "enProgreso";
  return "pendiente";
}

export function taskIsCompleted(task: ExportTask): boolean {
  return task.status === "completada" || task.completed === true;
}

export function summarizeLists(doc: ExportDocument): ListSummary[] {
  const byList = new Map<string, { active: number; completed: number }>();
  for (const list of doc.lists) {
    byList.set(list.id, { active: 0, completed: 0 });
  }
  for (const task of doc.tasks) {
    const bucket = byList.get(task.listId) ?? { active: 0, completed: 0 };
    if (taskIsCompleted(task)) bucket.completed += 1;
    else bucket.active += 1;
    byList.set(task.listId, bucket);
  }
  return doc.lists
    .slice()
    .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
    .map((list) => {
      const counts = byList.get(list.id) ?? { active: 0, completed: 0 };
      return {
        id: list.id,
        title: list.title,
        iconKey: list.iconKey ?? "casa",
        active: counts.active,
        completed: counts.completed,
      };
    });
}

export function encodeExportForUpload(doc: ExportDocument): string {
  return JSON.stringify({
    format: doc.format,
    version: doc.version,
    exportedAt: doc.exportedAt ?? new Date().toISOString(),
    prefs: doc.prefs ?? {},
    lists: doc.lists,
    tasks: doc.tasks,
  });
}

export function snapshotHasUserData(snap: {
  has_data?: boolean;
  envelope?: { ciphertext?: string } | null;
}): boolean {
  if (snap.has_data === true) return true;
  const ct = snap.envelope?.ciphertext;
  return typeof ct === "string" && ct.length > 0;
}

export type SummaryPrefsView = {
  dailyEnabled: boolean | null;
  weeklyEnabled: boolean | null;
  remindersMaster: boolean | null;
  scheduleNote: string | null;
  nickname: string | null;
};

function readBoolPref(prefs: Record<string, unknown>, key: string): boolean | null {
  const value = prefs[key];
  return typeof value === "boolean" ? value : null;
}

function readStringPref(prefs: Record<string, unknown>, key: string): string | null {
  const value = prefs[key];
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

/** v1 web: read summary-related prefs from mobile export (display only). */
export function summaryPrefsFromDoc(doc: ExportDocument): SummaryPrefsView {
  const prefs = doc.prefs && typeof doc.prefs === "object" ? doc.prefs : {};
  const record = prefs as Record<string, unknown>;
  const dailyEnabled = readBoolPref(record, "dailySummaryEnabled");
  const weeklyEnabled = readBoolPref(record, "weeklySummaryEnabled");
  const remindersMaster = readBoolPref(record, "remindersMasterEnabled");
  const hour =
    readStringPref(record, "dailySummaryTime") ??
    readStringPref(record, "summaryTime");
  const nickname =
    readStringPref(record, "userName") ?? readStringPref(record, "nickname");
  let scheduleNote: string | null = null;
  if (hour) scheduleNote = hour;
  return { dailyEnabled, weeklyEnabled, remindersMaster, scheduleNote, nickname };
}

export type ResumenTotals = {
  lists: number;
  pending: number;
  completed: number;
};

export function resumenTotals(doc: ExportDocument): ResumenTotals {
  let pending = 0;
  let completed = 0;
  for (const task of doc.tasks) {
    if (taskIsCompleted(task)) completed += 1;
    else pending += 1;
  }
  return { lists: doc.lists.length, pending, completed };
}