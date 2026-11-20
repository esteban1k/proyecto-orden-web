export const EXPORT_FORMAT = "proyecto-orden-export" as const;

export type ExportList = {
  id: string;
  title: string;
  iconKey?: string;
  focusN?: number;
  sortOrder?: number;
};

export type ExportTask = {
  id: string;
  listId: string;
  title: string;
  status?: string;
  completed?: boolean;
};

export type ExportDocument = {
  format: typeof EXPORT_FORMAT;
  version: number;
  exportedAt?: string;
  prefs?: Record<string, unknown>;
  lists: ExportList[];
  tasks: ExportTask[];
};

export type EntityManifestEntry = {
  id: string;
  list_id?: string;
  entity_rev: number;
  content_hash: string;
};

export type SyncManifest = {
  lists: EntityManifestEntry[];
  tasks: EntityManifestEntry[];
};

export type AssistantList = {
  id: string;
  title: string;
  icon?: string;
  focus_n?: number;
};

export type AssistantTask = {
  id: string;
  list_id: string;
  title: string;
  state?: string;
};

export type AssistantPrefs = {
  reminders_master?: boolean;
  summary_enabled?: boolean;
  nickname?: string;
};

export type AssistantManifest = {
  lists: AssistantList[];
  tasks: AssistantTask[];
  prefs?: AssistantPrefs;
};

export type WireEnvelope = {
  algorithm: string;
  ciphertext: string;
  nonce?: string;
  key_id?: string;
  device_id?: string;
};

export type SnapshotResponse = {
  server_revision: number;
  envelope?: WireEnvelope | null;
  manifest?: SyncManifest;
  has_data?: boolean;
  updated_at?: string;
};

export type PutSnapshotBody = {
  base_revision?: number;
  envelope: WireEnvelope;
  manifest: SyncManifest;
  assistant_manifest: AssistantManifest;
  device_id?: string;
};

export type PutSnapshotResponse = {
  server_revision: number;
  updated_at?: string;
};

export type ListSummary = {
  id: string;
  title: string;
  iconKey: string;
  active: number;
  completed: number;
};