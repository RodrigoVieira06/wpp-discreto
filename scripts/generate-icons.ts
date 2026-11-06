import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const source = fileURLToPath(new URL('../assets/logo.png', import.meta.url));

// Resize the approved artwork without changing its composition or transparency.
await Promise.all(
  [16, 32, 48, 128].map(async (size) => {
    const destination = fileURLToPath(new URL(`../assets/icon-${size}.png`, import.meta.url));
    await sharp(source)
      .resize(size, size, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png()
      .toFile(destination);
  }),
);
console.log('Generated 16, 32, 48, and 128 px icons from assets/logo.png.');
