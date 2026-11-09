-- Datos simulados para demostración académica. No representan cotizaciones comerciales reales.
SET time_zone = '+00:00';
START TRANSACTION;

INSERT IGNORE INTO categorias (nombre, padre_id) VALUES
  ('Materiales de construcción', NULL), ('Herramientas y seguridad', NULL), ('Eléctrico', NULL);
INSERT IGNORE INTO categorias (nombre, padre_id) VALUES
  ('Cementos y agregados', (SELECT id FROM categorias c WHERE c.nombre='Materiales de construcción' AND c.padre_id IS NULL)),
  ('Tuberías y accesorios', (SELECT id FROM categorias c WHERE c.nombre='Materiales de construcción' AND c.padre_id IS NULL)),
  ('Fijación y acabados', (SELECT id FROM categorias c WHERE c.nombre='Materiales de construcción' AND c.padre_id IS NULL)),
  ('Protección personal', (SELECT id FROM categorias c WHERE c.nombre='Herramientas y seguridad' AND c.padre_id IS NULL));

INSERT IGNORE INTO productos (codigo_interno,nombre,descripcion,categoria_id,unidad) VALUES
 ('CEM-GRIS-50','Cemento gris 50 kg','Saco de cemento gris de 50 kg.',(SELECT id FROM categorias WHERE nombre='Cementos y agregados'),'saco'),
 ('VAR-3-G40','Varilla #3 grado 40','Varilla de acero de refuerzo.',(SELECT id FROM categorias WHERE nombre='Cementos y agregados'),'unidad'),
 ('GUA-NIT-L','Guantes de nitrilo talla L','Guantes de nitrilo para protección.',(SELECT id FROM categorias WHERE nombre='Protección personal'),'par'),
 ('GUA-TRA-L','Guantes de trabajo talla L','Guantes de trabajo reforzados.',(SELECT id FROM categorias WHERE nombre='Protección personal'),'par'),
 ('PVC-12-SDR','Tubo PVC 1/2 SDR 13.5','Tubo PVC de media pulgada.',(SELECT id FROM categorias WHERE nombre='Tuberías y accesorios'),'unidad'),
 ('BLO-CON-12','Block de concreto 12 cm','Block estructural de concreto.',(SELECT id FROM categorias WHERE nombre='Cementos y agregados'),'unidad'),
 ('ARE-LAV-M3','Arena lavada','Arena lavada para construcción.',(SELECT id FROM categorias WHERE nombre='Cementos y agregados'),'m3'),
 ('GRA-TRI-M3','Grava triturada','Grava triturada para concreto.',(SELECT id FROM categorias WHERE nombre='Cementos y agregados'),'m3'),
 ('CLA-2-PUL','Clavo 2 pulgadas','Clavo de acero.',(SELECT id FROM categorias WHERE nombre='Fijación y acabados'),'caja'),
 ('TOR-DRY-1','Tornillo drywall 1 pulgada','Tornillo para drywall.',(SELECT id FROM categorias WHERE nombre='Fijación y acabados'),'caja'),
 ('PIN-ACR-BLA','Pintura acrílica blanca','Galón de pintura acrílica.',(SELECT id FROM categorias WHERE nombre='Fijación y acabados'),'galón'),
 ('PVC-34-SDR','Tubo PVC 3/4 SDR 13.5','Tubo PVC de tres cuartos.',(SELECT id FROM categorias WHERE nombre='Tuberías y accesorios'),'unidad'),
 ('TOM-DOB-20A','Tomacorriente doble 20A','Tomacorriente dúplex.',(SELECT id FROM categorias WHERE nombre='Eléctrico'),'unidad'),
 ('ADH-PVC-118','Adhesivo PVC 118 ml','Pegamento para PVC.',(SELECT id FROM categorias WHERE nombre='Tuberías y accesorios'),'unidad'),
 ('CAS-SEG-AMA','Casco de seguridad amarillo','Casco de protección industrial.',(SELECT id FROM categorias WHERE nombre='Protección personal'),'unidad');

INSERT IGNORE INTO proveedores (codigo,nombre,tipo_fuente,ruta_fuente) VALUES
 ('novex','Novex','json','novex.json'), ('construplaza','Construplaza','csv','construplaza.csv'), ('epa','EPA','json','epa.json');

