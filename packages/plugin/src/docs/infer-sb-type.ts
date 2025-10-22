import type { SBType, SBScalarType } from 'storybook/internal/types';

export const inferSBType = (type: string): SBType => {
  const scalarTypes: SBScalarType['name'][] = ['string', 'number', 'boolean', 'symbol'];
  if (type.toLowerCase() in scalarTypes) {
    return { name: type.toLowerCase() } as SBScalarType;
  }

  if (/^\(.*\)\s*=>\s*.*$/.test(type)) {
    return { name: 'function' };
  }

  if (/^.*\[\]$/.test(type)) {
    const arrayType = type.slice(0, -2);
    return { name: 'array', value: inferSBType(arrayType) };
  }

  return { name: 'other', value: type };
};
