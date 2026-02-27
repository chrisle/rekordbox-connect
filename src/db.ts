import type Database from 'better-sqlite3-multiple-ciphers';
import createBetterSqlite3 from 'better-sqlite3-multiple-ciphers';
import { randomUUID } from 'node:crypto';
import fs from 'node:fs';
import type { Playlist, PlaylistTrack, RekordboxHistoryPayload, RekordboxTracksPayload, SongHistoryRecord, SongPlaylistRecord } from './types';

const DEFAULT_MAX_ROWS = 5000;
const DEFAULT_HISTORY_ROWS = 100;

// Known Rekordbox 6 table names
const HISTORY_TABLE = 'djmdSongHistory';
const CONTENT_TABLE = 'djmdContent';
const PLAYLIST_TABLE = 'djmdPlaylist';
const SONG_PLAYLIST_TABLE = 'djmdSongPlaylist';

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

  loadPlaylists(): Playlist[] | undefined {
    if (!this.db) return undefined;

    const query = `
      SELECT ID, Seq, Name, ImagePath, Attribute, ParentID, SmartList,
             created_at, updated_at
      FROM ${PLAYLIST_TABLE}
      ORDER BY Seq ASC
    `;

    try {
      return this.db.prepare(query).all() as Playlist[];
    } catch {
      return [];
    }
  }

  loadPlaylistTracks(playlistId: string): PlaylistTrack[] | undefined {
    if (!this.db) return undefined;

    const query = `
      SELECT
        sp.TrackNo AS trackNo,
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
      FROM ${SONG_PLAYLIST_TABLE} AS sp
      JOIN ${CONTENT_TABLE} AS c ON sp.ContentID = c.ID
      LEFT JOIN djmdArtist AS a ON c.ArtistID = a.ID
      LEFT JOIN djmdArtist AS rmx ON c.RemixerID = rmx.ID
      LEFT JOIN djmdAlbum AS al ON c.AlbumID = al.ID
      LEFT JOIN djmdLabel AS la ON c.LabelID = la.ID
      LEFT JOIN djmdGenre AS ge ON c.GenreID = ge.ID
      LEFT JOIN djmdKey AS k ON c.KeyID = k.ID
      WHERE sp.PlaylistID = @playlistId
      ORDER BY sp.TrackNo ASC
    `;

    try {
      return this.db.prepare(query).all({ playlistId }) as PlaylistTrack[];
    } catch {
      return [];
    }
  }

  private createPlaylistEntry(name: string, attribute: number, parentId?: string): Playlist | undefined {
    if (!this.db || this.isReadonly) return undefined;

    try {
      const seqRow = this.db.prepare(
        `SELECT MAX(Seq) AS maxSeq FROM ${PLAYLIST_TABLE}`
      ).get() as { maxSeq: number | null } | undefined;

      const nextSeq = (seqRow?.maxSeq ?? 0) + 1;
      const now = new Date().toISOString().replace('T', ' ').replace('Z', '');
      const id = randomUUID();

      const playlist: Playlist = {
        ID: id,
        Seq: nextSeq,
        Name: name,
        ImagePath: null,
        Attribute: attribute,
        ParentID: parentId ?? null,
        SmartList: null,
        created_at: now,
        updated_at: now,
      };

      this.db.prepare(`
        INSERT INTO ${PLAYLIST_TABLE} (
          ID, Seq, Name, ImagePath, Attribute, ParentID, SmartList,
          UUID, rb_data_status, rb_local_data_status, rb_local_deleted,
          rb_local_synced, usn, rb_local_usn, created_at, updated_at
        ) VALUES (
          @ID, @Seq, @Name, @ImagePath, @Attribute, @ParentID, @SmartList,
          @UUID, 0, 0, 0, 0, 0, 0, @created_at, @updated_at
        )
      `).run({ ...playlist, UUID: id });

      return playlist;
    } catch {
      return undefined;
    }
  }

  createPlaylist(name: string, parentId?: string): Playlist | undefined {
    return this.createPlaylistEntry(name, 0, parentId);
  }

  createFolder(name: string, parentId?: string): Playlist | undefined {
    return this.createPlaylistEntry(name, 1, parentId);
  }

  deletePlaylist(playlistId: string): boolean {
    if (!this.db || this.isReadonly) return false;

    try {
      const row = this.db.prepare(
        `SELECT Attribute FROM ${PLAYLIST_TABLE} WHERE ID = @playlistId`
      ).get({ playlistId }) as { Attribute: number } | undefined;

      if (!row) return false;

      // If it's a folder, check for children
      if (row.Attribute === 1) {
        const children = this.db.prepare(
          `SELECT ID FROM ${PLAYLIST_TABLE} WHERE ParentID = @playlistId`
        ).all({ playlistId }) as { ID: string }[];

        if (children.length > 0) return false;
      }

      // Delete track assignments then the playlist itself
      this.db.prepare(
        `DELETE FROM ${SONG_PLAYLIST_TABLE} WHERE PlaylistID = @playlistId`
      ).run({ playlistId });

      this.db.prepare(
        `DELETE FROM ${PLAYLIST_TABLE} WHERE ID = @playlistId`
      ).run({ playlistId });

      return true;
    } catch {
      return false;
    }
  }

  renamePlaylist(playlistId: string, name: string): boolean {
    if (!this.db || this.isReadonly) return false;

    try {
      const now = new Date().toISOString().replace('T', ' ').replace('Z', '');
      const result = this.db.prepare(
        `UPDATE ${PLAYLIST_TABLE} SET Name = @name, updated_at = @now WHERE ID = @playlistId`
      ).run({ playlistId, name, now });

      return result.changes > 0;
    } catch {
      return false;
    }
  }

  addTrackToPlaylist(playlistId: string, contentId: string): SongPlaylistRecord | undefined {
    if (!this.db || this.isReadonly) return undefined;

    try {
      const trackNoRow = this.db.prepare(
        `SELECT MAX(TrackNo) AS maxTrackNo FROM ${SONG_PLAYLIST_TABLE} WHERE PlaylistID = @playlistId`
      ).get({ playlistId }) as { maxTrackNo: number | null } | undefined;

      const nextTrackNo = (trackNoRow?.maxTrackNo ?? 0) + 1;
      const now = new Date().toISOString().replace('T', ' ').replace('Z', '');
      const id = randomUUID();

      const record: SongPlaylistRecord = {
        ID: id,
        PlaylistID: playlistId,
        ContentID: contentId,
        TrackNo: nextTrackNo,
        UUID: id,
        rb_data_status: 0,
        rb_local_data_status: 0,
        rb_local_deleted: 0,
        rb_local_synced: 0,
        usn: 0,
        rb_local_usn: 0,
        created_at: now,
        updated_at: now,
      };

      this.db.prepare(`
        INSERT INTO ${SONG_PLAYLIST_TABLE} (
          ID, PlaylistID, ContentID, TrackNo, UUID,
          rb_data_status, rb_local_data_status, rb_local_deleted,
          rb_local_synced, usn, rb_local_usn, created_at, updated_at
        ) VALUES (
          @ID, @PlaylistID, @ContentID, @TrackNo, @UUID,
          @rb_data_status, @rb_local_data_status, @rb_local_deleted,
          @rb_local_synced, @usn, @rb_local_usn, @created_at, @updated_at
        )
      `).run(record);

      return record;
    } catch {
      return undefined;
    }
  }

  removeTrackFromPlaylist(playlistId: string, contentId: string): boolean {
    if (!this.db || this.isReadonly) return false;

    try {
      const remove = this.db.transaction(() => {
        const result = this.db!.prepare(
          `DELETE FROM ${SONG_PLAYLIST_TABLE} WHERE PlaylistID = @playlistId AND ContentID = @contentId`
        ).run({ playlistId, contentId });

        if (result.changes === 0) return false;

        // Re-sequence: assign TrackNo 1,2,3... based on current order
        const remaining = this.db!.prepare(
          `SELECT ID FROM ${SONG_PLAYLIST_TABLE} WHERE PlaylistID = @playlistId ORDER BY TrackNo ASC`
        ).all({ playlistId }) as { ID: string }[];

        const updateStmt = this.db!.prepare(
          `UPDATE ${SONG_PLAYLIST_TABLE} SET TrackNo = @trackNo WHERE ID = @id`
        );

        for (let i = 0; i < remaining.length; i++) {
          updateStmt.run({ id: remaining[i].ID, trackNo: i + 1 });
        }

        return true;
      });

      return remove();
    } catch {
      return false;
    }
  }

  reorderPlaylistTrack(playlistId: string, contentId: string, newTrackNo: number): boolean {
    if (!this.db || this.isReadonly) return false;

    try {
      const reorder = this.db.transaction(() => {
        // Find the track's current record
        const record = this.db!.prepare(
          `SELECT ID FROM ${SONG_PLAYLIST_TABLE} WHERE PlaylistID = @playlistId AND ContentID = @contentId`
        ).get({ playlistId, contentId }) as { ID: string } | undefined;

        if (!record) return false;

        // Get all OTHER tracks in order
        const others = this.db!.prepare(
          `SELECT ID FROM ${SONG_PLAYLIST_TABLE} WHERE PlaylistID = @playlistId AND ID != @id ORDER BY TrackNo ASC`
        ).all({ playlistId, id: record.ID }) as { ID: string }[];

        // Insert our track at the desired position (1-indexed)
        const insertIdx = Math.max(0, Math.min(newTrackNo - 1, others.length));
        others.splice(insertIdx, 0, record);

        // Re-sequence all
        const updateStmt = this.db!.prepare(
          `UPDATE ${SONG_PLAYLIST_TABLE} SET TrackNo = @trackNo WHERE ID = @id`
        );

        for (let i = 0; i < others.length; i++) {
          updateStmt.run({ id: others[i].ID, trackNo: i + 1 });
        }

        return true;
      });

      return reorder();
    } catch {
      return false;
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
