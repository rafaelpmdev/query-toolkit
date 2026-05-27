import { SortDirection } from '../../common';

/**
 * Interface para visitantes que convertem sort parameters
 * @template T - Tipo de retorno da conversão
 */
export interface ISortConverter<T> {
  sort(sort?: Record<string, SortDirection>): T | undefined;
}
