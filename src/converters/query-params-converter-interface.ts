export interface IQueryParamsConverter<Parmas> {
  build(): Record<string, Parmas>;
}
