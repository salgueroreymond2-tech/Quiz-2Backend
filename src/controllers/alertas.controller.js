import { listAlertas, marcarLeida } from '../repositories/alertas.repository.js';
import { notFound } from '../utils/errors.js';
export async function listar(req, res) { res.json({ data: await listAlertas({ soloNoLeidas: req.query.solo_no_leidas, limit: req.query.limit }) }); }
export async function marcarComoLeida(req, res) { const alerta = await marcarLeida(req.params.id); if (!alerta) throw notFound('Alerta no encontrada'); res.json({ data: alerta }); }
