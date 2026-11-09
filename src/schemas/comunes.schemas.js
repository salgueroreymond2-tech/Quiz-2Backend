import { z } from 'zod';

export const idSchema = z.object({ id: z.coerce.number().int().positive() });
export const paginacionSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20)
});
export const productoSchema = z.object({
  codigo_interno: z.string().trim().min(3).max(60).transform((valor) => valor.toUpperCase()),
  nombre: z.string().trim().min(3).max(180),
  descripcion: z.string().trim().max(2000).nullable().optional(),
  categoria_id: z.coerce.number().int().positive().nullable().optional(),
  unidad: z.string().trim().min(1).max(40),
  activo: z.boolean().optional()
});
export const productoPatchSchema = productoSchema.partial().refine((valor) => Object.keys(valor).length > 0, 'Indique al menos un campo para actualizar');
export const productosQuerySchema = paginacionSchema.extend({
  q: z.string().trim().min(1).max(100).optional(),
  categoria_id: z.coerce.number().int().positive().optional()
});
export const proveedorSchema = z.object({
  codigo: z.string().trim().regex(/^[a-z0-9_-]+$/).max(40).transform((valor) => valor.toLowerCase()),
  nombre: z.string().trim().min(2).max(120),
  tipo_fuente: z.enum(['json', 'csv', 'http']),
  ruta_fuente: z.string().trim().min(1).max(500),
  activo: z.boolean().optional()
});
export const equivalenciaSchema = z.object({
  producto_id: z.coerce.number().int().positive(),
  proveedor_id: z.coerce.number().int().positive(),
  sku_proveedor: z.string().trim().min(1).max(100),
  descripcion_proveedor: z.string().trim().min(1).max(2000),
  factor_unidad: z.coerce.number().positive().max(100000).default(1),
  activo: z.boolean().optional()
});
export const equivalenciasQuerySchema = z.object({
  producto_id: z.coerce.number().int().positive().optional(),
  proveedor_id: z.coerce.number().int().positive().optional(),
  activas: z.enum(['true', 'false']).optional().transform((valor) => valor === 'true')
});
export const historialQuerySchema = z.object({
  desde: z.coerce.date().optional(),
  hasta: z.coerce.date().optional(),
  proveedor_id: z.coerce.number().int().positive().optional()
}).refine((valor) => !valor.desde || !valor.hasta || valor.desde <= valor.hasta, { message: 'El rango de fechas no es válido', path: ['hasta'] });
export const ejecutarCapturaSchema = z.object({ proveedor_codigo: z.string().trim().regex(/^[a-z0-9_-]+$/).transform((valor) => valor.toLowerCase()).optional() });
export const ejecucionesQuerySchema = z.object({
  proveedor_id: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50)
});
export const alertasQuerySchema = z.object({
  solo_no_leidas: z.enum(['true', 'false']).optional().transform((valor) => valor === 'true'),
  limit: z.coerce.number().int().min(1).max(100).default(50)
});
export const umbralSchema = z.object({ umbral_pct: z.coerce.number().gt(0).max(100) });
export const fuenteFilaSchema = z.object({
  sku: z.string().trim().min(1).max(100),
  descripcion: z.string().trim().min(1).max(2000),
  precio: z.union([z.string(), z.number()]),
  disponible: z.union([z.boolean(), z.string()]).transform((valor) => valor === true || String(valor).toLowerCase() === 'true')
});
