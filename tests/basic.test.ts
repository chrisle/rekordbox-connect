import { describe, expect, it } from 'vitest';
import { RekordboxConnect } from '../src/index';

describe('RekordboxConnect', () => {
  it('constructs with defaults', () => {
    const rb = new RekordboxConnect();
    expect(rb).toBeInstanceOf(RekordboxConnect);
  });

  it('start and stop without crash when db is missing', () => {
    const rb = new RekordboxConnect({ dbPath: '/non/existent/path.db', pollIntervalMs: 10 });
    const events: string[] = [];
    rb.on('error', () => events.push('error'));
    rb.start();
    rb.stop();
    expect(events.includes('error')).toBe(true);
  });
});
