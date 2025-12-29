import Blowfish from 'egoroof-blowfish';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import type { RekordboxOptions } from './types';
import { REKORDBOX_MAGIC } from './types';

const SQLITE_EXTENSIONS = ['.db', '.sqlite'];

export function detectRekordboxDbPath(explicit?: string): string | undefined {
  if (explicit) return explicit;

  const candidates: string[] = [];
  const home = os.homedir();

  if (process.platform === 'darwin') {
    candidates.push(
      path.join(home, 'Library', 'Application Support', 'Pioneer', 'rekordbox'),
      path.join(home, 'Library', 'Pioneer', 'rekordbox')
    );
  } else if (process.platform === 'win32') {
    const appData = process.env.APPDATA || path.join(home, 'AppData', 'Roaming');
    const localAppData = process.env.LOCALAPPDATA || path.join(home, 'AppData', 'Local');
    candidates.push(
      path.join(appData, 'Pioneer', 'rekordbox'),
      path.join(localAppData, 'Pioneer', 'rekordbox')
    );
  } else {
    // Best-effort guess for Linux/Wine environments
    candidates.push(
      path.join(home, '.Pioneer', 'rekordbox'),
      path.join(home, '.wine', 'drive_c', 'Pioneer', 'rekordbox')
    );
  }

  const dbFiles = discoverDbFiles(candidates);
  if (dbFiles.length === 0) return undefined;

  const newest = dbFiles
    .map((f) => {
      try {
        return { f, mtime: fs.statSync(f).mtimeMs };
      } catch {
        return { f, mtime: 0 };
      }
    })
    .sort((a, b) => b.mtime - a.mtime)[0];

  return newest?.f;
}

function discoverDbFiles(dirs: string[]): string[] {
  const results: string[] = [];
  for (const dir of dirs) {
    try {
      const entries = fs.readdirSync(dir);
      for (const name of entries) {
        const ext = path.extname(name).toLowerCase();
        if (SQLITE_EXTENSIONS.includes(ext) || name.toLowerCase().includes('rekordbox') && ext) {
          results.push(path.join(dir, name));
        }
      }
    } catch {
      // directory may not exist or be unreadable
    }
  }
  return results;
}

/**
 * Get the default options.json path for the current platform
 */
export function getOptionsPath(): string {
  const home = os.homedir();

  if (process.platform === 'darwin') {
    return path.join(
      home,
      'Library',
      'Application Support',
      'Pioneer',
      'rekordboxAgent',
      'storage',
      'options.json'
    );
  } else if (process.platform === 'win32') {
    const appData = process.env.APPDATA || path.join(home, 'AppData', 'Roaming');
    return path.join(appData, 'Pioneer', 'rekordboxAgent', 'storage', 'options.json');
  } else {
    // Best-effort guess for Linux/Wine
    return path.join(home, '.Pioneer', 'rekordboxAgent', 'storage', 'options.json');
  }
}

/**
 * Read and parse Rekordbox options.json
 */
export function readRekordboxOptions(): RekordboxOptions {
  const optionsPath = getOptionsPath();

  if (!fs.existsSync(optionsPath)) {
    throw new Error(`Rekordbox options.json not found at: ${optionsPath}`);
  }

  const data = fs.readFileSync(optionsPath, 'utf8');
  return JSON.parse(data) as RekordboxOptions;
}

/**
 * Get database path and decrypted password from options.json
 */
export function getRekordboxConfig(
  explicitDbPath?: string,
  explicitPassword?: string
): { dbPath: string; password: string } {
  // Use custom path/password if provided
  if (explicitDbPath && explicitPassword) {
    return {
      dbPath: explicitDbPath,
      password: explicitPassword,
    };
  }

  const options = readRekordboxOptions();

  const dbPathOption = options.options.find((opt) => opt[0] === 'db-path');
  const passwordOption = options.options.find((opt) => opt[0] === 'dp');

  if (!dbPathOption || !passwordOption) {
    throw new Error(
      'Could not find database path or password in Rekordbox options'
    );
  }

  // Decrypt password using Blowfish
  const bf = new Blowfish(
    REKORDBOX_MAGIC,
    Blowfish.MODE.ECB,
    Blowfish.PADDING.PKCS5
  );
  const encryptedPassword = Buffer.from(passwordOption[1], 'base64');
  const decryptedPassword = bf
    .decode(encryptedPassword, Blowfish.TYPE.STRING)
    .trim();

  return {
    dbPath: explicitDbPath || dbPathOption[1],
    password: explicitPassword || decryptedPassword,
  };
}
