import { createApp } from './app.js';
import { config } from './config.js';
import { closePool } from './db/pool.js';
import { iniciarScheduler, detenerScheduler } from './jobs/scheduler.js';
import { log } from './utils/logger.js';

const app = createApp();
const server = app.listen(config.port, () => {
  log('info', 'servidor_iniciado', { puerto: config.port });
  iniciarScheduler();
});

async function cerrar(senal) {
  log('info', 'cierre_iniciado', { senal });
  detenerScheduler();
  server.close(async () => { await closePool(); process.exit(0); });
  setTimeout(() => process.exit(1), 10_000).unref();
}
process.once('SIGINT', () => cerrar('SIGINT'));
process.once('SIGTERM', () => cerrar('SIGTERM'));
