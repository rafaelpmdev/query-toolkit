export type Convert<Model, Entity> = Map<
  keyof Entity,
  (value: unknown, property: keyof Model) => unknown
>;
