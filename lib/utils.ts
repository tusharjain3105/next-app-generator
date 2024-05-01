import { AuthenticationError } from "@/error";
import { type ClassValue, clsx } from "clsx";
import { QueryClient } from "react-query";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const isClient = () => typeof window !== "undefined";

export const serialize = <T>(data: T): T => JSON.parse(JSON.stringify(data));

export const slugify = (str: string, separator = "-") =>
  str?.toLowerCase().trim().replace(/\W/g, separator);

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

export const fetch2 = <T>(...props: Parameters<typeof fetch>) =>
  fetch(...props).then((res) => res.json() as T);

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (count, error) => {
        if (error instanceof AuthenticationError) return false;
        return count < 3;
      },
    },
  },
});
