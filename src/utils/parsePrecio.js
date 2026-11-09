export function parsePrecio(valor) {
  if (typeof valor === 'number') {
    if (!Number.isFinite(valor) || valor <= 0) throw new Error('El precio debe ser mayor que cero');
    return valor.toFixed(2);
  }
  if (typeof valor !== 'string' || !valor.trim()) throw new Error('El precio es obligatorio');
  let limpio = valor.trim().replace(/[₡CRC\s]/gi, '');
  if (!/^[+-]?[\d.,]+$/.test(limpio)) throw new Error('El precio no tiene un formato numérico válido');
  const ultimoPunto = limpio.lastIndexOf('.');
  const ultimaComa = limpio.lastIndexOf(',');
  if (ultimoPunto >= 0 && ultimaComa >= 0) {
    const separadorDecimal = ultimoPunto > ultimaComa ? '.' : ',';
    const miles = separadorDecimal === '.' ? /,/g : /\./g;
    limpio = limpio.replace(miles, '').replace(separadorDecimal, '.');
  } else if (ultimaComa >= 0) {
    const decimales = limpio.length - ultimaComa - 1;
    limpio = decimales === 3 ? limpio.replace(/,/g, '') : limpio.replace(',', '.');
  } else if (ultimoPunto >= 0) {
    const decimales = limpio.length - ultimoPunto - 1;
    limpio = decimales === 3 ? limpio.replace(/\./g, '') : limpio;
  }
  const numero = Number(limpio);
  if (!Number.isFinite(numero) || numero <= 0) throw new Error('El precio debe ser mayor que cero');
  return numero.toFixed(2);
}
