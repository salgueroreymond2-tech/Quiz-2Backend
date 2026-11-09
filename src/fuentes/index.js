import * as novex from './novex.js';
import * as construplaza from './construplaza.js';
import * as epa from './epa.js';
import { AppError } from '../utils/errors.js';
import { config } from '../config.js';

const adaptadores = { novex, construplaza, epa };

export async function obtenerPrecios(proveedor) {
  if (config.fuentesModo !== 'simulado') {
    throw new AppError(503, 'SOURCE_MODE_UNAVAILABLE', 'Solo está habilitado el modo simulado en esta entrega');
  }
  const adaptador = adaptadores[proveedor.codigo];
  if (!adaptador) throw new AppError(400, 'SOURCE_NOT_SUPPORTED', `No hay adaptador simulado para ${proveedor.codigo}`);
  return adaptador.fetchPrecios(proveedor);
}
