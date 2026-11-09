import * as productos from '../repositories/productos.repository.js';
import { historialProducto } from '../repositories/capturas.repository.js';
import { compararProducto } from '../services/comparador.service.js';
import { notFound } from '../utils/errors.js';

export async function listar(req, res) {
  const resultado = await productos.listProductos({ q: req.query.q, categoriaId: req.query.categoria_id, page: req.query.page, limit: req.query.limit });
  res.json({ data: resultado.items, paginacion: { page: req.query.page, limit: req.query.limit, total: resultado.total } });
}
export async function crear(req, res) { res.status(201).json({ data: await productos.createProducto(req.body) }); }
export async function obtener(req, res) { const producto = await productos.findProductoById(req.params.id); if (!producto) throw notFound('Producto no encontrado'); res.json({ data: producto }); }
export async function actualizar(req, res) { const producto = await productos.updateProducto(req.params.id, req.body); if (!producto) throw notFound('Producto no encontrado'); res.json({ data: producto }); }
export async function precios(req, res) { res.json(await compararProducto(req.params.id)); }
export async function historial(req, res) {
  const producto = await productos.findProductoById(req.params.id); if (!producto) throw notFound('Producto no encontrado');
  res.json({ producto: { id: producto.id, codigo_interno: producto.codigo_interno, nombre: producto.nombre }, capturas: await historialProducto(req.params.id, req.query) });
}
