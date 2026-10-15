const FNV_OFFSET = 0x811c9dc5;
const FNV_PRIME = 0x01000193;

export function hashString(value: string): string {
  let hash = FNV_OFFSET;
  for (let i = 0; i < value.length; i += 1) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, FNV_PRIME);
  }
  return (hash >>> 0).toString(16).padStart(8, '0');
}

export function canonicalString(value: unknown): string {
  return JSON.stringify(value, (_key, current) => {
    if (current && typeof current === 'object' && !Array.isArray(current)) {
      const record = current as Record<string, unknown>;
      const sorted: Record<string, unknown> = {};
      for (const key of Object.keys(record).sort()) {
        sorted[key] = record[key];
      }
      return sorted;
    }
    return current;
  });
}

export function checksumOf(value: unknown): string {
  return hashString(canonicalString(value));
}
