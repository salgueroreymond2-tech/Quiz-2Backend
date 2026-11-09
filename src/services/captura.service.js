import { getPool, withTransaction } from '../db/pool.js';
import { listProveedores, findProveedorByCodigo } from '../repositories/proveedores.repository.js';
import { crearEjecucion, finalizarEjecucion, registrarError } from '../repositories/ejecuciones.repository.js';
import { findActivaPorProveedorSku } from '../repositories/equivalencias.repository.js';
import { ultimaCaptura, insertarCaptura } from '../repositories/capturas.repository.js';
import { getUmbral } from '../repositories/configuracion.repository.js';
import { obtenerPrecios } from '../fuentes/index.js';
import { fuenteFilaSchema } from '../schemas/comunes.schemas.js';
import { parsePrecio } from '../utils/parsePrecio.js';
import { AppError, notFound } from '../utils/errors.js';
import { evaluarAlerta, notificarAlerta } from './alertas.service.js';
import { log } from '../utils/logger.js';

async function guardarFila({ proveedor, ejecucionId, fila }) {
  return withTransaction(async (client) => {
    const equivalencia = await findActivaPorProveedorSku(proveedor.id, fila.sku, client);
    if (!equivalencia) return { tipo: 'sin_equivalencia', detalle: { sku: fila.sku, descripcion: fila.descripcion } };
    const anterior = await ultimaCaptura(equivalencia.id, client);
    const nueva = await insertarCaptura({ equivalenciaId: equivalencia.id, precio: parsePrecio(fila.precio), disponible: fila.disponible, ejecucionId }, client);
    const umbral = await getUmbral(client);
    const alerta = await evaluarAlerta({ equivalenciaId: equivalencia.id, capturaAnterior: anterior, capturaNueva: nueva, umbral }, client);
    return { nueva, alerta };
  });
}

async function procesarProveedor(proveedor) {
  const ejecucion = await crearEjecucion(proveedor.id);
  let leidos = 0; let guardados = 0; let errores = 0; const alertas = [];
  try {
    const filas = await obtenerPrecios(proveedor);
    if (!Array.isArray(filas)) throw new AppError(400, 'SOURCE_STRUCTURE_INVALID', 'La fuente no devolvió una colección');
    leidos = filas.length;
    for (const filaOriginal of filas) {
      const validada = fuenteFilaSchema.safeParse(filaOriginal);
      if (!validada.success) {
        errores += 1;
        await registrarError(ejecucion.id, 'fila_invalida', { fila: filaOriginal, errores: validada.error.issues.map((i) => i.message) });
        continue;
      }
      try {
        const resultado = await guardarFila({ proveedor, ejecucionId: ejecucion.id, fila: validada.data });
        if (resultado.tipo) {
          errores += 1;
          await registrarError(ejecucion.id, resultado.tipo, resultado.detalle);
        } else {
          guardados += 1;
          if (resultado.alerta) alertas.push(resultado.alerta);
        }
      } catch (error) {
        errores += 1;
        await registrarError(ejecucion.id, 'fila_invalida', { fila: filaOriginal, mensaje: error.message });
      }
    }
    const estado = errores === 0 ? 'ok' : guardados > 0 ? 'parcial' : 'error';
    const final = await finalizarEjecucion(ejecucion.id, { estado, leidos, guardados, mensaje: errores ? `${errores} registro(s) con error` : 'Captura completada' });
    for (const alerta of alertas) void notificarAlerta(alerta);
    return { proveedor: proveedor.codigo, ejecucion: final, alertas: alertas.length };
  } catch (error) {
    const tipo = error.codigo === 'SOURCE_STRUCTURE_INVALID' ? 'estructura_invalida' : 'fuente_caida';
    await registrarError(ejecucion.id, tipo, { mensaje: error.message, codigo: error.codigo ?? null });
    const final = await finalizarEjecucion(ejecucion.id, { estado: 'error', leidos, guardados, mensaje: error.message });
    return { proveedor: proveedor.codigo, ejecucion: final, alertas: 0 };
  }
}

export async function ejecutarCaptura(proveedorCodigo) {
  const pool = getPool();
  const lockClient = await pool.getConnection();
  let bloqueado = false;
  try {
    const [rows] = await lockClient.execute('SELECT GET_LOCK(?, 0) AS adquirido', ['comparador_precios_captura']);
    bloqueado = rows[0].adquirido === 1;
    if (!bloqueado) throw new AppError(409, 'CAPTURE_IN_PROGRESS', 'Ya hay una captura en ejecución');
    let proveedores;
    if (proveedorCodigo) {
      const proveedor = await findProveedorByCodigo(proveedorCodigo);
      if (!proveedor || !proveedor.activo) throw notFound('Proveedor activo no encontrado');
      proveedores = [proveedor];
    } else proveedores = await listProveedores({ soloActivos: true });
    const resultados = await Promise.allSettled(proveedores.map(procesarProveedor));
    const procesados = resultados.map((resultado, indice) => resultado.status === 'fulfilled'
      ? resultado.value
      : ({ proveedor: proveedores[indice].codigo, ejecucion: { estado: 'error', mensaje: resultado.reason?.message ?? 'Error no controlado' }, alertas: 0 }));
    const hayProblemas = procesados.some((item) => item.ejecucion.estado !== 'ok');
    const estado = hayProblemas ? 'parcial' : 'ok';
    log('info', 'captura_finalizada', { estado, proveedores: procesados.length });
    return { estado, proveedores: procesados, total_alertas: procesados.reduce((total, item) => total + item.alertas, 0) };
  } finally {
    if (bloqueado) await lockClient.execute('SELECT RELEASE_LOCK(?)', ['comparador_precios_captura']);
    lockClient.release();
  }
}
