import xss from 'xss';

export function sanitizeValue<T>(value: T): T {
  if (typeof value === 'string') {
    return xss(value.trim()) as T;
  }

  if (Array.isArray(value)) {
    return value.map(item => sanitizeValue(item)) as T;
  }

  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value).map(([key, nested]) => [key, sanitizeValue(nested)]),
    ) as T;
  }

  return value;
}
