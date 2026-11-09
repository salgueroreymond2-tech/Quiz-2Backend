import { findProductoById } from '../repositories/productos.repository.js';
import { preciosVigentesProducto } from '../repositories/capturas.repository.js';
import { notFound } from '../utils/errors.js';

const numero = (valor) => valor === null || valor === undefined ? null : Number(valor);

export async function compararProducto(productoId) {
  const producto = await findProductoById(productoId);
  if (!producto) throw notFound('Producto no encontrado');
  const vigentes = await preciosVigentesProducto(productoId);
  const disponibles = vigentes.filter((fila) => fila.captura_id && fila.disponible).sort((a, b) => Number(a.precio_unitario_normalizado) - Number(b.precio_unitario_normalizado));
  const noDisponibles = vigentes.filter((fila) => !fila.captura_id || !fila.disponible);
  const mejor = disponibles[0];
  const convertir = (fila) => ({
    proveedor: fila.proveedor_nombre,
    proveedor_codigo: fila.proveedor_codigo,
    sku: fila.sku_proveedor,
    precio_capturado: numero(fila.precio),
    precio_unitario_normalizado: numero(fila.precio_unitario_normalizado),
    factor_unidad: numero(fila.factor_unidad),
    moneda: fila.moneda ?? 'CRC',
    disponible: Boolean(fila.disponible),
    capturado_en: fila.capturado_en,
    diferencia_crc: mejor && fila.captura_id ? Number((Number(fila.precio_unitario_normalizado) - Number(mejor.precio_unitario_normalizado)).toFixed(2)) : null,
    diferencia_pct: mejor && fila.captura_id ? Number((((Number(fila.precio_unitario_normalizado) - Number(mejor.precio_unitario_normalizado)) / Number(mejor.precio_unitario_normalizado)) * 100).toFixed(2)) : null
  });
  return {
    producto: { id: producto.id, codigo_interno: producto.codigo_interno, nombre: producto.nombre, unidad: producto.unidad },
    mejor_precio: mejor ? { proveedor: mejor.proveedor_nombre, proveedor_codigo: mejor.proveedor_codigo, precio: numero(mejor.precio_unitario_normalizado), moneda: mejor.moneda, capturado_en: mejor.capturado_en } : null,
    precios: disponibles.map(convertir),
    no_disponibles: noDisponibles.map(convertir)
  };
}