INSERT IGNORE INTO equivalencias (producto_id,proveedor_id,sku_proveedor,descripcion_proveedor,factor_unidad)
SELECT p.id,pr.id,x.sku,x.descripcion,x.factor FROM (
 SELECT 'CEM-GRIS-50' codigo_producto,'novex' codigo_proveedor,'NX-CEM-50' sku,'Cemento gris 50 kg' descripcion,1.0000 factor UNION ALL
 SELECT 'VAR-3-G40','novex','NX-VAR-3','Varilla #3 grado 40',1.0000 UNION ALL SELECT 'GUA-NIT-L','novex','NX-GUA-NIT-L','Guantes nitrilo talla L',1.0000 UNION ALL SELECT 'GUA-TRA-L','novex','NX-GUA-TRA-L','Guantes trabajo talla L',1.0000 UNION ALL SELECT 'PVC-12-SDR','novex','NX-PVC-12','Tubo PVC 1/2 SDR 13.5',1.0000 UNION ALL
 SELECT 'CEM-GRIS-50','construplaza','CP-0231','Cemento gris saco 50 kg',1.0000 UNION ALL SELECT 'VAR-3-G40','construplaza','CP-VAR-3','Varilla corrugada #3',1.0000 UNION ALL SELECT 'GUA-NIT-L','construplaza','CP-NIT-L','Guantes de nitrilo L',1.0000 UNION ALL SELECT 'GUA-TRA-L','construplaza','CP-TRA-L','Guantes de trabajo L',1.0000 UNION ALL SELECT 'PVC-12-SDR','construplaza','CP-PVC-12','Tubo PVC 1/2',1.0000 UNION ALL
 SELECT 'CEM-GRIS-50','epa','EPA-CEM-50','Cemento gris 50 kg',1.0000 UNION ALL SELECT 'VAR-3-G40','epa','EPA-VAR-3','Varilla #3 6 m',1.0000 UNION ALL SELECT 'GUA-NIT-L','epa','EPA-NIT-L','Guante nitrilo grande',1.0000 UNION ALL SELECT 'GUA-TRA-L','epa','EPA-TRA-L','Guante trabajo grande',1.0000 UNION ALL SELECT 'PVC-12-SDR','epa','EPA-PVC-12','Tubo PVC 1/2 SDR',1.0000
) x JOIN productos p ON p.codigo_interno=x.codigo_producto JOIN proveedores pr ON pr.codigo=x.codigo_proveedor;

INSERT IGNORE INTO configuracion (clave,valor,descripcion) VALUES ('umbral_alerta_pct','5','Porcentaje mínimo absoluto para crear alertas de precio.');

INSERT INTO capturas_precio (equivalencia_id,precio,disponible,capturado_en)
SELECT e.id, precio_actual-ajuste, TRUE, UTC_TIMESTAMP()-INTERVAL dias DAY FROM (
 SELECT e.id,CASE e.sku_proveedor
  WHEN 'NX-CEM-50' THEN 6450 WHEN 'CP-0231' THEN 6300 WHEN 'EPA-CEM-50' THEN 7100
  WHEN 'NX-VAR-3' THEN 2300 WHEN 'CP-VAR-3' THEN 2150 WHEN 'EPA-VAR-3' THEN 2600
  WHEN 'NX-GUA-NIT-L' THEN 850 WHEN 'CP-NIT-L' THEN 870 WHEN 'EPA-NIT-L' THEN 900
  WHEN 'NX-GUA-TRA-L' THEN 1250 WHEN 'CP-TRA-L' THEN 1200 WHEN 'EPA-TRA-L' THEN 1300
  WHEN 'NX-PVC-12' THEN 3000 WHEN 'CP-PVC-12' THEN 2900 WHEN 'EPA-PVC-12' THEN 3050 END precio_actual
 FROM equivalencias e WHERE e.activo=TRUE
) e CROSS JOIN (SELECT 150.00 ajuste,30 dias UNION ALL SELECT 75.00,15 UNION ALL SELECT 0.00,5) h
WHERE precio_actual IS NOT NULL AND NOT EXISTS (SELECT 1 FROM capturas_precio c WHERE c.equivalencia_id=e.id);
COMMIT;
