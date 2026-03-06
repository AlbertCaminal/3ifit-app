#!/usr/bin/env node
/**
 * Genera iconos PWA (192x192, 512x512) desde el logo.
 * Ejecutar: npm run generate-icons
 *
 * Opciones:
 *   1. Coloca tresipunt_logo_processed.png en public/icons/
 *   2. O usa cualquier imagen como logo.png en public/icons/
 */
const fs = require("fs");
const path = require("path");

const iconsDir = path.join(__dirname, "..", "public", "icons");
const logoCandidates = [
  path.join(iconsDir, "tresipunt_logo_processed.png"),
  path.join(iconsDir, "logo.png"),
  path.join(iconsDir, "icon.png"),
];

if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

(async () => {
  try {
    const sharp = require("sharp");
    const logoPath = logoCandidates.find((p) => fs.existsSync(p));

    if (!logoPath) {
      console.error(`
No se encontró ningún logo para generar iconos.

Coloca una de estas imágenes en public/icons/:
  - tresipunt_logo_processed.png
  - logo.png
  - icon.png

Recomendado: mínimo 512x512 px para buena calidad.

Ejemplo con ImageMagick (si lo tienes):
  convert tu-logo.png -resize 512x512 public/icons/logo.png
`);
      process.exit(1);
    }

    const sizes = [192, 512];
    for (const size of sizes) {
      await sharp(logoPath)
        .resize(size, size)
        .png()
        .toFile(path.join(iconsDir, `icon-${size}.png`));
      console.log(`✓ Generado icon-${size}.png`);
    }
    console.log("\nIconos PWA listos en public/icons/");
  } catch (e) {
    console.error("Error generando iconos:", e.message);
    process.exit(1);
  }
})();
