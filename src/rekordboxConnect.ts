import EventEmitter from 'node:events';
import { RekordboxDb } from './db';
import { getRekordboxConfig } from './detectDb';
import type {
    RekordboxConnectEvents,
    RekordboxConnectOptions,
    RekordboxHistoryPayload,
    TypedEmitter,
} from './types';

export class RekordboxConnect extends (EventEmitter as { new (): TypedEmitter }) {
  private readonly pollIntervalMs: number;
  private readonly historyMaxRows?: number;
  private readonly explicitDbPath?: string;
  private readonly explicitDbPassword?: string;
  private dbPath?: string;
  private timer?: NodeJS.Timeout;
  private db?: RekordboxDb;
  private lastHistoryRowId?: number;

  constructor(opts: RekordboxConnectOptions = {}) {
    super();
    this.pollIntervalMs = opts.pollIntervalMs ?? 2000;
    this.explicitDbPath = opts.dbPath;
    this.explicitDbPassword = opts.dbPassword;
    this.historyMaxRows = opts.historyMaxRows;
  }

  start(): void {
    try {
      // Get database path and password from options.json or explicit config
      const { dbPath, password } = getRekordboxConfig(
        this.explicitDbPath,
        this.explicitDbPassword
      );

      this.dbPath = dbPath;
      this.db = new RekordboxDb(dbPath, password);
      this.db.open();

      this.lastHistoryRowId = this.db.seedHistoryCursor();

      this.emit('ready', { dbPath: this.dbPath });

      this.timer = setInterval(() => this.pollOnce(), this.pollIntervalMs);
    } catch (err) {
      this.emit('error', err instanceof Error ? err : new Error(String(err)));
    }
  }

  stop(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = undefined;
    }
    if (this.db) {
      this.db.close();
      this.db = undefined;
    }
  }

  private pollOnce(): void {
    if (!this.dbPath || !this.db) return;
    try {
      this.emit('poll');
      // Always poll history directly - mtime checks are unreliable with SQLite WAL mode
      this.loadHistorySafe();
    } catch (err) {
      this.emit('error', err instanceof Error ? err : new Error(String(err)));
    }
  }

  private loadHistorySafe(): void {
    if (!this.db) return;
    try {
      const payload = this.db.loadNewHistory(this.lastHistoryRowId, this.historyMaxRows) as RekordboxHistoryPayload | undefined;
      if (payload && payload.count > 0) {
        this.lastHistoryRowId = payload.lastRowId ?? this.lastHistoryRowId;
        this.emit('history', payload);
      }
    } catch (err) {
      this.emit('error', err instanceof Error ? err : new Error(String(err)));
    }
  }
}

export type { RekordboxConnectEvents, RekordboxConnectOptions };
