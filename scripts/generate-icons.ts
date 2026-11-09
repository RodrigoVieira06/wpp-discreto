import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const source = fileURLToPath(new URL('../assets/logo.png', import.meta.url));

// Remove excess transparent canvas while keeping the approved artwork intact.
const artwork = await sharp(source).trim({ background: '#00000000', threshold: 10 }).toBuffer();
const bounds = await sharp(artwork).metadata();
const padding = Math.ceil(Math.max(bounds.width ?? 0, bounds.height ?? 0) * 0.05);
const paddedArtwork = await sharp(artwork)
  .extend({
    top: padding,
    bottom: padding,
    left: padding,
    right: padding,
    background: { r: 0, g: 0, b: 0, alpha: 0 },
  })
  .toBuffer();
await Promise.all(
  [16, 32, 48, 128].map(async (size) => {
    const destination = fileURLToPath(new URL(`../assets/icon-${size}.png`, import.meta.url));
    await sharp(paddedArtwork)
      .resize(size, size, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png()
      .toFile(destination);
  }),
);
console.log('Generated 16, 32, 48, and 128 px icons from assets/logo.png.');
