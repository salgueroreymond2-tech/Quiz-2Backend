import { describe, expect, it } from 'vitest';
import { calcularVariacionPct } from '../../src/services/alertas.service.js';

describe('cálculo de variación de alertas', () => {
  it('calcula un incremento superior al umbral', () => expect(calcularVariacionPct(6300, 7100)).toBeCloseTo(12.6984, 4));
  it('calcula una disminución superior al umbral', () => expect(calcularVariacionPct(100, 90)).toBe(-10));
  it('mantiene una variación inferior al umbral', () => expect(Math.abs(calcularVariacionPct(100, 104))).toBeLessThan(5));
  it('mantiene el valor exactamente igual al umbral', () => expect(Math.abs(calcularVariacionPct(100, 105))).toBe(5));
  it('no calcula una primera captura sin precio anterior válido', () => expect(calcularVariacionPct(0, 100)).toBeNull());
  it('refleja un cambio de umbral en la evaluación del consumidor', () => {
    const variacion = Math.abs(calcularVariacionPct(100, 106));
    expect(variacion >= 5).toBe(true);
    expect(variacion >= 10).toBe(false);
  });
});
