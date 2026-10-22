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
      const keys = Object.keys(record);
      let alreadySorted = true;
      for (let i = 1; i < keys.length; i += 1) {
        if (keys[i] < keys[i - 1]) {
          alreadySorted = false;
          break;
        }
      }
      if (alreadySorted) {
        return current;
      }
      keys.sort();
      const sorted: Record<string, unknown> = {};
      for (let i = 0; i < keys.length; i += 1) {
        const key = keys[i];
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
