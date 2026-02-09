import sharp from "sharp";

/**
 * Compute average hash (aHash) of an image
 * 1. Resize to 8x8 grayscale
 * 2. Compute mean
 * 3. Each pixel above mean = 1, below = 0
 * Returns 16-char hex string (64 bits)
 */
export async function computeAverageHash(buffer: Buffer): Promise<string> {
  const pixels = await sharp(buffer)
    .resize(8, 8, { fit: "fill" })
    .grayscale()
    .raw()
    .toBuffer();

  const mean = pixels.reduce((sum, v) => sum + v, 0) / pixels.length;

  let hash = "";
  for (let i = 0; i < pixels.length; i += 4) {
    let nibble = 0;
    for (let j = 0; j < 4 && i + j < pixels.length; j++) {
      if (pixels[i + j] >= mean) {
        nibble |= 1 << (3 - j);
      }
    }
    hash += nibble.toString(16);
  }

  return hash;
}

/**
 * Compute perceptual hash (pHash) of an image
 * Simplified implementation:
 * 1. Resize to 32x32 grayscale
 * 2. Apply DCT (simplified as mean-based blocks)
 * 3. Compare each 4x4 block's mean to global mean
 * Returns 16-char hex string (64 bits)
 */
export async function computePerceptualHash(buffer: Buffer): Promise<string> {
  const size = 32;
  const pixels = await sharp(buffer)
    .resize(size, size, { fit: "fill" })
    .grayscale()
    .raw()
    .toBuffer();

  // Compute 8x8 block averages (from 32x32 image → 8x8 blocks of 4x4)
  const blockSize = size / 8;
  const blockAverages: number[] = [];

  for (let by = 0; by < 8; by++) {
    for (let bx = 0; bx < 8; bx++) {
      let sum = 0;
      for (let y = 0; y < blockSize; y++) {
        for (let x = 0; x < blockSize; x++) {
          sum += pixels[(by * blockSize + y) * size + (bx * blockSize + x)];
        }
      }
      blockAverages.push(sum / (blockSize * blockSize));
    }
  }

  const mean =
    blockAverages.reduce((a, b) => a + b, 0) / blockAverages.length;

  let hash = "";
  for (let i = 0; i < blockAverages.length; i += 4) {
    let nibble = 0;
    for (let j = 0; j < 4 && i + j < blockAverages.length; j++) {
      if (blockAverages[i + j] >= mean) {
        nibble |= 1 << (3 - j);
      }
    }
    hash += nibble.toString(16);
  }

  return hash;
}
