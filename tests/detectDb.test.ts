import { beforeEach, describe, expect, it, vi } from 'vitest';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

// Mock modules before imports
vi.mock('node:fs');
vi.mock('node:os');

import {
  detectRekordboxDbPath,
  getOptionsPath,
  readRekordboxOptions,
  getRekordboxConfig,
} from '../src/detectDb';

describe('detectDb', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(os.homedir).mockReturnValue('/home/testuser');
  });

  describe('detectRekordboxDbPath', () => {
    it('returns explicit path when provided', () => {
      const explicitPath = '/custom/path/to/master.db';
      const result = detectRekordboxDbPath(explicitPath);
      expect(result).toBe(explicitPath);
    });

    it('returns undefined when no candidates exist', () => {
      vi.mocked(fs.readdirSync).mockImplementation(() => {
        throw new Error('ENOENT');
      });
      const result = detectRekordboxDbPath();
      expect(result).toBeUndefined();
    });

    it('discovers .db files in candidate directories (darwin)', () => {
      const originalPlatform = process.platform;
      Object.defineProperty(process, 'platform', { value: 'darwin' });

      vi.mocked(fs.readdirSync).mockImplementation((dir) => {
        if (dir === '/home/testuser/Library/Application Support/Pioneer/rekordbox') {
          return ['master.db', 'other.txt'] as unknown as fs.Dirent[];
        }
        throw new Error('ENOENT');
      });

      vi.mocked(fs.statSync).mockReturnValue({ mtimeMs: 1000 } as fs.Stats);

      const result = detectRekordboxDbPath();
      expect(result).toBe('/home/testuser/Library/Application Support/Pioneer/rekordbox/master.db');

      Object.defineProperty(process, 'platform', { value: originalPlatform });
    });

    it('returns newest db file when multiple exist', () => {
      const originalPlatform = process.platform;
      Object.defineProperty(process, 'platform', { value: 'darwin' });

      vi.mocked(fs.readdirSync).mockImplementation((dir) => {
        if (dir === '/home/testuser/Library/Application Support/Pioneer/rekordbox') {
          return ['old.db', 'new.db'] as unknown as fs.Dirent[];
        }
        throw new Error('ENOENT');
      });

      vi.mocked(fs.statSync).mockImplementation((filePath) => {
        if (String(filePath).includes('new.db')) {
          return { mtimeMs: 2000 } as fs.Stats;
        }
        return { mtimeMs: 1000 } as fs.Stats;
      });

      const result = detectRekordboxDbPath();
      expect(result).toBe('/home/testuser/Library/Application Support/Pioneer/rekordbox/new.db');

      Object.defineProperty(process, 'platform', { value: originalPlatform });
    });

    it('discovers .sqlite files', () => {
      const originalPlatform = process.platform;
      Object.defineProperty(process, 'platform', { value: 'darwin' });

      vi.mocked(fs.readdirSync).mockImplementation((dir) => {
        if (dir === '/home/testuser/Library/Application Support/Pioneer/rekordbox') {
          return ['library.sqlite'] as unknown as fs.Dirent[];
        }
        throw new Error('ENOENT');
      });

      vi.mocked(fs.statSync).mockReturnValue({ mtimeMs: 1000 } as fs.Stats);

      const result = detectRekordboxDbPath();
      expect(result).toBe('/home/testuser/Library/Application Support/Pioneer/rekordbox/library.sqlite');

      Object.defineProperty(process, 'platform', { value: originalPlatform });
    });

    it('handles stat errors gracefully', () => {
      const originalPlatform = process.platform;
      Object.defineProperty(process, 'platform', { value: 'darwin' });

      vi.mocked(fs.readdirSync).mockImplementation((dir) => {
        if (dir === '/home/testuser/Library/Application Support/Pioneer/rekordbox') {
          return ['master.db'] as unknown as fs.Dirent[];
        }
        throw new Error('ENOENT');
      });

      vi.mocked(fs.statSync).mockImplementation(() => {
        throw new Error('EACCES');
      });

      // Should still return the file, just with mtime 0
      const result = detectRekordboxDbPath();
      expect(result).toBe('/home/testuser/Library/Application Support/Pioneer/rekordbox/master.db');

      Object.defineProperty(process, 'platform', { value: originalPlatform });
    });
  });

  describe('getOptionsPath', () => {
    it('returns darwin path', () => {
      const originalPlatform = process.platform;
      Object.defineProperty(process, 'platform', { value: 'darwin' });

      const result = getOptionsPath();
      expect(result).toBe(
        '/home/testuser/Library/Application Support/Pioneer/rekordboxAgent/storage/options.json'
      );

      Object.defineProperty(process, 'platform', { value: originalPlatform });
    });

    it('returns win32 path using APPDATA', () => {
      const originalPlatform = process.platform;
      const originalAppData = process.env.APPDATA;
      Object.defineProperty(process, 'platform', { value: 'win32' });
      process.env.APPDATA = 'C:\\Users\\Test\\AppData\\Roaming';

      const result = getOptionsPath();
      // path.join uses native separators, so we check components instead
      expect(result).toContain('C:\\Users\\Test\\AppData\\Roaming');
      expect(result).toContain('Pioneer');
      expect(result).toContain('rekordboxAgent');
      expect(result).toContain('storage');
      expect(result).toContain('options.json');

      Object.defineProperty(process, 'platform', { value: originalPlatform });
      process.env.APPDATA = originalAppData;
    });

    it('returns win32 path fallback when APPDATA is not set', () => {
      const originalPlatform = process.platform;
      const originalAppData = process.env.APPDATA;
      Object.defineProperty(process, 'platform', { value: 'win32' });
      delete process.env.APPDATA;

      const result = getOptionsPath();
      expect(result).toContain('AppData');
      expect(result).toContain('Roaming');
      expect(result).toContain('options.json');

      Object.defineProperty(process, 'platform', { value: originalPlatform });
      process.env.APPDATA = originalAppData;
    });

    it('returns linux path', () => {
      const originalPlatform = process.platform;
      Object.defineProperty(process, 'platform', { value: 'linux' });

      const result = getOptionsPath();
      expect(result).toBe('/home/testuser/.Pioneer/rekordboxAgent/storage/options.json');

      Object.defineProperty(process, 'platform', { value: originalPlatform });
    });
  });

  describe('readRekordboxOptions', () => {
    it('throws when options.json does not exist', () => {
      vi.mocked(fs.existsSync).mockReturnValue(false);

      expect(() => readRekordboxOptions()).toThrow('Rekordbox options.json not found');
    });

    it('parses options.json correctly', () => {
      vi.mocked(fs.existsSync).mockReturnValue(true);
      vi.mocked(fs.readFileSync).mockReturnValue(
        JSON.stringify({
          options: [
            ['db-path', '/path/to/master.db'],
            ['dp', 'base64encodedpassword'],
          ],
        })
      );

      const result = readRekordboxOptions();
      expect(result.options).toHaveLength(2);
      expect(result.options[0]).toEqual(['db-path', '/path/to/master.db']);
    });
  });

  describe('getRekordboxConfig', () => {
    it('returns explicit config when both dbPath and password provided', () => {
      const result = getRekordboxConfig('/custom/path.db', 'mypassword');
      expect(result).toEqual({
        dbPath: '/custom/path.db',
        password: 'mypassword',
      });
    });

    it('throws when db-path option is missing', () => {
      vi.mocked(fs.existsSync).mockReturnValue(true);
      vi.mocked(fs.readFileSync).mockReturnValue(
        JSON.stringify({
          options: [['dp', 'base64encodedpassword']],
        })
      );

      expect(() => getRekordboxConfig()).toThrow(
        'Could not find database path or password'
      );
    });

    it('throws when dp option is missing', () => {
      vi.mocked(fs.existsSync).mockReturnValue(true);
      vi.mocked(fs.readFileSync).mockReturnValue(
        JSON.stringify({
          options: [['db-path', '/path/to/db']],
        })
      );

      expect(() => getRekordboxConfig()).toThrow(
        'Could not find database path or password'
      );
    });

    it('uses explicit dbPath but decrypts password from options', () => {
      vi.mocked(fs.existsSync).mockReturnValue(true);
      // This is a properly encrypted password using REKORDBOX_MAGIC key
      // For testing, we use a known plaintext -> ciphertext pair
      vi.mocked(fs.readFileSync).mockReturnValue(
        JSON.stringify({
          options: [
            ['db-path', '/default/path.db'],
            ['dp', 'aWZB+xNBKMo='], // Blowfish encrypted "test" with REKORDBOX_MAGIC
          ],
        })
      );

      const result = getRekordboxConfig('/custom/path.db');
      expect(result.dbPath).toBe('/custom/path.db');
      expect(typeof result.password).toBe('string');
    });
  });
});
