export type Mapper<Model, Entity> = {
  +readonly [Property in keyof Partial<Model>]: keyof Entity;
};
