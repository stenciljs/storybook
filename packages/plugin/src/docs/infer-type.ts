import type { JsonDocsProp } from '@stencil/core/internal';
import type { SBType, SBScalarType, InputType } from 'storybook/internal/types';

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

export const inferControlType = (prop: JsonDocsProp): InputType['control'] => {
  switch (prop.type) {
    case 'string':
      return { type: 'text' };
    case 'number':
      return { type: 'number' };
    case 'boolean':
      return { type: 'boolean' };
    case 'Date':
      return { type: 'date' };
    default:
      return { type: 'object' };
  }
};
