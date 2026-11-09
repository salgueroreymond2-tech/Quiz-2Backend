import { describe, expect, it } from 'vitest';
import request from 'supertest';
import { createApp } from '../../src/app.js';

describe('API: validaciones sin dependencia de datos', () => {
  const app = createApp();
  it('rechaza un producto inválido', async () => {
    const respuesta = await request(app).post('/api/productos').send({ codigo_interno: 'x' });
    expect(respuesta.status).toBe(400);
    expect(respuesta.body.error.codigo).toBe('VALIDATION_ERROR');
  });
  it('responde 404 para rutas inexistentes', async () => {
    const respuesta = await request(app).get('/api/no-existe');
    expect(respuesta.status).toBe(404);
  });
});
