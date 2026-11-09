import { rows } from '../db/query.js';

export async function crearAlertaSiCorresponde({ equivalenciaId, capturaAnteriorId, capturaNuevaId, precioAnterior, precioNuevo, umbral }, connection) {
  const variacionSql = 'ROUND(((CAST(? AS DECIMAL(14,2))-CAST(? AS DECIMAL(14,2)))/CAST(? AS DECIMAL(14,2)))*100,4)';
  const resultado = await rows(`INSERT IGNORE INTO alertas_precio
    (equivalencia_id,captura_anterior_id,captura_nueva_id,precio_anterior,precio_nuevo,variacion_pct,umbral_pct,direccion)
    SELECT ?,?,?,?,?,${variacionSql},?,CASE WHEN CAST(? AS DECIMAL(14,2)) > CAST(? AS DECIMAL(14,2)) THEN 'alza' ELSE 'baja' END
    WHERE ABS(${variacionSql}) >= CAST(? AS DECIMAL(6,2))`,
  [equivalenciaId, capturaAnteriorId, capturaNuevaId, precioAnterior, precioNuevo,
    precioNuevo, precioAnterior, precioAnterior, umbral, precioNuevo, precioAnterior,
    precioNuevo, precioAnterior, precioAnterior, umbral], connection);
  if (!resultado.affectedRows) return null;
  const alerta = await rows('SELECT * FROM alertas_precio WHERE captura_nueva_id=?', [capturaNuevaId], connection);
  return alerta[0] ?? null;
}
export async function listAlertas({ soloNoLeidas = false, limit = 50 } = {}) {
  return rows(`SELECT a.*,p.codigo_interno,p.nombre AS producto_nombre,pr.nombre AS proveedor_nombre
    FROM alertas_precio a JOIN equivalencias e ON e.id=a.equivalencia_id JOIN productos p ON p.id=e.producto_id
    JOIN proveedores pr ON pr.id=e.proveedor_id ${soloNoLeidas ? 'WHERE a.leida=FALSE' : ''}
    ORDER BY a.creada_en DESC,a.id DESC LIMIT ?`, [limit]);
}
export async function marcarLeida(id) {
  await rows('UPDATE alertas_precio SET leida=TRUE WHERE id=?', [id]);
  const alerta = await rows('SELECT * FROM alertas_precio WHERE id=?', [id]);
  return alerta[0] ?? null;
}
