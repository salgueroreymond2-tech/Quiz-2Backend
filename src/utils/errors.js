export class AppError extends Error {
  constructor(status, codigo, mensaje, detalles = []) {
    super(mensaje);
    this.name = 'AppError';
    this.status = status;
    this.codigo = codigo;
    this.detalles = detalles;
  }
}

export const notFound = (mensaje = 'Recurso no encontrado') => new AppError(404, 'NOT_FOUND', mensaje);
