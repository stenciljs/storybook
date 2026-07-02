import type { ClassField } from 'custom-elements-manifest';
import type { InputType, SBScalarType, SBType } from 'storybook/internal/types';

/** Extract string/number literal values from a union type string, e.g. `"'sm' | 'md' | 'lg'"`. */
export const parseLiteralValues = (typeText: string): string[] => {
  const values: string[] = [];
  for (const m of typeText.matchAll(/'([^']*)'|"([^"]*)"/g)) values.push(m[1] ?? m[2] ?? '');
  if (values.length === 0) {
    for (const m of typeText.matchAll(/(?<![.\w])-?\d+(?:\.\d+)?(?![.\w])/g)) values.push(m[0]);
  }
  return values.filter(Boolean);
};

export const inferSBType = (field: ClassField): SBType => {
  const typeText = field.type?.text ?? '';
  const scalarTypes: SBScalarType['name'][] = ['string', 'number', 'boolean', 'symbol'];
  if ((scalarTypes as string[]).includes(typeText.toLowerCase())) {
    return { name: typeText.toLowerCase() as SBScalarType['name'], raw: typeText };
  }
  if (/^\(.*\)\s*=>\s*.*$/.test(typeText)) {
    return { name: 'function', raw: typeText };
  }
  return { name: 'other', value: typeText, raw: typeText };
};

export const inferControlType = (field: ClassField): InputType['control'] => {
  const typeText = field.type?.text ?? '';
  switch (typeText) {
    case 'string':
    case 'string | undefined':
      return { type: 'text' };
    case 'number':
    case 'number | undefined':
      return { type: 'number' };
    case 'boolean':
    case 'boolean | undefined':
      return { type: 'boolean' };
    case 'Date':
    case 'Date | string':
      return { type: 'date' };
    case 'function':
    case 'function | undefined':
    case 'void':
    case 'void | undefined':
      return null;
    default: {
      const values = parseLiteralValues(typeText);
      if (values.length === 0) return { type: 'object' };
      return { type: values.length < 5 ? 'radio' : 'select' };
    }
  }
};
