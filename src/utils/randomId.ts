export function generateAlbumId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID().replace(/-/g, '').substring(0, 8);
  }
  return Math.random().toString(36).substring(2, 10).padEnd(8, '0');
}
