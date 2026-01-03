import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// Mock dependencies before importing
vi.mock('../src/detectDb', () => ({
  getRekordboxConfig: vi.fn(),
}));

vi.mock('../src/db', () => ({
  RekordboxDb: vi.fn(),
}));

import { RekordboxConnect } from '../src/rekordboxConnect';
import { getRekordboxConfig } from '../src/detectDb';
import { RekordboxDb } from '../src/db';

describe('RekordboxConnect', () => {
  let mockDbInstance: {
    open: ReturnType<typeof vi.fn>;
    close: ReturnType<typeof vi.fn>;
    seedHistoryCursor: ReturnType<typeof vi.fn>;
    loadNewHistory: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    vi.resetAllMocks();
    vi.useFakeTimers();

    mockDbInstance = {
      open: vi.fn(),
      close: vi.fn(),
      seedHistoryCursor: vi.fn().mockReturnValue(100),
      loadNewHistory: vi.fn().mockReturnValue({
        dbPath: '/path/to/master.db',
        count: 0,
        rows: [],
        lastRowId: 100,
      }),
    };

    vi.mocked(getRekordboxConfig).mockReturnValue({
      dbPath: '/path/to/master.db',
      password: 'testpassword',
    });

    vi.mocked(RekordboxDb).mockImplementation(() => mockDbInstance as any);
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
      expect(RekordboxDb).toHaveBeenCalledWith('/path/to/master.db', 'testpassword');
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
});
