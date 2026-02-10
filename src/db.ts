import type Database from 'better-sqlite3-multiple-ciphers';
import createBetterSqlite3 from 'better-sqlite3-multiple-ciphers';
import fs from 'node:fs';
import type { RekordboxHistoryPayload, RekordboxTracksPayload, SongHistoryRecord } from './types';

const DEFAULT_MAX_ROWS = 5000;
const DEFAULT_HISTORY_ROWS = 100;

// Known Rekordbox 6 table names
const HISTORY_TABLE = 'djmdSongHistory';
const CONTENT_TABLE = 'djmdContent';

export class RekordboxDb {
  private db?: Database.Database;
  private readonly isReadonly: boolean;

  constructor(
    private readonly dbPath: string,
    private readonly password: string,
    readonly: boolean = true
  ) {
    this.isReadonly = readonly;
  }

  open(): void {
    this.close();

    if (!fs.existsSync(this.dbPath)) {
      throw new Error(`Rekordbox database not found at: ${this.dbPath}`);
    }

    this.db = new createBetterSqlite3(this.dbPath, { readonly: this.isReadonly });

    // Configure SQLCipher
    this.db.pragma(`cipher='sqlcipher'`);
    this.db.pragma(`legacy=4`);
    this.db.pragma(`key='${this.password}'`);

    // Enable reading uncommitted data from WAL (see writes from Rekordbox)
    this.db.pragma(`read_uncommitted=true`);

    // Test the connection
    try {
      this.db.pragma('cipher_version');
    } catch (error) {
      this.db.close();
      throw new Error(
        'Failed to decrypt Rekordbox database. Invalid password?'
      );
    }
  }

  close(): void {
    if (!this.db) return;
    try {
      this.db.close();
    } catch {
      // ignore close errors
    }
    this.db = undefined;
  }

  loadTracks(maxRows?: number): RekordboxTracksPayload | undefined {
    if (!this.db) return;

    const limit = maxRows ?? DEFAULT_MAX_ROWS;

    // Query djmdContent with joined metadata (same structure as history query)
    const query = `
      SELECT
        c.ID AS id,
        c.FolderPath AS filePath,
        c.Title AS title,
        c.Subtitle AS subTitle,
        a.Name AS artist,
        c.ImagePath AS imagePath,
        c.BPM AS bpm,
        c.Rating AS rating,
        c.ReleaseDate AS releaseDate,
        c.Length AS length,
        c.ColorID AS colorId,
        c.Commnt AS comment,
        c.ISRC AS isrc,
        al.Name AS album,
        la.Name AS label,
        ge.Name AS genre,
        k.ScaleName AS key,
        rmx.Name AS remixer
      FROM ${CONTENT_TABLE} AS c
      LEFT JOIN djmdArtist AS a ON c.ArtistID = a.ID
      LEFT JOIN djmdArtist AS rmx ON c.RemixerID = rmx.ID
      LEFT JOIN djmdAlbum AS al ON c.AlbumID = al.ID
      LEFT JOIN djmdLabel AS la ON c.LabelID = la.ID
      LEFT JOIN djmdGenre AS ge ON c.GenreID = ge.ID
      LEFT JOIN djmdKey AS k ON c.KeyID = k.ID
      LIMIT @limit
    `;

    try {
      const rows = this.db.prepare(query).all({ limit }) as Record<string, unknown>[];
      return { dbPath: this.dbPath, count: rows.length, rows };
    } catch {
      return { dbPath: this.dbPath, count: 0, rows: [] };
    }
  }

  seedHistoryCursor(): number | undefined {
    if (!this.db) return undefined;
    try {
      const row = this.db.prepare(`SELECT MAX(rowid) as maxRowId FROM ${HISTORY_TABLE}`).get() as { maxRowId?: number } | undefined;
      return row?.maxRowId;
    } catch {
      return undefined;
    }
  }

