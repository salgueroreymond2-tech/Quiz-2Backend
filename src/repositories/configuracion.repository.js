import { rows } from '../db/query.js';

export const listConfiguracion = () => rows('SELECT * FROM configuracion ORDER BY clave');
export async function getUmbral(connection) {
  const resultado = await rows("SELECT valor FROM configuracion WHERE clave='umbral_alerta_pct'", [], connection);
  return resultado[0]?.valor ?? '5';
}
export async function setUmbral(valor) {
  await rows(`INSERT INTO configuracion (clave,valor,descripcion) VALUES ('umbral_alerta_pct',?,'Porcentaje mínimo absoluto para crear alertas de precio.')
    ON DUPLICATE KEY UPDATE valor=VALUES(valor)`, [String(valor)]);
  const resultado = await rows("SELECT * FROM configuracion WHERE clave='umbral_alerta_pct'");
  return resultado[0];
}
