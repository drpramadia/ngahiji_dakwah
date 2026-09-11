import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { allNgahijiAssets } from '@/data/assets/ngahiji-assets';

describe('ngahiji asset manifest', () => {
  it('points every local public asset to an existing file', () => {
    for (const asset of allNgahijiAssets) {
      const filePath = join(process.cwd(), 'public', asset.publicPath.replace(/^\//, ''));
      expect(existsSync(filePath), asset.publicPath).toBe(true);
    }
  });

  it('keeps assets independently addressable', () => {
    const ids = new Set(allNgahijiAssets.map((asset) => asset.id));
    const paths = new Set(allNgahijiAssets.map((asset) => asset.publicPath));
    expect(ids.size).toBe(allNgahijiAssets.length);
    expect(paths.size).toBe(allNgahijiAssets.length);
  });
});
