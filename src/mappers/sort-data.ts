export type SortData<Model> = {
  +readonly [Property in keyof Partial<Model>]: 'asc' | 'desc';
};
