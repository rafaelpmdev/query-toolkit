import { QueryParamsOperator } from "@raicamposs/query-toolkit";
import { Nullable } from "@raicamposs/toolkit";
import { CreateCoffeeData } from "../dto/create-coffee-data";
import { Coffee } from "../entities/coffee";


export interface ListCoffeesParams {
  id?: Array<QueryParamsOperator>;
  name?: Array<QueryParamsOperator>;
  origin?: Array<QueryParamsOperator>;
  roast?: Array<QueryParamsOperator>;
  flavor?: Array<QueryParamsOperator>;
  price?: Array<QueryParamsOperator>;
  available?: Array<QueryParamsOperator>;
  tags?: Array<QueryParamsOperator>;
  sort?: string;
  limit: number;
  offset: number;
}

export interface ListCoffeesResult {
  data: Coffee[];
  total: number;
  limit: number;
  offset: number;
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
