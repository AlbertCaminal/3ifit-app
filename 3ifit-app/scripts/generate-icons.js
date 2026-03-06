#!/usr/bin/env node
/**
 * Genera iconos PWA (192x192, 512x512) desde el logo.
 * Ejecutar: npm run generate-icons
 */

const fs = require("fs");
const path = require("path");

const iconsDir = path.join(__dirname, "..", "public", "icons");
const logoPath = path.join(iconsDir, "tresipunt_logo_processed.png");

if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

(async () => {
  try {
    const sharp = require("sharp");
    if (!fs.existsSync(logoPath)) {
      console.error("No se encuentra tresipunt_logo_processed.png en public/icons/");
      process.exit(1);
    }
    const sizes = [192, 512];
    for (const size of sizes) {
      await sharp(logoPath)
        .resize(size, size)
        .png()
        .toFile(path.join(iconsDir, `icon-${size}.png`));
      console.log(`Generated icon-${size}.png from logo`);
    }
  } catch (e) {
    console.error("Error generando iconos:", e.message);
    process.exit(1);
  }
})();
