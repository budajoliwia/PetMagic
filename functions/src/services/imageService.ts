import sharp from "sharp";
export async function normalizeOutput(
  buffer: Buffer,
  forcePng = true
): Promise<Buffer> {
  const img = sharp(buffer);
  const pipeline = img.resize({ width: 1024, height: 1024, fit: "inside" });
  return forcePng ? pipeline.png().toBuffer() : pipeline.jpeg({ quality: 90 }).toBuffer();
}

