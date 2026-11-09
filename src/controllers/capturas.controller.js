import { ejecutarCaptura } from '../services/captura.service.js';
import { listEjecuciones } from '../repositories/ejecuciones.repository.js';
export async function ejecutar(req, res) { res.status(200).json(await ejecutarCaptura(req.body.proveedor_codigo)); }
export async function ejecuciones(req, res) { res.json({ data: await listEjecuciones({ proveedorId: req.query.proveedor_id, limit: req.query.limit }) }); }
