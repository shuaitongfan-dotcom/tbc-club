import { describe, it, expect } from 'vitest';
import { generateAlbumId } from './randomId';

describe('generateAlbumId', () => {
  it('should generate an 8-character string', () => {
    const id = generateAlbumId();
    expect(typeof id).toBe('string');
    expect(id.length).toBe(8);
  });

  it('should generate unique ids', () => {
    const id1 = generateAlbumId();
    const id2 = generateAlbumId();
    expect(id1).not.toBe(id2);
  });
});
