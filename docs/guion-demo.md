# Guion de demostración

1. En MySQL Workbench muestre `comparador_precios_db`, sus tablas InnoDB y la vista `vw_precio_vigente`.
2. Inicie API (`npm start`) y React (`npm run frontend:dev`); confirme el indicador “MySQL conectado”.
3. Seleccione Cemento gris 50 kg: la interfaz consulta la comparación ordenada y muestra el mejor proveedor.
4. Ejecute una captura desde la interfaz y consulte el histórico mediante `GET /api/productos/1/historial`.
5. Ejecute `npm run demo -- alza`, vuelva a lanzar la captura y consulte `/api/alertas` para mostrar la alerta.
6. Ejecute `npm run demo -- romper`, capture de nuevo y muestre en `/api/capturas/ejecuciones` que EPA falló sin detener las otras fuentes.
7. Ejecute `npm run demo -- restaurar`.

Para la exposición: explique que React es solo cliente; reglas, validación, transacciones y SQL parametrizado se mantienen en la API. MySQL conserva integridad con InnoDB, FK, `DECIMAL`, `JSON`, índices y la vista de precios vigentes.
