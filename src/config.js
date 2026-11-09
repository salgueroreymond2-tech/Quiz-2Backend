import 'dotenv/config';

const port = Number.parseInt(process.env.PORT ?? '3000', 10);

export const config = Object.freeze({
  port: Number.isInteger(port) && port > 0 ? port : 3000,
  dbHost: process.env.DB_HOST ?? 'localhost',
  dbPort: Number.parseInt(process.env.DB_PORT ?? '3306', 10),
  dbUser: process.env.DB_USER ?? 'root',
  dbPassword: process.env.DB_PASSWORD ?? '',
  dbName: process.env.DB_NAME,
  fuentesModo: process.env.FUENTES_MODO ?? 'simulado',
  capturaCron: process.env.CAPTURA_CRON ?? '0 6 * * *',
  timezone: process.env.TZ ?? 'America/Costa_Rica',
  alertaWebhookUrl: process.env.ALERTA_WEBHOOK_URL,
  isTest: process.env.NODE_ENV === 'test'
});
