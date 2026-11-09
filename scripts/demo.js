import { copyFile, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const accion = process.argv[2];
const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const fuentes = path.join(raiz, 'data', 'fuentes');
const originales = path.join(fuentes, 'originales');
const archivos = ['novex.json', 'construplaza.csv', 'epa.json'];
async function restaurar() { await Promise.all(archivos.map((archivo) => copyFile(path.join(originales, archivo), path.join(fuentes, archivo)))); }
if (accion === 'restaurar') { await restaurar(); console.log('Fuentes simuladas restauradas. El historial en MySQL no fue modificado.'); }
else if (accion === 'romper') { await writeFile(path.join(fuentes, 'epa.json'), '{ estructura JSON inválida', 'utf8'); console.log('EPA fue preparada con JSON inválido para demostrar tolerancia a fallos.'); }
else if (accion === 'alza') {
  await restaurar();
  const destino = path.join(fuentes, 'novex.json');
  const datos = JSON.parse(await readFile(destino, 'utf8'));
  datos[0].precio = '₡7 224';
  await writeFile(destino, `${JSON.stringify(datos, null, 2)}\n`, 'utf8');
  console.log('Novex fue preparada con un alza simulada de ~12 % en cemento. Ejecute POST /api/capturas/ejecutar.');
} else {
  console.error('Uso: npm run demo -- alza | romper | restaurar'); process.exitCode = 1;
}
