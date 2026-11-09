import cron from 'node-cron';
import { config } from '../config.js';
import { ejecutarCaptura } from '../services/captura.service.js';
import { log } from '../utils/logger.js';

let task;

export function iniciarScheduler() {
  if (config.isTest || task) return null;
  if (!cron.validate(config.capturaCron)) throw new Error('CAPTURA_CRON no tiene una expresión cron válida');
  task = cron.schedule(config.capturaCron, async () => {
    try { await ejecutarCaptura(); }
    catch (error) { log('error', 'cron_captura_fallo', { mensaje: error.message }); }
  }, { timezone: config.timezone, noOverlap: true });
  log('info', 'scheduler_iniciado', { expresion: config.capturaCron, zona_horaria: config.timezone });
  return task;
}

export function detenerScheduler() { if (task) { task.stop(); task = undefined; } }
