import * as equivalencias from '../repositories/equivalencias.repository.js';
import { notFound } from '../utils/errors.js';
export async function listar(req, res) { res.json({ data: await equivalencias.listEquivalencias({ productoId: req.query.producto_id, proveedorId: req.query.proveedor_id, activas: req.query.activas }) }); }
export async function crear(req, res) { res.status(201).json({ data: await equivalencias.createEquivalencia(req.body) }); }
export async function desactivar(req, res) { const valor = await equivalencias.deactivateEquivalencia(req.params.id); if (!valor) throw notFound('Equivalencia activa no encontrada'); res.status(204).send(); }
