import { leerJson } from './comun.js';
export const fetchPrecios = (proveedor) => leerJson(proveedor.ruta_fuente);
