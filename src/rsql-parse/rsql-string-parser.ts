import { RsqlQueryParams } from '../types';
import { OPERATORS } from '../types/operator-symbol';

/**
 * Analisador de strings RSQL para conversão de parâmetros brutos da URL em estruturas de dados tipadas.
 * Faz o processamento inicial mapeando chaves e strings de filtros condicionais.
 *
 * Exemplo: "name==John;age=gt=18"
 */
export class RsqlStringParser<T = unknown> {
  /**
   * Expressão regular estática pré-compilada para evitar pressão de GC (Garbage Collection).
   * Valida se um caractere anterior pertence ao conjunto de caracteres de palavras.
   */
  private static readonly WORD_CHAR_REGEX = /^[a-zA-Z0-9_]$/;

  /**
   * Inicializa o parser com a string bruta de filtros RSQL.
   * @param filter Filtro RSQL bruto.
   */
  constructor(private readonly filter: string) {}

  /**
   * Executa a análise sintática da string RSQL e converte para o formato RsqlQueryParams.
   * @returns Dicionário contendo os campos mapeados para seus respectivos filtros ou matriz de filtros.
   */
  parse(): RsqlQueryParams<T> {
    if (!this.filter) {
      return {} as RsqlQueryParams<T>;
    }

    const result: Record<string, string | string[]> = {};
    const andParts = this.filter.split(';');

    for (const andPart of andParts) {
      const orParts = this.splitByOrExceptArrays(andPart);

      for (const orPart of orParts) {
        const { field, rawValue } = this.splitPart(orPart);
        if (!field || !rawValue) {
          continue;
        }

        const existingValue = result[field];
        if (existingValue) {
          if (Array.isArray(existingValue)) {
            existingValue.push(rawValue);
          } else {
            result[field] = [existingValue, rawValue];
          }
        } else {
          result[field] = rawValue;
        }
      }
    }

    return result as RsqlQueryParams<T>;
  }

  /**
   * Divide uma cláusula lógica baseada no caractere de disjunção (vírgula),
   * respeitando as matrizes de arrays nativos (como in=, out=, @>, etc.).
   * @param part A expressão RSQL bruta.
   * @returns Coleção de expressões disjuntas e estruturadas.
   */
  private splitByOrExceptArrays(part: string): string[] {
    const rawParts = part.split(',');
    const validParts: string[] = [];
    let current = '';

    for (const p of rawParts) {
      const candidate = current ? `${current},${p}` : p;

      if (this.isStartOfNewCondition(p)) {
        if (current) {
          validParts.push(current);
        }
        current = p;
      } else {
        current = candidate;
      }
    }

    if (current) {
      validParts.push(current);
    }
    return validParts;
  }

  /**
   * Determina se um fragmento de texto representa o início de uma nova condição lógica válida.
   * @param text Fragmento textual a ser analisado.
   * @returns True se o texto contém algum dos operadores conhecidos do RSQL.
   */
  private isStartOfNewCondition(text: string): boolean {
    return OPERATORS.some((op) => text.includes(op));
  }

  /**
   * Extrai semanticamente o campo e seu valor bruto de uma expressão de condição RSQL.
   * @param part Expressão de condição bruta.
   * @returns Objeto com o nome do campo e a representação bruta do valor.
   */
  private splitPart(part: string): { field: string; rawValue: string } {
    const { firstOpIndex, foundOp } = this.findFirstOperator(part);

    if (firstOpIndex === -1) {
      return { field: '', rawValue: '' };
    }

    let field = part.substring(0, firstOpIndex).trim();
    const rawValue = part.substring(firstOpIndex).trim();

    if (field.endsWith('=') && !foundOp.startsWith('=')) {
      field = field.substring(0, field.length - 1).trim();
    }

    return { field, rawValue };
  }

  private isLowerCaseLetter(char: string): boolean {
    return /^[a-z]$/.test(char);
  }

  /**
   * Localiza o índice e o símbolo do primeiro operador RSQL válido presente em um fragmento.
   * @param part Expressão de condição bruta.
   * @returns O índice do início do operador e o próprio operador encontrado.
   */
  private findFirstOperator(part: string): { firstOpIndex: number; foundOp: string } {
    let firstOpIndex = -1;
    let foundOp = '';

    for (const op of OPERATORS) {
      let index = -1;
      let startSearch = 0;

      const isTextOp = this.isLowerCaseLetter(op.charAt(0));

      while (true) {
        index = part.indexOf(op, startSearch);
        if (index === -1) {
          break;
        }

        if (isTextOp && index > 0) {
          const prevChar = part[index - 1];
          if (prevChar && RsqlStringParser.WORD_CHAR_REGEX.test(prevChar)) {
            startSearch = index + 1;
            continue;
          }
        }

        if (firstOpIndex === -1 || index < firstOpIndex) {
          firstOpIndex = index;
          foundOp = op;
        }
        break;
      }
    }

    return { firstOpIndex, foundOp };
  }
}
