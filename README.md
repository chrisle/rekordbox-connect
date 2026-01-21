# rekordbox-connect

Library for reading the Rekordbox SQLCipher-encrypted database and emitting events when the library or play history changes. Built to decouple Rekordbox integration out of NowPlaying into a standalone, reusable package.

## Features

- Polls the Rekordbox database file for changes (mtime-based)
- Typed events: `ready`, `db-changed`, `tracks`, `history`, `error`
- Incremental history emission (only new plays after start)
- Uses `better-sqlite3-multiple-ciphers` for SQLCipher support
- Automatically reads database path and password from Rekordbox `options.json`
- Decrypts database password using Blowfish encryption
- Configurable DB path, password, polling interval, track max rows, and history max rows

## Quick Start

```ts
import { RekordboxConnect } from 'rekordbox-connect';

const rb = new RekordboxConnect({ pollIntervalMs: 2000, maxRows: 5000, historyMaxRows: 100 });

rb.on('ready', (info) => {
  console.log('Rekordbox ready:', info);
});

rb.on('db-changed', (change) => {
  console.log('Database changed:', change);
});

rb.on('tracks', (payload) => {
  console.log('Loaded tracks:', payload.count);
});

rb.on('history', (payload) => {
  console.log('New plays:', payload.count);
});

rb.start();

// later
// rb.stop();
```

## API

### `new RekordboxConnect(options?)`

Options:

- `dbPath?: string` — Absolute path to the Rekordbox DB. If omitted, read from Rekordbox `options.json`.
- `dbPassword?: string` — Database password for SQLCipher decryption. If omitted, read and decrypted from Rekordbox `options.json`.
- `pollIntervalMs?: number` — Milliseconds between file mtime polls. Default `2000`.
- `maxRows?: number` — Limit for `tracks` emission. Default `5000`.
- `historyMaxRows?: number` — Limit for `history` emission per poll. Default `100`.

Methods:

- `start()` — Locate/open DB, emit initial `ready`, load tracks/history, and begin polling.
- `stop()` — Stop polling and close DB handle.

Events:

- `ready` — `{ dbPath, modifiedTime }` when the DB is opened.
- `db-changed` — `{ dbPath, previousModifiedTime, modifiedTime }` when file mtime increases.
- `tracks` — `{ dbPath, count, rows }` with a slice of tracks (schema best-effort per Rekordbox version).
- `history` — `{ dbPath, count, rows, lastRowId }` with new plays since the previous poll.
- `error` — `(error)` for any recoverable errors.

## Notes

- Rekordbox stores its library as a SQLCipher-encrypted SQLite database. By default, the library reads both the database path and encrypted password from Rekordbox's `options.json` file (located at `~/Library/Application Support/Pioneer/rekordboxAgent/storage/options.json` on macOS).
- The password is decrypted using Blowfish encryption before opening the database.
- If `dbPath` and `dbPassword` are not provided, the library automatically locates and reads them from `options.json`.
- Track schema varies across Rekordbox versions. When unknown, `tracks` emits raw rows from the detected song table (e.g., `djmdSong`). Map to your internal types as needed.
- History polling is rowid-based: on startup the cursor seeds to the current max rowid, so `history` only emits new plays after the library starts.

## Related Packages

- [alphatheta-connect](https://github.com/chrisle/alphatheta-connect) — Pioneer Pro DJ Link integration
- [serato-connect](https://github.com/chrisle/serato-connect) — Serato DJ integration
- [stagelinq](https://github.com/chrisle/stagelinq) — Denon StageLinq integration

These libraries power [Now Playing](https://nowplayingapp.com) — a real-time track display app for DJs and streamers.

## License

MIT
