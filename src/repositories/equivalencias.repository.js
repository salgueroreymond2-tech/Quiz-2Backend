import { rows } from '../db/query.js';

export async function listEquivalencias({ productoId, proveedorId, activas = false } = {}) {
  const filtros = ['1=1']; const valores = [];
  if (productoId) { filtros.push('e.producto_id=?'); valores.push(productoId); }
  if (proveedorId) { filtros.push('e.proveedor_id=?'); valores.push(proveedorId); }
  if (activas) filtros.push('e.activo=TRUE');
  return rows(`SELECT e.*,p.codigo_interno,p.nombre AS producto_nombre,pr.codigo AS proveedor_codigo,pr.nombre AS proveedor_nombre
    FROM equivalencias e JOIN productos p ON p.id=e.producto_id JOIN proveedores pr ON pr.id=e.proveedor_id
    WHERE ${filtros.join(' AND ')} ORDER BY p.nombre,pr.nombre`, valores);
}
export async function createEquivalencia(data) {
  const resultado = await rows(`INSERT INTO equivalencias (producto_id,proveedor_id,sku_proveedor,descripcion_proveedor,factor_unidad,activo)
    VALUES (?,?,?,?,?,?)`, [data.producto_id, data.proveedor_id, data.sku_proveedor, data.descripcion_proveedor, data.factor_unidad ?? 1, data.activo ?? true]);
  const equivalencia = await rows('SELECT * FROM equivalencias WHERE id=?', [resultado.insertId]);
  return equivalencia[0];
}
export async function deactivateEquivalencia(id) {
  const actualizado = await rows('UPDATE equivalencias SET activo=FALSE WHERE id=? AND activo=TRUE', [id]);
  if (!actualizado.affectedRows) return null;
  const resultado = await rows('SELECT * FROM equivalencias WHERE id=? AND activo=FALSE', [id]);
  return resultado[0] ?? null;
}
export async function findActivaPorProveedorSku(proveedorId, sku, connection) {
  const resultado = await rows(`SELECT e.* FROM equivalencias e JOIN productos p ON p.id=e.producto_id
    WHERE e.proveedor_id=? AND e.sku_proveedor=? AND e.activo=TRUE AND p.activo=TRUE`, [proveedorId, sku], connection);
  return resultado[0] ?? null;
}
