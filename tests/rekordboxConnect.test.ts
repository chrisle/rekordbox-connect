import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// Use vi.hoisted to create mock instance before vi.mock runs
const { mockDbInstance } = vi.hoisted(() => ({
  mockDbInstance: {
    open: vi.fn(),
    close: vi.fn(),
    seedHistoryCursor: vi.fn(),
    loadNewHistory: vi.fn(),
  },
}));

// Mock dependencies before importing
vi.mock('../src/detectDb', () => ({
  getRekordboxConfig: vi.fn(),
}));

vi.mock('../src/db', () => {
  const MockRekordboxDb = vi.fn(function(this: any) {
    Object.assign(this, mockDbInstance);
  });
  return { RekordboxDb: MockRekordboxDb };
});

import { RekordboxConnect } from '../src/rekordboxConnect';
import { getRekordboxConfig } from '../src/detectDb';
import { RekordboxDb } from '../src/db';

describe('RekordboxConnect', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();

    // Reset mock return values
    mockDbInstance.seedHistoryCursor.mockReturnValue(100);
    mockDbInstance.loadNewHistory.mockReturnValue({
      dbPath: '/path/to/master.db',
      count: 0,
      rows: [],
      lastRowId: 100,
    });

    vi.mocked(getRekordboxConfig).mockReturnValue({
      dbPath: '/path/to/master.db',
      password: 'testpassword',
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('constructor', () => {
    it('constructs with default options', () => {
      const rb = new RekordboxConnect();
      expect(rb).toBeInstanceOf(RekordboxConnect);
    });

    it('accepts custom poll interval', () => {
      const rb = new RekordboxConnect({ pollIntervalMs: 5000 });
      expect(rb).toBeInstanceOf(RekordboxConnect);
    });

    it('accepts explicit db path and password', () => {
      const rb = new RekordboxConnect({
        dbPath: '/custom/path.db',
        dbPassword: 'custompassword',
      });
      expect(rb).toBeInstanceOf(RekordboxConnect);
    });
  });

  describe('start', () => {
    it('emits ready event on successful start', () => {
      const rb = new RekordboxConnect();
      const readyHandler = vi.fn();
      rb.on('ready', readyHandler);

      rb.start();

      expect(readyHandler).toHaveBeenCalledWith({ dbPath: '/path/to/master.db' });
    });

    it('opens database with config from getRekordboxConfig', () => {
      const rb = new RekordboxConnect();
      rb.start();

      expect(getRekordboxConfig).toHaveBeenCalled();
      // Third arg is readonly=true (since dangerouslyModifyHistory defaults to false)
      expect(RekordboxDb).toHaveBeenCalledWith('/path/to/master.db', 'testpassword', true);
      expect(mockDbInstance.open).toHaveBeenCalled();
    });

    it('passes explicit db path and password to getRekordboxConfig', () => {
      const rb = new RekordboxConnect({
        dbPath: '/custom/path.db',
        dbPassword: 'custompassword',
      });
      rb.start();

      expect(getRekordboxConfig).toHaveBeenCalledWith('/custom/path.db', 'custompassword');
    });

    it('seeds history cursor on start', () => {
      const rb = new RekordboxConnect();
      rb.start();

      expect(mockDbInstance.seedHistoryCursor).toHaveBeenCalled();
    });

    it('emits error event when start fails', () => {
      vi.mocked(getRekordboxConfig).mockImplementation(() => {
        throw new Error('Config error');
      });

      const rb = new RekordboxConnect();
      const errorHandler = vi.fn();
      rb.on('error', errorHandler);

      rb.start();

      expect(errorHandler).toHaveBeenCalledWith(expect.any(Error));
      expect(errorHandler.mock.calls[0][0].message).toBe('Config error');
    });

    it('starts polling after successful start', () => {
      const rb = new RekordboxConnect({ pollIntervalMs: 1000 });
      rb.start();

      expect(mockDbInstance.loadNewHistory).not.toHaveBeenCalled();

      vi.advanceTimersByTime(1000);
      expect(mockDbInstance.loadNewHistory).toHaveBeenCalledTimes(1);

      vi.advanceTimersByTime(1000);
      expect(mockDbInstance.loadNewHistory).toHaveBeenCalledTimes(2);
    });
  });

  describe('stop', () => {
    it('stops polling', () => {
      const rb = new RekordboxConnect({ pollIntervalMs: 1000 });
      rb.start();

      vi.advanceTimersByTime(1000);
      expect(mockDbInstance.loadNewHistory).toHaveBeenCalledTimes(1);

      rb.stop();

      vi.advanceTimersByTime(5000);
      expect(mockDbInstance.loadNewHistory).toHaveBeenCalledTimes(1);
    });

    it('closes database connection', () => {
      const rb = new RekordboxConnect();
      rb.start();
      rb.stop();

      expect(mockDbInstance.close).toHaveBeenCalled();
    });

    it('is safe to call without start', () => {
      const rb = new RekordboxConnect();
      expect(() => rb.stop()).not.toThrow();
    });

    it('is idempotent', () => {
      const rb = new RekordboxConnect();
      rb.start();
      rb.stop();
      rb.stop();

      expect(mockDbInstance.close).toHaveBeenCalledTimes(1);
    });
  });

  describe('polling', () => {
    it('emits poll event on each poll cycle', () => {
      const rb = new RekordboxConnect({ pollIntervalMs: 1000 });
      const pollHandler = vi.fn();
      rb.on('poll', pollHandler);

      rb.start();

      vi.advanceTimersByTime(1000);
      expect(pollHandler).toHaveBeenCalledTimes(1);

      vi.advanceTimersByTime(1000);
      expect(pollHandler).toHaveBeenCalledTimes(2);
    });

    it('emits history event when new rows are found', () => {
      mockDbInstance.loadNewHistory.mockReturnValue({
        dbPath: '/path/to/master.db',
        count: 2,
        rows: [{ title: 'Track 1' }, { title: 'Track 2' }],
        lastRowId: 102,
      });

      const rb = new RekordboxConnect({ pollIntervalMs: 1000 });
      const historyHandler = vi.fn();
      rb.on('history', historyHandler);

      rb.start();
      vi.advanceTimersByTime(1000);

      expect(historyHandler).toHaveBeenCalledWith({
        dbPath: '/path/to/master.db',
        count: 2,
        rows: [{ title: 'Track 1' }, { title: 'Track 2' }],
        lastRowId: 102,
      });
    });

    it('does not emit history event when no new rows', () => {
      mockDbInstance.loadNewHistory.mockReturnValue({
        dbPath: '/path/to/master.db',
        count: 0,
        rows: [],
        lastRowId: 100,
      });

      const rb = new RekordboxConnect({ pollIntervalMs: 1000 });
      const historyHandler = vi.fn();
      rb.on('history', historyHandler);

      rb.start();
      vi.advanceTimersByTime(1000);

      expect(historyHandler).not.toHaveBeenCalled();
    });

    it('updates lastRowId after receiving history', () => {
      mockDbInstance.loadNewHistory
        .mockReturnValueOnce({
          dbPath: '/path/to/master.db',
          count: 1,
          rows: [{ title: 'Track 1', rowid: 101 }],
          lastRowId: 101,
        })
        .mockReturnValueOnce({
          dbPath: '/path/to/master.db',
          count: 0,
          rows: [],
          lastRowId: 101,
        });

      const rb = new RekordboxConnect({ pollIntervalMs: 1000 });
      rb.start();

      vi.advanceTimersByTime(1000);
      expect(mockDbInstance.loadNewHistory).toHaveBeenCalledWith(100, undefined);

      vi.advanceTimersByTime(1000);
      expect(mockDbInstance.loadNewHistory).toHaveBeenCalledWith(101, undefined);
    });

    it('passes historyMaxRows to loadNewHistory', () => {
      const rb = new RekordboxConnect({ pollIntervalMs: 1000, historyMaxRows: 50 });
      rb.start();

      vi.advanceTimersByTime(1000);

      expect(mockDbInstance.loadNewHistory).toHaveBeenCalledWith(100, 50);
    });

    it('emits error event on poll failure', () => {
      mockDbInstance.loadNewHistory.mockImplementation(() => {
        throw new Error('Poll error');
      });

      const rb = new RekordboxConnect({ pollIntervalMs: 1000 });
      const errorHandler = vi.fn();
      rb.on('error', errorHandler);

      rb.start();
      vi.advanceTimersByTime(1000);

      expect(errorHandler).toHaveBeenCalledWith(expect.any(Error));
      expect(errorHandler.mock.calls[0][0].message).toBe('Poll error');
    });

    it('continues polling after error', () => {
      mockDbInstance.loadNewHistory
        .mockImplementationOnce(() => {
          throw new Error('Transient error');
        })
        .mockReturnValue({
          dbPath: '/path/to/master.db',
          count: 0,
          rows: [],
          lastRowId: 100,
        });

      const rb = new RekordboxConnect({ pollIntervalMs: 1000 });
      const errorHandler = vi.fn();
      rb.on('error', errorHandler);

      rb.start();

      vi.advanceTimersByTime(1000);
      expect(errorHandler).toHaveBeenCalledTimes(1);

      vi.advanceTimersByTime(1000);
      expect(mockDbInstance.loadNewHistory).toHaveBeenCalledTimes(2);
    });
  });

  describe('event typing', () => {
    it('supports all documented events', () => {
      const rb = new RekordboxConnect();

      rb.on('ready', (info) => {
        expect(info.dbPath).toBeDefined();
      });

      rb.on('poll', () => {});

      rb.on('history', (payload) => {
        expect(payload.dbPath).toBeDefined();
        expect(payload.count).toBeDefined();
        expect(payload.rows).toBeDefined();
      });

      rb.on('error', (err) => {
        expect(err).toBeInstanceOf(Error);
      });

      rb.start();
      vi.advanceTimersByTime(1000);
      rb.stop();
    });
  });

  describe('popHistory', () => {
    const mockRecord = {
      rowid: 100,
      ID: 'abc123',
      HistoryID: 'hist456',
      ContentID: 'content789',
      TrackNo: 5,
      UUID: 'uuid-xyz',
      rb_data_status: 0,
      rb_local_data_status: 0,
      rb_local_deleted: 0,
      rb_local_synced: 1,
      usn: 1000,
      rb_local_usn: 1000,
      created_at: '2024-01-15 10:30:00',
      updated_at: '2024-01-15 10:30:00',
    };

    it('returns undefined when dangerouslyModifyHistory is false', () => {
      const rb = new RekordboxConnect();
      rb.start();
      const result = rb.popHistory();
      expect(result).toBeUndefined();
    });

    it('returns undefined when db is not opened', () => {
      const rb = new RekordboxConnect({ dangerouslyModifyHistory: true });
      const result = rb.popHistory();
      expect(result).toBeUndefined();
    });

    it('delegates to db.popHistory when enabled', () => {
      mockDbInstance.popHistory = vi.fn().mockReturnValue(mockRecord);

      const rb = new RekordboxConnect({ dangerouslyModifyHistory: true });
      rb.start();
      const result = rb.popHistory();

      expect(mockDbInstance.popHistory).toHaveBeenCalled();
      expect(result).toEqual(mockRecord);
    });
  });

  describe('pushHistory', () => {
    const mockRecord = {
      rowid: 100,
      ID: 'abc123',
      HistoryID: 'hist456',
      ContentID: 'content789',
      TrackNo: 5,
      UUID: 'uuid-xyz',
      rb_data_status: 0,
      rb_local_data_status: 0,
      rb_local_deleted: 0,
      rb_local_synced: 1,
      usn: 1000,
      rb_local_usn: 1000,
      created_at: '2024-01-15 10:30:00',
      updated_at: '2024-01-15 10:30:00',
    };

    it('returns false when dangerouslyModifyHistory is false', () => {
      const rb = new RekordboxConnect();
      rb.start();
      const result = rb.pushHistory(mockRecord);
      expect(result).toBe(false);
    });

    it('returns false when db is not opened', () => {
      const rb = new RekordboxConnect({ dangerouslyModifyHistory: true });
      const result = rb.pushHistory(mockRecord);
      expect(result).toBe(false);
    });

    it('delegates to db.pushHistory when enabled', () => {
      mockDbInstance.pushHistory = vi.fn().mockReturnValue(true);

      const rb = new RekordboxConnect({ dangerouslyModifyHistory: true });
      rb.start();
      const result = rb.pushHistory(mockRecord);

      expect(mockDbInstance.pushHistory).toHaveBeenCalledWith(mockRecord);
      expect(result).toBe(true);
    });
  });
});
