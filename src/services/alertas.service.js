import { config } from '../config.js';
import { crearAlertaSiCorresponde } from '../repositories/alertas.repository.js';
import { log } from '../utils/logger.js';

export function calcularVariacionPct(precioAnterior, precioNuevo) {
  if (Number(precioAnterior) <= 0) return null;
  return Number((((Number(precioNuevo) - Number(precioAnterior)) / Number(precioAnterior)) * 100).toFixed(4));
}

export async function evaluarAlerta(datos, client) {
  if (!datos.capturaAnterior) return null;
  const alerta = await crearAlertaSiCorresponde({
    equivalenciaId: datos.equivalenciaId,
    capturaAnteriorId: datos.capturaAnterior.id,
    capturaNuevaId: datos.capturaNueva.id,
    precioAnterior: datos.capturaAnterior.precio,
    precioNuevo: datos.capturaNueva.precio,
    umbral: datos.umbral
  }, client);
  return alerta;
}

export async function notificarAlerta(alerta) {
  if (!alerta) return;
  log('info', 'alerta_generada', { alerta_id: alerta.id, variacion_pct: alerta.variacion_pct, direccion: alerta.direccion });
  if (!config.alertaWebhookUrl) return;
  try {
    const respuesta = await fetch(config.alertaWebhookUrl, {
      method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ tipo: 'alerta_precio', alerta })
    });
    if (!respuesta.ok) throw new Error(`HTTP ${respuesta.status}`);
  } catch (error) {
    log('error', 'webhook_alerta_fallo', { mensaje: error.message, alerta_id: alerta.id });
  }
}
