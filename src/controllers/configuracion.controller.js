import { listConfiguracion, setUmbral } from '../repositories/configuracion.repository.js';
export async function listar(_req, res) { res.json({ data: await listConfiguracion() }); }
export async function actualizarUmbral(req, res) { res.json({ data: await setUmbral(req.body.umbral_pct) }); }
