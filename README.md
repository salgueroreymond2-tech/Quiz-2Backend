# Comparador de precios de materiales

Sistema académico para Constructora Del Valle S.A. Centraliza productos de construcción, relaciona SKU de proveedores, conserva el historial de capturas, compara precios normalizados y genera alertas configurables. Incluye API Node.js/Express, MySQL 8 administrable desde MySQL Workbench y un cliente React/Vite.

> Novex, Construplaza y EPA se alimentan con archivos locales simulados. Los precios no son cotizaciones reales y esta entrega no hace scraping.

## Stack y arquitectura

- Backend: Node.js, Express, Zod, `mysql2/promise` y `node-cron`.
- Persistencia: MySQL 8+, InnoDB, `DECIMAL`, `JSON`, claves foráneas y transacciones.
- Frontend: React 19 + Vite, con proxy de desarrollo al backend.
- Calidad: Vitest y Supertest.

La API aplica la cadena rutas → controladores → servicios → repositorios. Solo los repositorios contienen SQL y todos los valores externos se envían mediante marcadores `?`. El pool fija cada conexión a UTC; las fechas se muestran en la interfaz usando `America/Costa_Rica`.

## Instalación con MySQL Workbench

1. Instale Node.js 20+, MySQL Server 8+ y MySQL Workbench.
2. Copie `.env.example` como `.env` y ajuste `DB_USER`, `DB_PASSWORD` y los demás valores locales.
3. En Workbench cree o seleccione el esquema `comparador_precios_db`, abra [db/schema.sql](db/schema.sql) y ejecútelo. Luego ejecute [db/triggers.sql](db/triggers.sql) y [db/seed.sql](db/seed.sql), en ese orden.
4. Instale dependencias del backend y frontend: `npm install`.
5. Inicie API: `npm start`; para desarrollo: `npm run dev`.
6. En otra terminal, inicie React: `npm run frontend:dev` y abra `http://localhost:5173`.

Alternativamente, `npm run db:setup` crea el esquema configurado por `DB_NAME` y ejecuta ambos scripts sin borrar datos existentes. También hay un `docker-compose.yml` opcional para iniciar MySQL 8; Workbench puede conectarse a `localhost:3306`.

Variables principales:

```ini
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=
DB_NAME=comparador_precios_db
DB_NAME_TEST=comparador_precios_test
PORT=3000
FUENTES_MODO=simulado
CAPTURA_CRON=0 6 * * *
TZ=America/Costa_Rica
```

## Modelo de datos

Todas las tablas usan InnoDB. `capturas_precio` es inmutable; la vista `vw_precio_vigente` emplea `ROW_NUMBER() OVER (PARTITION BY equivalencia_id ...)` para elegir la última captura con desempate por `id`. `factor_unidad` indica cuántas unidades internas contiene una presentación del proveedor; por ello el comparador usa `precio / factor_unidad`.

Consulte el [diagrama entidad-relación](docs/er.md). Las operaciones de captura insertan la nueva captura, consultan la anterior bloqueada y crean su alerta dentro de una misma transacción MySQL.

## API

| Método | Ruta | Función |
|---|---|---|
| GET | `/health` | Estado de la API y MySQL |
| GET/POST | `/api/productos` | Lista/crea productos |
| GET/PATCH | `/api/productos/:id` | Consulta/actualiza producto |
| GET | `/api/productos/:id/precios` | Comparación vigente normalizada |
| GET | `/api/productos/:id/historial` | Historial de capturas |
| GET/POST | `/api/proveedores` | Lista/crea proveedores |
| GET/POST | `/api/equivalencias` | Lista/crea equivalencias |
| DELETE | `/api/equivalencias/:id` | Desactivación lógica |
| POST | `/api/capturas/ejecutar` | Ejecuta captura global o puntual |
| GET | `/api/capturas/ejecuciones` | Auditoría de ejecuciones |
| GET/PATCH | `/api/alertas` | Consulta / marca alerta leída |
| GET/PUT | `/api/configuracion` | Consulta / actualiza umbral |

Las peticiones ejecutables están en [docs/requests.http](docs/requests.http). El frontend consume `GET /api/productos`, `GET /api/productos/:id/precios`, `POST /api/capturas/ejecutar`, `GET /health` y `PUT /api/configuracion/umbral-alerta` sin duplicar lógica de negocio.

## Automatización, pruebas y demo

El cron se ejecuta a las 06:00 de `America/Costa_Rica` y no se inicia en pruebas. La captura usa `GET_LOCK` para impedir concurrencia accidental; los proveedores se aíslan con `Promise.allSettled`, por lo que el fallo de uno deja continuar a los demás.

| Comando | Acción |
|---|---|
| `npm run db:setup` | Crea/actualiza el esquema MySQL y sus semillas |
| `npm run db:setup:test` | Prepara `DB_NAME_TEST`, con protección de nombre |
| `npm test` | Ejecuta Vitest; usa `DB_NAME_TEST` si existe |
| `npm run frontend:dev` | Inicia React/Vite |
| `npm run frontend:build` | Genera el build de React |
| `npm run demo -- alza` | Prepara un alza simulada de ~12 % |
| `npm run demo -- romper` | Corrompe solo la fuente EPA de demostración |
| `npm run demo -- restaurar` | Restaura las fuentes locales sin borrar el historial |

## Límites

El prototipo no incluye autenticación, compras, pagos ni acceso HTTP real a los comercios. Manténgalo en entorno local y no use los datos de muestra para decisiones comerciales.
