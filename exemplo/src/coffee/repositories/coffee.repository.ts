import { ArrayCondition, BooleanCondition, CursorPage, NumberCondition, QueryParamsOperator, SortDirection, StringCondition } from "@raicampos/query-toolkit";
import { Nullable } from "@raicampos/toolkit";
import { CreateCoffeeData } from "../dto/create-coffee-data";
import { Coffee } from "../entities/coffee";


export interface ListCoffeesParams {
  params: {
    id?: Array<QueryParamsOperator<NumberCondition, number>>;
    name?: Array<QueryParamsOperator<StringCondition, string>>;
    origin?: Array<QueryParamsOperator<StringCondition, string>>;
    roast?: Array<QueryParamsOperator<StringCondition, string>>;
    flavor?: Array<QueryParamsOperator<StringCondition, string>>;
    price?: Array<QueryParamsOperator<NumberCondition, number>>;
    available?: Array<QueryParamsOperator<BooleanCondition, boolean>>;
    tags?: Array<QueryParamsOperator<ArrayCondition, string[]>>;
  }
  sort?: Record<string, SortDirection>;
  pagination?: CursorPage;
}

export interface ListCoffeesResult {
  data: Coffee[];
  pagination: CursorPage;
}

export class NotFoundError extends Error {
  readonly statusCode = 404;

  constructor(message: string) {
    super(message);
    this.name = 'NotFoundError';
  }
}

/**
 * Interface do Repository: Contrato que todas as implementações devem seguir
 */
export interface ICoffeeRepository {
  /**
   * Lista cafés com filtros e paginação
   */
  list(params: ListCoffeesParams): Promise<ListCoffeesResult>;

  /**
   * Busca um café por ID
   */
  findById(id: number): Promise<Nullable<Coffee>>;

  /**
   * Cria um novo café
   */
  create(data: CreateCoffeeData): Promise<Coffee>;
}
