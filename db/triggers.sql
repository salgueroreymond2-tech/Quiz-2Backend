-- Ejecute después de schema.sql. Compatible con MySQL Workbench y con scripts/setup-db.js.
DELIMITER //
DROP TRIGGER IF EXISTS categorias_max_dos_niveles_insert//
CREATE TRIGGER categorias_max_dos_niveles_insert
BEFORE INSERT ON categorias FOR EACH ROW
BEGIN
  DECLARE padre_con_padre INT DEFAULT 0;
  IF NEW.padre_id IS NOT NULL THEN
    SELECT COUNT(*) INTO padre_con_padre FROM categorias WHERE id=NEW.padre_id AND padre_id IS NOT NULL;
    IF padre_con_padre > 0 THEN
      SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Una categoría solo puede tener dos niveles';
    END IF;
  END IF;
END//
DROP TRIGGER IF EXISTS categorias_max_dos_niveles_update//
CREATE TRIGGER categorias_max_dos_niveles_update
BEFORE UPDATE ON categorias FOR EACH ROW
BEGIN
  DECLARE padre_con_padre INT DEFAULT 0;
  IF NEW.padre_id IS NOT NULL THEN
    SELECT COUNT(*) INTO padre_con_padre FROM categorias WHERE id=NEW.padre_id AND padre_id IS NOT NULL;
    IF padre_con_padre > 0 THEN
      SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Una categoría solo puede tener dos niveles';
    END IF;
  END IF;
END//
DELIMITER ;
