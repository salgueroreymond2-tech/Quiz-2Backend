export function log(nivel, evento, datos = {}) {
  const salida = { fecha: new Date().toISOString(), nivel, evento, ...datos };
  const fn = nivel === 'error' ? console.error : console.log;
  fn(JSON.stringify(salida));
}