  loadNewHistory(sinceRowId: number | undefined, maxRows?: number): RekordboxHistoryPayload | undefined {
    if (!this.db) return undefined;

    const limit = maxRows ?? DEFAULT_HISTORY_ROWS;

    // Query history with joined content and metadata tables
    const query = `
      SELECT
        h.rowid AS rowid,
        h.ID AS id,
        h.created_at,
        c.FolderPath AS filePath,
        c.Title AS title,
        c.Subtitle AS subTitle,
        a.Name AS artist,
        c.ImagePath AS imagePath,
        c.BPM AS bpm,
        c.Rating AS rating,
        c.ReleaseDate AS releaseDate,
        c.Length AS length,
        c.ColorID AS colorId,
        c.Commnt AS comment,
        c.ISRC AS isrc,
        al.Name AS album,
        la.Name AS label,
        ge.Name AS genre,
        k.ScaleName AS key,
        rmx.Name AS remixer
      FROM ${HISTORY_TABLE} AS h
      JOIN ${CONTENT_TABLE} AS c ON h.ContentID = c.ID
      LEFT JOIN djmdArtist AS a ON c.ArtistID = a.ID
      LEFT JOIN djmdArtist AS rmx ON c.RemixerID = rmx.ID
      LEFT JOIN djmdAlbum AS al ON c.AlbumID = al.ID
      LEFT JOIN djmdLabel AS la ON c.LabelID = la.ID
      LEFT JOIN djmdGenre AS ge ON c.GenreID = ge.ID
      LEFT JOIN djmdKey AS k ON c.KeyID = k.ID
      WHERE h.rowid > @since
      ORDER BY h.rowid ASC
      LIMIT @limit
    `;

    try {
      const rows = this.db
        .prepare(query)
        .all({ since: sinceRowId ?? 0, limit }) as Record<string, unknown>[];

      const lastRowId = rows.length > 0 ? (rows[rows.length - 1] as any).rowid : sinceRowId;

      return { dbPath: this.dbPath, count: rows.length, rows, lastRowId };
    } catch {
      return { dbPath: this.dbPath, count: 0, rows: [], lastRowId: sinceRowId };
    }
  }

  /**
   * Pop (remove and return) the last song history entry.
   * Only works if the database was opened with readonly=false.
   * Returns undefined if readonly or no entries exist.
   */
  popHistory(): SongHistoryRecord | undefined {
    if (!this.db || this.isReadonly) return undefined;

    try {
      // Get the last entry (highest rowid)
      const selectQuery = `
        SELECT
          rowid,
          ID,
          HistoryID,
          ContentID,
          TrackNo,
          UUID,
          rb_data_status,
          rb_local_data_status,
          rb_local_deleted,
          rb_local_synced,
          usn,
          rb_local_usn,
          created_at,
          updated_at
        FROM ${HISTORY_TABLE}
        ORDER BY rowid DESC
        LIMIT 1
      `;

      const record = this.db.prepare(selectQuery).get() as SongHistoryRecord | undefined;
      if (!record) return undefined;

      // Delete the entry
      const deleteQuery = `DELETE FROM ${HISTORY_TABLE} WHERE rowid = @rowid`;
      this.db.prepare(deleteQuery).run({ rowid: record.rowid });

      return record;
    } catch {
      return undefined;
    }
  }

  /**
   * Push (insert) a song history entry back into the database.
   * Only works if the database was opened with readonly=false.
   * The record should be one previously returned by popHistory().
   * Returns true if successful, false otherwise.
   */
  pushHistory(record: SongHistoryRecord): boolean {
    if (!this.db || this.isReadonly) return false;

    try {
      const insertQuery = `
        INSERT INTO ${HISTORY_TABLE} (
          rowid,
          ID,
          HistoryID,
          ContentID,
          TrackNo,
          UUID,
          rb_data_status,
          rb_local_data_status,
          rb_local_deleted,
          rb_local_synced,
          usn,
          rb_local_usn,
          created_at,
          updated_at
        ) VALUES (
          @rowid,
          @ID,
          @HistoryID,
          @ContentID,
          @TrackNo,
          @UUID,
          @rb_data_status,
          @rb_local_data_status,
          @rb_local_deleted,
          @rb_local_synced,
          @usn,
          @rb_local_usn,
          @created_at,
          @updated_at
        )
      `;

      this.db.prepare(insertQuery).run(record);
      return true;
    } catch {
      return false;
    }
  }
}
