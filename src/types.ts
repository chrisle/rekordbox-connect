import EventEmitter from 'node:events';
import type { StrictEventEmitter } from 'strict-event-emitter-types';

export type RekordboxConnectOptions = {
  /** Optional absolute path to the Rekordbox SQLite database. If omitted, read from options.json. */
  dbPath?: string;
  /** Optional database password for SQLCipher decryption. If omitted, read from options.json. */
  dbPassword?: string;
  /** How frequently to poll the DB file modified time (ms). */
  pollIntervalMs?: number;
  /** Maximum number of tracks to fetch per emission. */
  maxRows?: number;
  /** Maximum number of new history rows to emit per poll. */
  historyMaxRows?: number;
  /**
   * DANGEROUS: Enable write access to modify song history.
   * When enabled, popHistory() and pushHistory() will actually modify the database.
   * When disabled (default), these methods are no-ops.
   * Only enable if you understand the risks of modifying the Rekordbox database.
   */
  dangerouslyModifyHistory?: boolean;
};

/**
 * Rekordbox options.json structure (partial)
 */
export interface RekordboxOptions {
  options: Array<[string, string]>;
}

/**
 * Magic string for Blowfish password decryption
 */
export const REKORDBOX_MAGIC = 'ZOwUlUZYqe9Rdm6j';

export type RekordboxReadyInfo = {
  dbPath: string;
};

export type RekordboxTracksPayload = {
  dbPath: string;
  count: number;
  rows: Record<string, unknown>[];
};

export type RekordboxHistoryPayload = {
  dbPath: string;
  count: number;
  rows: Record<string, unknown>[];
  lastRowId?: number;
};

/**
 * Full djmdSongHistory record as stored in the database.
 * Used for pop/push operations to preserve the exact record.
 */
export type SongHistoryRecord = {
  rowid: number;
  ID: string;
  HistoryID: string;
  ContentID: string;
  TrackNo: number;
  UUID: string;
  rb_data_status: number;
  rb_local_data_status: number;
  rb_local_deleted: number;
  rb_local_synced: number;
  usn: number;
  rb_local_usn: number;
  created_at: string;
  updated_at: string;
};

export interface RekordboxConnectEvents {
  ready: (info: RekordboxReadyInfo) => void;
  poll: () => void;
  tracks: (payload: RekordboxTracksPayload) => void;
  history: (payload: RekordboxHistoryPayload) => void;
  error: (err: Error) => void;
}

export type TypedEmitter = StrictEventEmitter<EventEmitter, RekordboxConnectEvents>;
