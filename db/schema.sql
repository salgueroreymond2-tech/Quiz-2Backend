-- MySQL 8.0+ / InnoDB. Ejecute este archivo sobre el esquema seleccionado en MySQL Workbench.
SET time_zone = '+00:00';

CREATE TABLE IF NOT EXISTS categorias (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(120) NOT NULL,
  padre_id BIGINT UNSIGNED NULL,
  clave_padre_nombre VARCHAR(180) GENERATED ALWAYS AS (CONCAT(COALESCE(padre_id, 0), ':', nombre)) STORED,
  CONSTRAINT fk_categorias_padre FOREIGN KEY (padre_id) REFERENCES categorias(id) ON DELETE RESTRICT,
  UNIQUE KEY categorias_padre_nombre_uq (clave_padre_nombre)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS productos (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  codigo_interno VARCHAR(60) NOT NULL UNIQUE,
  nombre VARCHAR(180) NOT NULL,
  descripcion TEXT NULL,
  categoria_id BIGINT UNSIGNED NULL,
  unidad VARCHAR(40) NOT NULL,
  activo BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_productos_categoria FOREIGN KEY (categoria_id) REFERENCES categorias(id) ON DELETE RESTRICT,
  KEY productos_categoria_idx (categoria_id),
  KEY productos_activo_nombre_idx (activo, nombre)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS proveedores (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  codigo VARCHAR(40) NOT NULL UNIQUE,
  nombre VARCHAR(120) NOT NULL,
  tipo_fuente ENUM('json', 'csv', 'http') NOT NULL,
  ruta_fuente TEXT NOT NULL,
  activo BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS equivalencias (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  producto_id BIGINT UNSIGNED NOT NULL,
  proveedor_id BIGINT UNSIGNED NOT NULL,
  sku_proveedor VARCHAR(100) NOT NULL,
  descripcion_proveedor TEXT NOT NULL,
  factor_unidad DECIMAL(14,4) NOT NULL DEFAULT 1.0000,
  activo BOOLEAN NOT NULL DEFAULT TRUE,
  producto_proveedor_activo_key VARCHAR(60) GENERATED ALWAYS AS (IF(activo, CONCAT(producto_id, ':', proveedor_id), NULL)) STORED,
  proveedor_sku_activo_key VARCHAR(180) GENERATED ALWAYS AS (IF(activo, CONCAT(proveedor_id, ':', sku_proveedor), NULL)) STORED,
  CONSTRAINT chk_equivalencias_factor CHECK (factor_unidad > 0),
  CONSTRAINT fk_equivalencias_producto FOREIGN KEY (producto_id) REFERENCES productos(id) ON DELETE RESTRICT,
  CONSTRAINT fk_equivalencias_proveedor FOREIGN KEY (proveedor_id) REFERENCES proveedores(id) ON DELETE RESTRICT,
  UNIQUE KEY equivalencias_activas_producto_proveedor_uq (producto_proveedor_activo_key),
  UNIQUE KEY equivalencias_activas_proveedor_sku_uq (proveedor_sku_activo_key),
  KEY equivalencias_producto_activo_idx (producto_id, activo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS ejecuciones_captura (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  proveedor_id BIGINT UNSIGNED NOT NULL,
  iniciada_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  finalizada_en TIMESTAMP NULL,
  estado ENUM('ok', 'parcial', 'error') NOT NULL DEFAULT 'parcial',
  leidos INT UNSIGNED NOT NULL DEFAULT 0,
  guardados INT UNSIGNED NOT NULL DEFAULT 0,
  mensaje TEXT NULL,
  CONSTRAINT fk_ejecuciones_proveedor FOREIGN KEY (proveedor_id) REFERENCES proveedores(id) ON DELETE RESTRICT,
  KEY ejecuciones_proveedor_fecha_idx (proveedor_id, iniciada_en DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS capturas_precio (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  equivalencia_id BIGINT UNSIGNED NOT NULL,
  precio DECIMAL(14,2) NOT NULL,
  moneda CHAR(3) NOT NULL DEFAULT 'CRC',
  disponible BOOLEAN NOT NULL DEFAULT TRUE,
  capturado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ejecucion_id BIGINT UNSIGNED NULL,
  CONSTRAINT chk_capturas_precio CHECK (precio > 0),
  CONSTRAINT chk_capturas_moneda CHECK (moneda = 'CRC'),
  CONSTRAINT fk_capturas_equivalencia FOREIGN KEY (equivalencia_id) REFERENCES equivalencias(id) ON DELETE RESTRICT,
  CONSTRAINT fk_capturas_ejecucion FOREIGN KEY (ejecucion_id) REFERENCES ejecuciones_captura(id) ON DELETE SET NULL,
  KEY capturas_equivalencia_fecha_idx (equivalencia_id, capturado_en DESC, id DESC),
  KEY capturas_ejecucion_idx (ejecucion_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS errores_captura (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  ejecucion_id BIGINT UNSIGNED NOT NULL,
  tipo ENUM('fuente_caida', 'estructura_invalida', 'fila_invalida', 'sin_equivalencia') NOT NULL,
  detalle JSON NOT NULL,
  creado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_errores_ejecucion FOREIGN KEY (ejecucion_id) REFERENCES ejecuciones_captura(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS configuracion (
  clave VARCHAR(100) PRIMARY KEY,
  valor VARCHAR(200) NOT NULL,
  descripcion TEXT NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS alertas_precio (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  equivalencia_id BIGINT UNSIGNED NOT NULL,
  captura_anterior_id BIGINT UNSIGNED NOT NULL,
  captura_nueva_id BIGINT UNSIGNED NOT NULL,
  precio_anterior DECIMAL(14,2) NOT NULL,
  precio_nuevo DECIMAL(14,2) NOT NULL,
  variacion_pct DECIMAL(12,4) NOT NULL,
  umbral_pct DECIMAL(6,2) NOT NULL,
  direccion ENUM('alza', 'baja') NOT NULL,
  creada_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  leida BOOLEAN NOT NULL DEFAULT FALSE,
  CONSTRAINT chk_alertas_anterior CHECK (precio_anterior > 0),
  CONSTRAINT chk_alertas_nuevo CHECK (precio_nuevo > 0),
  CONSTRAINT chk_alertas_umbral CHECK (umbral_pct > 0 AND umbral_pct <= 100),
  CONSTRAINT fk_alertas_equivalencia FOREIGN KEY (equivalencia_id) REFERENCES equivalencias(id) ON DELETE RESTRICT,
  CONSTRAINT fk_alertas_anterior FOREIGN KEY (captura_anterior_id) REFERENCES capturas_precio(id) ON DELETE RESTRICT,
  CONSTRAINT fk_alertas_nueva FOREIGN KEY (captura_nueva_id) REFERENCES capturas_precio(id) ON DELETE RESTRICT,
  UNIQUE KEY alertas_captura_nueva_uq (captura_nueva_id),
  KEY alertas_leida_fecha_idx (leida, creada_en DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE OR REPLACE VIEW vw_precio_vigente AS
SELECT captura_id, equivalencia_id, precio, moneda, disponible, capturado_en, ejecucion_id
FROM (
  SELECT c.id AS captura_id, c.equivalencia_id, c.precio, c.moneda, c.disponible, c.capturado_en, c.ejecucion_id,
    ROW_NUMBER() OVER (PARTITION BY c.equivalencia_id ORDER BY c.capturado_en DESC, c.id DESC) AS fila
  FROM capturas_precio c
) precios_ordenados
WHERE fila = 1;
