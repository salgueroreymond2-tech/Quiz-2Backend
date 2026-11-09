import { rows } from '../db/query.js';

export async function ultimaCaptura(equivalenciaId, connection) {
  const resultado = await rows(`SELECT * FROM capturas_precio WHERE equivalencia_id=?
    ORDER BY capturado_en DESC,id DESC LIMIT 1 FOR UPDATE`, [equivalenciaId], connection);
  return resultado[0] ?? null;
}
export async function insertarCaptura({ equivalenciaId, precio, disponible, ejecucionId }, connection) {
  const resultado = await rows(`INSERT INTO capturas_precio (equivalencia_id,precio,disponible,ejecucion_id)
    VALUES (?,?,?,?)`, [equivalenciaId, precio, disponible, ejecucionId], connection);
  const captura = await rows('SELECT * FROM capturas_precio WHERE id=?', [resultado.insertId], connection);
  return captura[0];
}
export async function historialProducto(productoId, { desde, hasta, proveedorId }) {
  const filtros = ['e.producto_id=?']; const valores = [productoId];
  if (desde) { filtros.push('c.capturado_en >= ?'); valores.push(desde); }
  if (hasta) { filtros.push('c.capturado_en <= ?'); valores.push(hasta); }
  if (proveedorId) { filtros.push('e.proveedor_id = ?'); valores.push(proveedorId); }
  return rows(`SELECT c.*,e.sku_proveedor,e.factor_unidad,p.codigo AS proveedor_codigo,p.nombre AS proveedor_nombre,
      ROUND(c.precio/e.factor_unidad,2) AS precio_unitario_normalizado
    FROM capturas_precio c JOIN equivalencias e ON e.id=c.equivalencia_id JOIN proveedores p ON p.id=e.proveedor_id
    WHERE ${filtros.join(' AND ')} ORDER BY c.capturado_en DESC,c.id DESC`, valores);
}
export async function preciosVigentesProducto(productoId) {
  return rows(`SELECT v.*,e.sku_proveedor,e.descripcion_proveedor,e.factor_unidad,p.id AS proveedor_id,
      p.codigo AS proveedor_codigo,p.nombre AS proveedor_nombre,ROUND(v.precio/e.factor_unidad,2) AS precio_unitario_normalizado
    FROM equivalencias e JOIN proveedores p ON p.id=e.proveedor_id
    LEFT JOIN vw_precio_vigente v ON v.equivalencia_id=e.id
    WHERE e.producto_id=? AND e.activo=TRUE AND p.activo=TRUE ORDER BY p.nombre`, [productoId]);
}
