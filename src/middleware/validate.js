import { AppError } from '../utils/errors.js';

export function validate(schema, origen = 'body') {
  return (req, _res, next) => {
    const resultado = schema.safeParse(req[origen]);
    if (!resultado.success) {
      return next(new AppError(400, 'VALIDATION_ERROR', 'Los datos enviados no son válidos', resultado.error.issues.map((i) => ({ campo: i.path.join('.'), mensaje: i.message }))));
    }
    req[origen] = resultado.data;
    return next();
  };
}
