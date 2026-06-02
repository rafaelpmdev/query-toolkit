export class ParamNormalizer {
  public static normalizeRsqlBooleanString(value: string): string {
    const operators = [
      '==',
      '!=',
      '~=',
      '!~=',
      'btw=',
      'gte=',
      'lte=',
      'gt=',
      'lt=',
      'in=',
      'out=',
      '<@',
      '@>',
      '&&',
    ];
    let matchedOperator = '';
    for (const op of operators) {
      if (value.startsWith(op)) {
        matchedOperator = op;
        break;
      }
    }

    const operand = value.substring(matchedOperator.length).trim();

    const mapBool = (val: string): string => {
      const v = val.trim().toUpperCase();
      if (v === 'TRUE' || v === 'S' || v === 'T') return 'true';
      if (v === 'FALSE' || v === 'N' || v === 'F') return 'false';
      return val;
    };

    if (operand.startsWith('(') && operand.endsWith(')')) {
      const listContent = operand.slice(1, -1);
      const normalizedList = listContent.split(',').map(mapBool).join(',');
      return `${matchedOperator}(${normalizedList})`;
    }

    return `${matchedOperator}${mapBool(operand)}`;
  }
}
