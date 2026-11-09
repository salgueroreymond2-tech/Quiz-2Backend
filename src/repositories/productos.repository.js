import { rows } from '../db/query.js';

export async function listProductos({ q, categoriaId, page, limit }) {
  const filtros = ['1=1'];
  const valores = [];
  if (q) { valores.push(`%${q}%`); filtros.push('(p.nombre LIKE ? OR p.codigo_interno LIKE ?)'); valores.push(`%${q}%`); }
  if (categoriaId) { valores.push(categoriaId); filtros.push('p.categoria_id = ?'); }
  valores.push(limit, (page - 1) * limit);
  const resultado = await rows(`SELECT p.*, c.nombre AS categoria_nombre, COUNT(*) OVER() AS total
    FROM productos p LEFT JOIN categorias c ON c.id = p.categoria_id
    WHERE ${filtros.join(' AND ')} ORDER BY p.nombre ASC LIMIT ? OFFSET ?`, valores);
  return { items: resultado.map(({ total, ...producto }) => producto), total: Number(resultado[0]?.total ?? 0) };
}

export async function findProductoById(id) {
  const resultado = await rows('SELECT p.*, c.nombre AS categoria_nombre FROM productos p LEFT JOIN categorias c ON c.id=p.categoria_id WHERE p.id=?', [id]);
  return resultado[0] ?? null;
}

export async function createProducto(data) {
  const resultado = await rows(`INSERT INTO productos (codigo_interno,nombre,descripcion,categoria_id,unidad,activo)
    VALUES (?,?,?,?,?,?)`, [data.codigo_interno, data.nombre, data.descripcion ?? null, data.categoria_id ?? null, data.unidad, data.activo ?? true]);
  return findProductoById(resultado.insertId);
}

export async function updateProducto(id, data) {
  const campos = Object.keys(data);
  if (!campos.length) return findProductoById(id);
  const columnas = campos.map((campo) => `${campo} = ?`);
  await rows(`UPDATE productos SET ${columnas.join(', ')}, updated_at=UTC_TIMESTAMP() WHERE id=?`, [...campos.map((campo) => data[campo]), id]);
  return findProductoById(id);
}
