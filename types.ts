export type ValueOfArray<T extends readonly any[] | any[]> = T extends
  | readonly (infer R)[]
  | (infer R)[]
  ? R
  : never;
