import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createApp } from '../../src/app.js';
import { closePool, getPool } from '../../src/db/pool.js';

const habilitada = Boolean(process.env.DB_NAME && /test/i.test(process.env.DB_NAME));
const describeDb = habilitada ? describe : describe.skip;

describeDb('API: integración MySQL', () => {
  const app = createApp();
  const codigoNuevo = `INT-${Date.now()}`;
  const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
  const rutaNovex = path.join(raiz, 'data', 'fuentes', 'novex.json');
  const rutaEpa = path.join(raiz, 'data', 'fuentes', 'epa.json');
  const originalNovex = path.join(raiz, 'data', 'fuentes', 'originales', 'novex.json');
  const originalEpa = path.join(raiz, 'data', 'fuentes', 'originales', 'epa.json');
  beforeAll(async () => { await getPool().execute('SELECT 1'); });
  afterAll(async () => {
    await writeFile(rutaNovex, await readFile(originalNovex, 'utf8'));
    await writeFile(rutaEpa, await readFile(originalEpa, 'utf8'));
    await closePool();
  });
  it('crea un producto y rechaza código duplicado', async () => {
    const datos = { codigo_interno: codigoNuevo, nombre: 'Producto integración', unidad: 'unidad' };
    expect((await request(app).post('/api/productos').send(datos)).status).toBe(201);
    expect((await request(app).post('/api/productos').send(datos)).status).toBe(409);
  });
  it('consulta catálogo, comparación ordenada e historial', async () => {
    const lista = await request(app).get('/api/productos?limit=100');
    const cemento = lista.body.data.find((p) => p.codigo_interno === 'CEM-GRIS-50');
    const comparacion = await request(app).get(`/api/productos/${cemento.id}/precios`);
    expect(comparacion.status).toBe(200);
    expect(comparacion.body.precios[0].diferencia_crc).toBe(0);
    const historial = await request(app).get(`/api/productos/${cemento.id}/historial`);
    expect(historial.body.capturas.length).toBeGreaterThanOrEqual(9);
  });
  it('genera una alerta y la marca como leída', async () => {
    await request(app).put('/api/configuracion/umbral-alerta').send({ umbral_pct: 5 });
    const fuente = JSON.parse(await readFile(rutaNovex, 'utf8'));
    fuente[0].precio = '₡7 224';
    await writeFile(rutaNovex, `${JSON.stringify(fuente, null, 2)}\n`);
    const captura = await request(app).post('/api/capturas/ejecutar').send({ proveedor_codigo: 'novex' });
    expect(captura.body.total_alertas).toBeGreaterThanOrEqual(1);
    const alertas = await request(app).get('/api/alertas?solo_no_leidas=true');
    const alerta = alertas.body.data.find((item) => item.producto_nombre === 'Cemento gris 50 kg');
    expect((await request(app).patch(`/api/alertas/${alerta.id}/leida`)).body.data.leida).toBe(true);
  });
  it('continúa cuando una fuente tiene JSON inválido', async () => {
    await writeFile(rutaEpa, '{ JSON roto');
    const captura = await request(app).post('/api/capturas/ejecutar').send({});
    expect(captura.status).toBe(200);
    expect(captura.body.proveedores.some((item) => item.proveedor === 'epa' && item.ejecucion.estado === 'error')).toBe(true);
    await writeFile(rutaEpa, await readFile(originalEpa, 'utf8'));
  });
});
