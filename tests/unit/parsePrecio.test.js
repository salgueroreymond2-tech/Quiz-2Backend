import { describe, expect, it } from 'vitest';
import { parsePrecio } from '../../src/utils/parsePrecio.js';

describe('parsePrecio', () => {
  it.each([['₡6 450', '6450.00'], ['6.450,00', '6450.00'], ['6450', '6450.00']])('normaliza %s', (entrada, esperado) => expect(parsePrecio(entrada)).toBe(esperado));
  it.each(['', '  ', '-20', '0', 'no es precio'])('rechaza %j', (entrada) => expect(() => parsePrecio(entrada)).toThrow());
});
