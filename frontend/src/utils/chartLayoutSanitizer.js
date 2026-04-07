const SOURCE_TYPE_BLOCKLIST = [
  /horzline/i,
  /priceline/i,
  /position/i,
  /execution/i,
  /order/i
];

const isPlainObject = (value) => value && typeof value === 'object' && !Array.isArray(value);

const cloneSerializable = (value) => {
  try {
    return JSON.parse(JSON.stringify(value));
  } catch {
    return null;
  }
};

const sanitizeNode = (value) => {
  if (Array.isArray(value)) {
    return value
      .map(sanitizeNode)
      .filter((item) => item !== undefined);
  }

  if (!isPlainObject(value)) {
    return value;
  }

  const next = {};

  Object.entries(value).forEach(([key, rawChild]) => {
    if (key === 'sources' && Array.isArray(rawChild)) {
      next[key] = rawChild
        .map(sanitizeNode)
        .filter((source) => {
          if (!isPlainObject(source)) return false;

          const type = String(source.type || source.source_type || '').trim();
          if (!type) return true;
          if (type.toLowerCase() === 'unknown') return false;

          return !SOURCE_TYPE_BLOCKLIST.some((pattern) => pattern.test(type));
        });
      return;
    }

    const child = sanitizeNode(rawChild);
    if (child !== undefined) {
      next[key] = child;
    }
  });

  return next;
};

export const sanitizeChartLayout = (layoutJson) => {
  if (!isPlainObject(layoutJson)) return null;

  const cloned = cloneSerializable(layoutJson);
  if (!isPlainObject(cloned)) return null;

  return sanitizeNode(cloned);
};