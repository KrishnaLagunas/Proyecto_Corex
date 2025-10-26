/*
 * Convierte la imagen del wordmark a WebP para reducir peso.
 * Entrada esperada: public/images/corex-wordmark.png
 * Salida: public/images/corex-wordmark.webp
 */
const fs = require('fs');
const path = require('path');

async function main() {
  const sharpAvailable = (() => {
    try { require.resolve('sharp'); return true; } catch (_) { return false; }
  })();
  if (!sharpAvailable) {
    console.error('[convert_wordmark_to_webp] La dependencia "sharp" no está instalada. Ejecuta: npm i sharp');
    process.exitCode = 1;
    return;
  }
  const sharp = require('sharp');

  const inputPng = path.resolve(__dirname, '../public/images/corex-wordmark.png');
  const outputWebp = path.resolve(__dirname, '../public/images/corex-wordmark.webp');

  if (!fs.existsSync(inputPng)) {
    console.error('[convert_wordmark_to_webp] No se encontró el archivo PNG en:', inputPng);
    console.error('Coloca la imagen recibida como "corex-wordmark.png" en public/images/ y vuelve a ejecutar.');
    process.exitCode = 1;
    return;
  }

  try {
    await sharp(inputPng)
      .webp({ quality: 85 })
      .toFile(outputWebp);
    const inStats = fs.statSync(inputPng);
    const outStats = fs.statSync(outputWebp);
    const fmt = (n) => (n/1024).toFixed(1) + ' KB';
    console.log('[convert_wordmark_to_webp] Conversión exitosa.');
    console.log('PNG original:', fmt(inStats.size));
    console.log('WEBP generado:', fmt(outStats.size));
    console.log('Archivo:', outputWebp);
  } catch (err) {
    console.error('[convert_wordmark_to_webp] Error durante la conversión:', err.message);
    process.exitCode = 1;
  }
}

main();