import type Database from 'better-sqlite3-multiple-ciphers';
import createBetterSqlite3 from 'better-sqlite3-multiple-ciphers';
import fs from 'node:fs';
import type { RekordboxHistoryPayload, RekordboxTracksPayload } from './types';

const DEFAULT_MAX_ROWS = 5000;
const DEFAULT_HISTORY_ROWS = 100;

// Known Rekordbox 6 table names
const HISTORY_TABLE = 'djmdSongHistory';
const CONTENT_TABLE = 'djmdContent';

export class RekordboxDb {
  private db?: Database.Database;

  constructor(
    private readonly dbPath: string,
    private readonly password: string
  ) {}

  open(): void {
    this.close();

    if (!fs.existsSync(this.dbPath)) {
      throw new Error(`Rekordbox database not found at: ${this.dbPath}`);
    }

    this.db = new createBetterSqlite3(this.dbPath, { readonly: true });

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
}
