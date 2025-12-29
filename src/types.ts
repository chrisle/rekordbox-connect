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

export interface RekordboxConnectEvents {
  ready: (info: RekordboxReadyInfo) => void;
  poll: () => void;
  tracks: (payload: RekordboxTracksPayload) => void;
  history: (payload: RekordboxHistoryPayload) => void;
  error: (err: Error) => void;
}

export type TypedEmitter = StrictEventEmitter<EventEmitter, RekordboxConnectEvents>;
