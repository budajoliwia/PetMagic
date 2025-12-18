import sharp from "sharp";

/**
 * Normalize model output: resize to max 1024px (fit: inside) and ensure format.
 * - Stickers should stay PNG (transparent if provided by the model).
 * - Images can be left as-is, but we convert to PNG for consistency.
 */
export async function normalizeOutput(
  buffer: Buffer,
  forcePng = true
): Promise<Buffer> {
  const img = sharp(buffer);
  const pipeline = img.resize({ width: 1024, height: 1024, fit: "inside" });
  return forcePng ? pipeline.png().toBuffer() : pipeline.jpeg({ quality: 90 }).toBuffer();
}

