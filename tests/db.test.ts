import { beforeEach, describe, expect, it, vi } from 'vitest';
import fs from 'node:fs';

// Create hoisted mock that persists across vi.mock hoisting
const { mockDb } = vi.hoisted(() => ({
  mockDb: {
    pragma: vi.fn(),
    prepare: vi.fn(),
    close: vi.fn(),
  },
}));

// Mock modules
vi.mock('node:fs');
vi.mock('better-sqlite3-multiple-ciphers', () => {
  const MockBetterSqlite = vi.fn(function(this: any) {
    Object.assign(this, mockDb);
  });
  return { default: MockBetterSqlite };
});

import createBetterSqlite3 from 'better-sqlite3-multiple-ciphers';
import { RekordboxDb } from '../src/db';

describe('RekordboxDb', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset mock implementations to default behavior
    mockDb.pragma.mockReset();
    mockDb.prepare.mockReset();
    mockDb.close.mockReset();
  });

  describe('open', () => {
    it('throws when database file does not exist', () => {
      vi.mocked(fs.existsSync).mockReturnValue(false);

      const db = new RekordboxDb('/path/to/missing.db', 'password');
      expect(() => db.open()).toThrow('Rekordbox database not found at: /path/to/missing.db');
    });

    it('opens database with correct SQLCipher pragmas', () => {
      vi.mocked(fs.existsSync).mockReturnValue(true);

      const db = new RekordboxDb('/path/to/master.db', 'mypassword');
      db.open();

      expect(createBetterSqlite3).toHaveBeenCalledWith('/path/to/master.db', { readonly: true });
      expect(mockDb.pragma).toHaveBeenCalledWith("cipher='sqlcipher'");
      expect(mockDb.pragma).toHaveBeenCalledWith('legacy=4');
      expect(mockDb.pragma).toHaveBeenCalledWith("key='mypassword'");
      expect(mockDb.pragma).toHaveBeenCalledWith('read_uncommitted=true');
    });

    it('throws on decryption failure', () => {
      vi.mocked(fs.existsSync).mockReturnValue(true);
      mockDb.pragma.mockImplementation((cmd: string) => {
        if (cmd === 'cipher_version') {
          throw new Error('file is not a database');
        }
      });

      const db = new RekordboxDb('/path/to/master.db', 'wrongpassword');
      expect(() => db.open()).toThrow('Failed to decrypt Rekordbox database');
      expect(mockDb.close).toHaveBeenCalled();
    });

    it('closes existing connection before reopening', () => {
      vi.mocked(fs.existsSync).mockReturnValue(true);

      const db = new RekordboxDb('/path/to/master.db', 'password');
      db.open();
      db.open(); // open again

      expect(mockDb.close).toHaveBeenCalledTimes(1);
    });
  });

  describe('close', () => {
    it('closes database connection', () => {
      vi.mocked(fs.existsSync).mockReturnValue(true);

      const db = new RekordboxDb('/path/to/master.db', 'password');
      db.open();
      db.close();

      expect(mockDb.close).toHaveBeenCalled();
    });

    it('handles close errors gracefully', () => {
      vi.mocked(fs.existsSync).mockReturnValue(true);
      mockDb.close.mockImplementation(() => {
        throw new Error('close error');
      });

      const db = new RekordboxDb('/path/to/master.db', 'password');
      db.open();
      expect(() => db.close()).not.toThrow();
    });

    it('is idempotent', () => {
      const db = new RekordboxDb('/path/to/master.db', 'password');
      expect(() => db.close()).not.toThrow();
      expect(() => db.close()).not.toThrow();
    });
  });

  describe('loadTracks', () => {
    it('returns undefined when database not opened', () => {
      const db = new RekordboxDb('/path/to/master.db', 'password');
      const result = db.loadTracks();
      expect(result).toBeUndefined();
    });

    it('loads tracks with default limit', () => {
      vi.mocked(fs.existsSync).mockReturnValue(true);

      const mockRows = [
        { id: 1, title: 'Track 1', artist: 'Artist 1' },
        { id: 2, title: 'Track 2', artist: 'Artist 2' },
      ];

      mockDb.prepare.mockReturnValue({
        all: vi.fn().mockReturnValue(mockRows),
      });

      const db = new RekordboxDb('/path/to/master.db', 'password');
      db.open();
      const result = db.loadTracks();

      expect(result).toEqual({
        dbPath: '/path/to/master.db',
        count: 2,
        rows: mockRows,
      });
      expect(mockDb.prepare).toHaveBeenCalledWith(expect.stringContaining('djmdContent'));
    });

    it('loads tracks with custom limit', () => {
      vi.mocked(fs.existsSync).mockReturnValue(true);

      mockDb.prepare.mockReturnValue({
        all: vi.fn().mockReturnValue([]),
      });

      const db = new RekordboxDb('/path/to/master.db', 'password');
      db.open();
      db.loadTracks(10);

      expect(mockDb.prepare().all).toHaveBeenCalledWith({ limit: 10 });
    });

    it('returns empty result on query error', () => {
      vi.mocked(fs.existsSync).mockReturnValue(true);

      mockDb.prepare.mockReturnValue({
        all: vi.fn().mockImplementation(() => {
          throw new Error('query error');
        }),
      });

      const db = new RekordboxDb('/path/to/master.db', 'password');
      db.open();
      const result = db.loadTracks();

      expect(result).toEqual({
        dbPath: '/path/to/master.db',
        count: 0,
        rows: [],
      });
    });
  });

  describe('seedHistoryCursor', () => {
    it('returns undefined when database not opened', () => {
      const db = new RekordboxDb('/path/to/master.db', 'password');
      const result = db.seedHistoryCursor();
      expect(result).toBeUndefined();
    });

    it('returns max rowid from history table', () => {
      vi.mocked(fs.existsSync).mockReturnValue(true);

      mockDb.prepare.mockReturnValue({
        get: vi.fn().mockReturnValue({ maxRowId: 42 }),
      });

      const db = new RekordboxDb('/path/to/master.db', 'password');
      db.open();
      const result = db.seedHistoryCursor();

      expect(result).toBe(42);
      expect(mockDb.prepare).toHaveBeenCalledWith(expect.stringContaining('djmdSongHistory'));
    });

    it('returns undefined when table is empty', () => {
      vi.mocked(fs.existsSync).mockReturnValue(true);

      mockDb.prepare.mockReturnValue({
        get: vi.fn().mockReturnValue({ maxRowId: undefined }),
      });

      const db = new RekordboxDb('/path/to/master.db', 'password');
      db.open();
      const result = db.seedHistoryCursor();

      expect(result).toBeUndefined();
    });

    it('returns undefined on query error', () => {
      vi.mocked(fs.existsSync).mockReturnValue(true);

      mockDb.prepare.mockReturnValue({
        get: vi.fn().mockImplementation(() => {
          throw new Error('query error');
        }),
      });

      const db = new RekordboxDb('/path/to/master.db', 'password');
      db.open();
      const result = db.seedHistoryCursor();

      expect(result).toBeUndefined();
    });
  });

  describe('loadNewHistory', () => {
    it('returns undefined when database not opened', () => {
      const db = new RekordboxDb('/path/to/master.db', 'password');
      const result = db.loadNewHistory(0);
      expect(result).toBeUndefined();
    });

    it('loads history rows since given rowid', () => {
      vi.mocked(fs.existsSync).mockReturnValue(true);

      const mockRows = [
        { rowid: 43, title: 'Track 1' },
        { rowid: 44, title: 'Track 2' },
      ];

      mockDb.prepare.mockReturnValue({
        all: vi.fn().mockReturnValue(mockRows),
      });

      const db = new RekordboxDb('/path/to/master.db', 'password');
      db.open();
      const result = db.loadNewHistory(42);

      expect(result).toEqual({
        dbPath: '/path/to/master.db',
        count: 2,
        rows: mockRows,
        lastRowId: 44,
      });
      expect(mockDb.prepare().all).toHaveBeenCalledWith({ since: 42, limit: 100 });
    });

    it('uses 0 as default since value when undefined', () => {
      vi.mocked(fs.existsSync).mockReturnValue(true);

      mockDb.prepare.mockReturnValue({
        all: vi.fn().mockReturnValue([]),
      });

      const db = new RekordboxDb('/path/to/master.db', 'password');
      db.open();
      db.loadNewHistory(undefined);

      expect(mockDb.prepare().all).toHaveBeenCalledWith({ since: 0, limit: 100 });
    });

    it('uses custom maxRows limit', () => {
      vi.mocked(fs.existsSync).mockReturnValue(true);

      mockDb.prepare.mockReturnValue({
        all: vi.fn().mockReturnValue([]),
      });

      const db = new RekordboxDb('/path/to/master.db', 'password');
      db.open();
      db.loadNewHistory(0, 50);

      expect(mockDb.prepare().all).toHaveBeenCalledWith({ since: 0, limit: 50 });
    });

    it('returns original sinceRowId when no new rows', () => {
      vi.mocked(fs.existsSync).mockReturnValue(true);

      mockDb.prepare.mockReturnValue({
        all: vi.fn().mockReturnValue([]),
      });

      const db = new RekordboxDb('/path/to/master.db', 'password');
      db.open();
      const result = db.loadNewHistory(42);

      expect(result).toEqual({
        dbPath: '/path/to/master.db',
        count: 0,
        rows: [],
        lastRowId: 42,
      });
    });

    it('returns empty result on query error', () => {
      vi.mocked(fs.existsSync).mockReturnValue(true);

      mockDb.prepare.mockReturnValue({
        all: vi.fn().mockImplementation(() => {
          throw new Error('query error');
        }),
      });

      const db = new RekordboxDb('/path/to/master.db', 'password');
      db.open();
      const result = db.loadNewHistory(42);

      expect(result).toEqual({
        dbPath: '/path/to/master.db',
        count: 0,
        rows: [],
        lastRowId: 42,
      });
    });
  });
});
