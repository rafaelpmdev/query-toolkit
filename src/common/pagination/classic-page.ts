export const DEFAULT_PAGE_LIMIT = 10;
export const MAX_PAGE_LIMIT = 250;

export class ClassicPage {
  private readonly _limit: number;
  private readonly _page: number;
  private _total: number | undefined;

  constructor(limit: number = DEFAULT_PAGE_LIMIT, page: number = 1) {
    const parsedLimit = limit !== undefined && limit > 0 ? limit : DEFAULT_PAGE_LIMIT;
    this._limit = Math.min(parsedLimit, MAX_PAGE_LIMIT);
    this._page = Math.max(page ?? 0, 1);
    this._total = undefined;
  }

  static fromOffset(offset: number, limit: number): ClassicPage {
    const page = offset === 0 ? 1 : offset / limit + 1;
    return new ClassicPage(limit, page);
  }

  setTotal(total: number): void {
    this._total = total >= 0 ? total : 0;
  }

  get limit(): number {
    return this._limit;
  }

  get page(): number {
    return this._page;
  }

  get offset(): number {
    return (this._page - 1) * this._limit;
  }

  get total(): number | undefined {
    return this._total;
  }

  get next(): number | undefined {
    return this.hasNext ? this._page + 1 : undefined;
  }

  get previous(): number | undefined {
    return this.hasPrevious ? this._page - 1 : undefined;
  }

  get hasNext(): boolean {
    return this._page < this.totalPages;
  }

  get hasPrevious(): boolean {
    return this._page > 1;
  }

  get totalPages(): number {
    if (this._total === undefined) {
      return 0;
    }
    return Math.ceil(this._total / this._limit);
  }

  toJSON() {
    return {
      limit: this._limit,
      page: this._page,
      offset: this.offset,
      total: this._total,
      next: this.next,
      previous: this.previous,
      hasNext: this.hasNext,
      hasPrevious: this.hasPrevious,
      totalPages: this.totalPages,
    };
  }
}
