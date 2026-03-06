import EventEmitter from "node:events";
import { RekordboxDb } from "./db";
import { getRekordboxConfig } from "./detectDb";
import type { Logger } from "./types/logger";
import { noopLogger } from "./types/logger";
import type {
  Playlist,
  PlaylistTrack,
  RekordboxConnectEvents,
  RekordboxConnectOptions,
  RekordboxHistoryPayload,
  SongHistoryRecord,
  SongPlaylistRecord,
  TypedEmitter,
} from "./types";

export class RekordboxConnect extends (EventEmitter as {
  new (): TypedEmitter;
}) {
  private readonly pollIntervalMs: number;
  private readonly historyMaxRows?: number;
  private readonly explicitDbPath?: string;
  private readonly explicitDbPassword?: string;
  private readonly dangerouslyModifyDatabase: boolean;
  private readonly logger: Logger;
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
    this.logger = opts.logger ?? noopLogger;
    // Enable via option or environment variable NP_DANGEROUSLY_MODIFY_RB_DB=true
    this.dangerouslyModifyDatabase =
      opts.dangerouslyModifyDatabase ??
      process.env.NP_DANGEROUSLY_MODIFY_RB_DB === "1";
  }

  start(): void {
    try {
      // Get database path and password from options.json or explicit config
      const { dbPath, password } = getRekordboxConfig(
        this.explicitDbPath,
        this.explicitDbPassword,
      );

      this.dbPath = dbPath;
      this.db = new RekordboxDb(
        dbPath,
        password,
        !this.dangerouslyModifyDatabase,
      );
      this.db.open();

      this.lastHistoryRowId = this.db.seedHistoryCursor();
      this.logger.info("Connected to database: %s", this.dbPath);

      this.emit("ready", { dbPath: this.dbPath });

      this.timer = setInterval(() => this.pollOnce(), this.pollIntervalMs);
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      this.logger.error("Failed to start: %s", error.message);
      this.emit("error", error);
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
    this.logger.debug("Stopped");
  }

  private pollOnce(): void {
    if (!this.dbPath || !this.db) return;
    try {
      this.emit("poll");
      // Always poll history directly - mtime checks are unreliable with SQLite WAL mode
      this.loadHistorySafe();
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      this.logger.error("Poll error: %s", error.message);
      this.emit("error", error);
    }
  }

  private loadHistorySafe(): void {
    if (!this.db) return;
    try {
      const payload = this.db.loadNewHistory(
        this.lastHistoryRowId,
        this.historyMaxRows,
      ) as RekordboxHistoryPayload | undefined;
      if (payload && payload.count > 0) {
        this.lastHistoryRowId = payload.lastRowId ?? this.lastHistoryRowId;
        this.logger.debug("New history: %d rows", payload.count);
        this.emit("history", payload);
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      this.logger.error("History load error: %s", error.message);
      this.emit("error", error);
    }
  }

  /**
   * Pop (remove and return) the last song history entry.
   * Only works if dangerouslyModifyDatabase was set to true.
   * Returns undefined if not enabled or no entries exist.
   */
  popHistory(): SongHistoryRecord | undefined {
    if (!this.db || !this.dangerouslyModifyDatabase) return undefined;
    return this.db.popHistory();
  }

  /**
   * Push (insert) a song history entry back into the database.
   * Only works if dangerouslyModifyDatabase was set to true.
   * The record should be one previously returned by popHistory().
   * Returns true if successful, false otherwise.
   */
  pushHistory(record: SongHistoryRecord): boolean {
    if (!this.db || !this.dangerouslyModifyDatabase) return false;
    return this.db.pushHistory(record);
  }

  loadPlaylists(): Playlist[] | undefined {
    if (!this.db) return undefined;
    return this.db.loadPlaylists();
  }

  loadPlaylistTracks(playlistId: string): PlaylistTrack[] | undefined {
    if (!this.db) return undefined;
    return this.db.loadPlaylistTracks(playlistId);
  }

  createPlaylist(name: string, parentId?: string): Playlist | undefined {
    if (!this.db || !this.dangerouslyModifyDatabase) return undefined;
    return this.db.createPlaylist(name, parentId);
  }

  createFolder(name: string, parentId?: string): Playlist | undefined {
    if (!this.db || !this.dangerouslyModifyDatabase) return undefined;
    return this.db.createFolder(name, parentId);
  }

  deletePlaylist(playlistId: string): boolean {
    if (!this.db || !this.dangerouslyModifyDatabase) return false;
    return this.db.deletePlaylist(playlistId);
  }

  renamePlaylist(playlistId: string, name: string): boolean {
    if (!this.db || !this.dangerouslyModifyDatabase) return false;
    return this.db.renamePlaylist(playlistId, name);
  }

  addTrackToPlaylist(playlistId: string, contentId: string): SongPlaylistRecord | undefined {
    if (!this.db || !this.dangerouslyModifyDatabase) return undefined;
    return this.db.addTrackToPlaylist(playlistId, contentId);
  }

  removeTrackFromPlaylist(playlistId: string, contentId: string): boolean {
    if (!this.db || !this.dangerouslyModifyDatabase) return false;
    return this.db.removeTrackFromPlaylist(playlistId, contentId);
  }

  reorderPlaylistTrack(playlistId: string, contentId: string, newTrackNo: number): boolean {
    if (!this.db || !this.dangerouslyModifyDatabase) return false;
    return this.db.reorderPlaylistTrack(playlistId, contentId, newTrackNo);
  }
}

export type {
  Playlist,
  PlaylistTrack,
  RekordboxConnectEvents,
  RekordboxConnectOptions,
  SongHistoryRecord,
  SongPlaylistRecord,
};
