// Utilidades de texto para normalizar cadenas

/**
 * Elimina acentos/diacríticos de una cadena usando Unicode normalization.
 * Conserva letras y espacios, elimina marcas combinadas.
 * @param {string} str
 * @returns {string}
 */
function removeAccents(str) {
  if (typeof str !== 'string') return str;
  return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

/**
 * Normaliza espacios internos y recorta extremos.
 * @param {string} str
 * @returns {string}
 */
function normalizeWhitespace(str) {
  if (typeof str !== 'string') return str;
  return str.replace(/\s+/g, ' ').trim();
}

/**
 * Limpia nombres/apellidos: recorta, colapsa espacios y quita acentos.
 * @param {string} str
 * @returns {string}
 */
function cleanName(str) {
  if (typeof str !== 'string') return str;
  return removeAccents(normalizeWhitespace(str));
}

module.exports = {
  removeAccents,
  normalizeWhitespace,
  cleanName,
};