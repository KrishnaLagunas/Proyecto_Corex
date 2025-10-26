/*
 * Convierte la imagen de fondo a WebP para menor consumo.
 * Entrada: public/images/fondo.png
 * Salida: public/images/fondo.webp
 */
const fs = require('fs');
const path = require('path');

async function main() {
  const sharpAvailable = (() => {
    try { require.resolve('sharp'); return true; } catch (_) { return false; }
  })();
  if (!sharpAvailable) {
    console.error('[convert_fondo_to_webp] Falta "sharp". Ejecuta: npm i sharp');
    process.exitCode = 1;
    return;
  }
  const sharp = require('sharp');

  const inputPng = path.resolve(__dirname, '../public/images/fondo.png');
  const outputWebp = path.resolve(__dirname, '../public/images/fondo.webp');

  if (!fs.existsSync(inputPng)) {
    console.error('[convert_fondo_to_webp] No se encontró:', inputPng);
    console.error('Coloca la imagen como "fondo.png" en public/images/ y vuelve a ejecutar.');
    process.exitCode = 1;
    return;
  }

  try {
    const image = sharp(inputPng);
    const meta = await image.metadata();
    const targetWidth = Math.min(1920, meta.width || 1920); // limitar a 1920px para reducir peso

    await image
      .resize({ width: targetWidth })
      .webp({ quality: 80 })
      .toFile(outputWebp);

    const inStats = fs.statSync(inputPng);
    const outStats = fs.statSync(outputWebp);
    const fmt = (n) => (n/1024).toFixed(1) + ' KB';
    console.log('[convert_fondo_to_webp] Conversión exitosa.');
    console.log('PNG original:', fmt(inStats.size));
    console.log('WEBP generado:', fmt(outStats.size));
    console.log('Archivo:', outputWebp);
  } catch (err) {
    console.error('[convert_fondo_to_webp] Error:', err.message);
    process.exitCode = 1;
  }
}

main();