import express from 'express';
import { getPool } from './db/pool.js';
import productosRoutes from './routes/productos.routes.js';
import proveedoresRoutes from './routes/proveedores.routes.js';
import equivalenciasRoutes from './routes/equivalencias.routes.js';
import capturasRoutes from './routes/capturas.routes.js';
import alertasRoutes from './routes/alertas.routes.js';
import configuracionRoutes from './routes/configuracion.routes.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import { AppError } from './utils/errors.js';

export function createApp() {
  const app = express();
  app.disable('x-powered-by');
  app.use(express.json({ limit: '100kb' }));
  app.get('/health', async (_req, res, next) => {
    try { await getPool().execute('SELECT 1'); res.json({ estado: 'ok', base_datos: 'conectada', motor: 'mysql' }); }
    catch { next(new AppError(503, 'DATABASE_UNAVAILABLE', 'MySQL no está disponible')); }
  });
  app.use('/api/productos', productosRoutes);
  app.use('/api/proveedores', proveedoresRoutes);
  app.use('/api/equivalencias', equivalenciasRoutes);
  app.use('/api/capturas', capturasRoutes);
  app.use('/api/alertas', alertasRoutes);
  app.use('/api/configuracion', configuracionRoutes);
  app.use(notFoundHandler);
  app.use(errorHandler);
  return app;
}
