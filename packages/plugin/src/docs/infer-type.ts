import type { JsonDocsProp } from '@stencil/core/internal';
import type { InputType, SBScalarType, SBType } from 'storybook/internal/types';

export const inferSBType = (prop: JsonDocsProp): SBType => {
  const scalarTypes: SBScalarType['name'][] = ['string', 'number', 'boolean', 'symbol'];
  if (prop.type.toLowerCase() in scalarTypes) {
    return { name: prop.type.toLowerCase(), raw: prop.type, required: prop.required } as SBScalarType;
  }

  if (/^\(.*\)\s*=>\s*.*$/.test(prop.type)) {
    return { name: 'function', raw: prop.type, required: prop.required };
  }

  return { name: 'other', value: prop.type, raw: prop.type, required: prop.required };
};

export const mapPropOptions = (prop: JsonDocsProp) =>
  prop.values.filter((value) => ['string', 'number'].includes(value.type)).map(({ value }) => value);

export const inferControlType = (prop: JsonDocsProp): InputType['control'] => {
  switch (prop.type) {
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
    default:
      const values = mapPropOptions(prop);

      if (values.length === 0) {
        return { type: 'object' };
      }
      if (values.length < 5) {
        return { type: 'radio' };
      }
      return { type: 'select' };
  }
};
