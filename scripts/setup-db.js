import 'dotenv/config';
import mysql from 'mysql2/promise';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const usarPruebas = process.argv.includes('--test');
const nombreDb = usarPruebas ? process.env.DB_NAME_TEST : process.env.DB_NAME;
if (!nombreDb) throw new Error(usarPruebas ? 'DB_NAME_TEST no está configurada' : 'DB_NAME no está configurada');
if (!/^[A-Za-z0-9_]+$/.test(nombreDb)) throw new Error('El nombre de base de datos contiene caracteres no permitidos');
if (usarPruebas && !/test/i.test(nombreDb)) throw new Error('Protección activada: DB_NAME_TEST debe incluir "test"');
const opciones = {
  host: process.env.DB_HOST ?? 'localhost', port: Number(process.env.DB_PORT ?? 3306),
  user: process.env.DB_USER ?? 'root', password: process.env.DB_PASSWORD ?? '', timezone: 'Z', multipleStatements: true
};
const administrador = await mysql.createConnection(opciones);
try {
  await administrador.query(`CREATE DATABASE IF NOT EXISTS \`${nombreDb}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
} finally { await administrador.end(); }
const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const schema = await readFile(path.join(raiz, 'db', 'schema.sql'), 'utf8');
const triggers = await readFile(path.join(raiz, 'db', 'triggers.sql'), 'utf8');
const seed = await readFile(path.join(raiz, 'db', 'seed.sql'), 'utf8');
const conexion = await mysql.createConnection({ ...opciones, database: nombreDb });
try {
  await conexion.query(schema);
  const sentenciasTrigger = triggers.replace(/^DELIMITER .*$/gm, '').split('//').map((sentencia) => sentencia.trim()).filter(Boolean);
  for (const sentencia of sentenciasTrigger) await conexion.query(sentencia);
  await conexion.query(seed);
  console.log(`Base MySQL ${usarPruebas ? 'de pruebas' : 'de desarrollo'} preparada sin borrar historial.`);
} finally { await conexion.end(); }
