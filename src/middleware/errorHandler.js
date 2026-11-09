import { AppError } from '../utils/errors.js';
import { log } from '../utils/logger.js';

export function notFoundHandler(_req, _res, next) {
  next(new AppError(404, 'NOT_FOUND', 'Ruta no encontrada'));
}

export function errorHandler(error, _req, res, _next) {
  if (error?.code === 'ER_DUP_ENTRY') error = new AppError(409, 'CONFLICT', 'El recurso ya existe o entra en conflicto con otro registro');
  if (error?.code === 'ER_NO_REFERENCED_ROW_2' || error?.code === 'ER_ROW_IS_REFERENCED_2') error = new AppError(409, 'REFERENCE_CONFLICT', 'El recurso está relacionado con otros datos');
  if (error?.code === 'ER_TRUNCATED_WRONG_VALUE' || error?.code === 'ER_CHECK_CONSTRAINT_VIOLATED') error = new AppError(400, 'VALIDATION_ERROR', 'El formato de un dato no es válido');
  const appError = error instanceof AppError ? error : new AppError(500, 'INTERNAL_ERROR', 'Ocurrió un error interno');
  if (appError.status >= 500) log('error', 'request_error', { mensaje: error?.message, codigo: error?.code });
  res.status(appError.status).json({ error: { codigo: appError.codigo, mensaje: appError.message, detalles: appError.detalles } });
}
