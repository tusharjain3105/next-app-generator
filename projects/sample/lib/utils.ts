export const isClient = () => typeof window !== "undefined";

export const serialize = <T>(data: T): T => JSON.parse(JSON.stringify(data));

export const parseQuery = (data: any) => {
  const searchParams = new URLSearchParams(data);
  const result = {} as Record<string, string | string[]>;
  for (const key of searchParams.keys()) {
    const values = searchParams.getAll(key);
    result[key] = values.length === 1 ? values[0] : values;
  }

  return result;
};

export const sortNestedObject = <T>(obj: T): T => {
  if (typeof obj !== "object" || obj === null) return obj;

  if (Array.isArray(obj)) {
    return obj.map(sortNestedObject).sort() as any;
  }

  const sortedObject = {};
  Object.keys(obj)
    .sort()
    .forEach((key) => {
      sortedObject[key] = sortNestedObject(obj[key]);
    });

  return sortedObject as any;
};
