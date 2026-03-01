/**
 * Optimiza imágenes PNG/JPG a WebP.
 * Uso: npm run optimize-images
 *
 * Edita la lista `conversions` para añadir o cambiar imágenes.
  
1. Metes los PNG nuevos en frontend/src/assets/
  2. Editas scripts/optimize-images.js — añades una línea al array conversions con el nombre
   del archivo, el output y las dimensiones
  3. Ejecutas desde la carpeta frontend/:
  npm run optimize-images
  4. Importas el .webp resultante en el componente donde lo necesites

  El script sobreescribe el WebP si ya existe, así que también sirve para re-optimizar si
  cambias una imagen.

 */

import sharp from 'sharp';
import { existsSync, statSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const assetsDir = join(__dirname, '../src/assets');

// --- Configura aquí tus imágenes ---
const conversions = [
  { input: 'hero-device.png',     output: 'hero-device.webp',     width: 1200, height: 900  },
  { input: 'hero-bg.jpg  .png',   output: 'hero-bg.webp',         width: 1920, height: 1080 },
  { input: 'step-1-proyecto.png', output: 'step-1-proyecto.webp', width: 800,  height: 600  },
  { input: 'step-2-registro.png', output: 'step-2-registro.webp', width: 800,  height: 600  },
  { input: 'step-3-informe.png',  output: 'step-3-informe.webp',  width: 800,  height: 600  },
  { input: 'cta-bg.png',          output: 'cta-bg.webp',          width: 1920, height: 700  },
];

// quality: 1–100 (80–85 es el punto óptimo calidad/tamaño)
const QUALITY = 82;

for (const c of conversions) {
  const inputPath  = join(assetsDir, c.input);
  const outputPath = join(assetsDir, c.output);

  if (!existsSync(inputPath)) {
    console.log(`⚠️  No encontrado, omitiendo: ${c.input}`);
    continue;
  }

  try {
    await sharp(inputPath)
      .resize(c.width, c.height, { fit: 'cover', position: 'center' })
      .webp({ quality: QUALITY })
      .toFile(outputPath);

    const before = (statSync(inputPath).size / 1024 / 1024).toFixed(1);
    const after  = (statSync(outputPath).size / 1024).toFixed(0);
    console.log(`✅  ${c.output}: ${before}MB → ${after}KB`);
  } catch (err) {
    console.error(`❌  Error con ${c.input}:`, err.message);
  }
}
