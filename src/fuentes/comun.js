import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { AppError } from '../utils/errors.js';

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../data/fuentes');

export function rutaFuente(nombreArchivo) {
  const ruta = path.resolve(raiz, nombreArchivo);
  if (!ruta.startsWith(`${raiz}${path.sep}`)) throw new AppError(400, 'SOURCE_PATH_INVALID', 'La ruta de fuente no es válida');
  return ruta;
}

export async function leerJson(nombreArchivo) {
  let texto;
  try { texto = await readFile(rutaFuente(nombreArchivo), 'utf8'); }
  catch (error) { throw new AppError(503, 'SOURCE_UNAVAILABLE', `No se pudo leer la fuente ${nombreArchivo}`, [{ mensaje: error.message }]); }
  try { return JSON.parse(texto); }
  catch { throw new AppError(400, 'SOURCE_STRUCTURE_INVALID', `La fuente ${nombreArchivo} contiene JSON inválido`); }
}

export async function leerCsv(nombreArchivo) {
  let texto;
  try { texto = await readFile(rutaFuente(nombreArchivo), 'utf8'); }
  catch (error) { throw new AppError(503, 'SOURCE_UNAVAILABLE', `No se pudo leer la fuente ${nombreArchivo}`, [{ mensaje: error.message }]); }
  const lineas = texto.trim().split(/\r?\n/).filter(Boolean);
  if (!lineas.length) throw new AppError(400, 'SOURCE_STRUCTURE_INVALID', 'El CSV está vacío');
  const parsearLinea = (linea) => {
    const valores = []; let actual = ''; let comillas = false;
    for (let i = 0; i < linea.length; i += 1) {
      const caracter = linea[i];
      if (caracter === '"' && linea[i + 1] === '"') { actual += '"'; i += 1; }
      else if (caracter === '"') comillas = !comillas;
      else if (caracter === ',' && !comillas) { valores.push(actual.trim()); actual = ''; }
      else actual += caracter;
    }
    if (comillas) throw new AppError(400, 'SOURCE_STRUCTURE_INVALID', 'El CSV tiene comillas sin cerrar');
    valores.push(actual.trim()); return valores;
  };
  const cabeceras = parsearLinea(lineas[0]);
  const requeridas = ['sku', 'descripcion', 'precio', 'disponible'];
  if (requeridas.some((clave) => !cabeceras.includes(clave))) throw new AppError(400, 'SOURCE_STRUCTURE_INVALID', 'El CSV no tiene las columnas requeridas');
  return lineas.slice(1).map((linea) => {
    const valores = parsearLinea(linea);
    return Object.fromEntries(cabeceras.map((cabecera, indice) => [cabecera, valores[indice]]));
  });
}
