import { rows } from '../db/query.js';

export async function listProveedores({ soloActivos = false } = {}) {
  return rows(`SELECT * FROM proveedores ${soloActivos ? 'WHERE activo=TRUE' : ''} ORDER BY nombre`);
}
export async function findProveedorByCodigo(codigo) {
  const resultado = await rows('SELECT * FROM proveedores WHERE codigo=?', [codigo]);
  return resultado[0] ?? null;
}
export async function createProveedor(data) {
  const resultado = await rows('INSERT INTO proveedores (codigo,nombre,tipo_fuente,ruta_fuente,activo) VALUES (?,?,?,?,?)', [data.codigo, data.nombre, data.tipo_fuente, data.ruta_fuente, data.activo ?? true]);
  const proveedor = await rows('SELECT * FROM proveedores WHERE id=?', [resultado.insertId]);
  return proveedor[0];
}
