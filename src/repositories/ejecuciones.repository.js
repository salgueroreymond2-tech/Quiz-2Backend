import { rows } from '../db/query.js';

export async function crearEjecucion(proveedorId) {
  const resultado = await rows('INSERT INTO ejecuciones_captura (proveedor_id) VALUES (?)', [proveedorId]);
  const ejecucion = await rows('SELECT * FROM ejecuciones_captura WHERE id=?', [resultado.insertId]);
  return ejecucion[0];
}
export async function finalizarEjecucion(id, { estado, leidos, guardados, mensaje }) {
  await rows('UPDATE ejecuciones_captura SET finalizada_en=UTC_TIMESTAMP(),estado=?,leidos=?,guardados=?,mensaje=? WHERE id=?', [estado, leidos, guardados, mensaje ?? null, id]);
  const ejecucion = await rows('SELECT * FROM ejecuciones_captura WHERE id=?', [id]);
  return ejecucion[0];
}
export async function listEjecuciones({ proveedorId, limit }) {
  const valores = []; const filtros = [];
  if (proveedorId) { filtros.push('e.proveedor_id=?'); valores.push(proveedorId); }
  valores.push(limit);
  return rows(`SELECT e.*,p.codigo AS proveedor_codigo,p.nombre AS proveedor_nombre FROM ejecuciones_captura e
    JOIN proveedores p ON p.id=e.proveedor_id ${filtros.length ? `WHERE ${filtros.join(' AND ')}` : ''}
    ORDER BY e.iniciada_en DESC,e.id DESC LIMIT ?`, valores);
}
export const registrarError = (ejecucionId, tipo, detalle) => rows('INSERT INTO errores_captura (ejecucion_id,tipo,detalle) VALUES (?,?,?)', [ejecucionId, tipo, JSON.stringify(detalle)]);
