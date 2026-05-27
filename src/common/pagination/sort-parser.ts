export type SortDirection = 'asc' | 'desc';

interface SortField {
  field: string;
  direction: SortDirection;
}

/**
 * Utilitário responsável pelo parsing de strings de ordenação (sort)
 * Suporta formatos tradicionais como:
 * - name:asc,price:desc
 * - -price,+name
 * - name,-price
 */
export class SortParser {
  /**
   * Converte uma string de ordenação em um mapeamento de campo para direção
   *
   * @param sort A string de ordenação a ser parseada
   * @returns Mapeamento no formato Record<string, SortDirection>
   */
  static parse(sort?: string | null): Record<string, SortDirection> {
    if (!this.isValidSortString(sort)) {
      return {};
    }

    const sortFields = sort
      .split(',')
      .map((part) => this.parseSingleField(part))
      .filter((field): field is SortField => field !== null);

    return this.convertToRecord(sortFields);
  }

  private static isValidSortString(sort?: string | null): sort is string {
    return typeof sort === 'string' && sort.trim().length > 0;
  }

  private static parseSingleField(part: string): SortField | null {
    let cleanPart = part.trim();
    if (!cleanPart) {
      return null;
    }

    let defaultDirection: SortDirection = 'asc';

    if (cleanPart.startsWith('-')) {
      defaultDirection = 'desc';
      cleanPart = cleanPart.substring(1).trim();
    } else if (cleanPart.startsWith('+')) {
      defaultDirection = 'asc';
      cleanPart = cleanPart.substring(1).trim();
    }

    if (!cleanPart) {
      return null;
    }

    if (cleanPart.includes(':')) {
      return this.parseExplicitDirection(cleanPart);
    }

    return {
      field: cleanPart,
      direction: defaultDirection,
    };
  }

  private static parseExplicitDirection(part: string): SortField | null {
    const [field, direction] = part.split(':');
    const cleanField = field.trim();
    if (!cleanField) {
      return null;
    }

    const cleanDirection = (direction || '').trim().toLowerCase();
    const isDescending = cleanDirection === 'desc';

    return {
      field: cleanField,
      direction: isDescending ? 'desc' : 'asc',
    };
  }

  private static convertToRecord(sortFields: SortField[]): Record<string, SortDirection> {
    return Object.fromEntries(sortFields.map(({ field, direction }) => [field, direction]));
  }
}
