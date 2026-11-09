import { leerCsv } from './comun.js';
export const fetchPrecios = (proveedor) => leerCsv(proveedor.ruta_fuente);
