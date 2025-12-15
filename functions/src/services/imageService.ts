import sharp from "sharp";

const STYLE_TINTS: Record<string, string> = {
  Sticker: "#f472b6",
  Cartoon: "#60a5fa",
  "Oil Painting": "#fbbf24",
  "Line Art": "#a78bfa",
};

export async function stylizeImage(
  buffer: Buffer,
  style: string
): Promise<Buffer> {
  const tintColor = STYLE_TINTS[style] ?? "#94a3b8";

  return sharp(buffer)
    .resize({
      width: 1024,
      height: 1024,
      fit: "inside",
    })
    .tint(tintColor)
    .png()
    .toBuffer();
}

