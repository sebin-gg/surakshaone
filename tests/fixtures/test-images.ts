/**
 * Generates minimal valid image buffers for testing.
 * These are not real images, but have valid headers to pass MIME checks.
 */

/** Minimal valid 1x1 PNG */
export function makePNG(size: number = 67): Buffer {
  // Valid PNG: magic(8) + IHDR chunk(25) + minimal IDAT
  const buf = Buffer.alloc(size);
  buf.writeUInt32BE(0x89504E47, 0); // PNG magic
  buf.writeUInt32BE(0x0D0A1A0A, 4); // PNG header
  // IHDR chunk
  buf.writeUInt32BE(13, 8); // data length
  buf.write("IHDR", 12);
  buf.writeUInt32BE(1, 16); // width=1
  buf.writeUInt32BE(1, 20); // height=1
  buf.writeUInt8(8, 24); // bit depth
  buf.writeUInt8(2, 25); // color type=RGB
  buf.writeUInt32BE(0, 26); // CRC placeholder
  return buf;
}

/** Minimal valid JPEG */
export function makeJPEG(size: number = 200): Buffer {
  const buf = Buffer.alloc(size);
  buf.writeUInt16BE(0xFFD8, 0); // SOI marker
  buf.writeUInt16BE(0xFFE0, 2); // APP0 marker
  buf.write("JFIF\0", 4);
  buf.writeUInt16BE(0xFFD9, size - 2); // EOI marker
  return buf;
}

/** Minimal valid WebP */
export function makeWebP(size: number = 100): Buffer {
  const buf = Buffer.alloc(size);
  buf.write("RIFF", 0);
  buf.writeUInt32LE(size - 8, 4);
  buf.write("WEBP", 8);
  return buf;
}

/** Minimal valid GIF */
export function makeGIF(size: number = 100): Buffer {
  const buf = Buffer.alloc(size);
  buf.write("GIF89a", 0);
  // Logical Screen Descriptor
  buf.writeUInt16LE(1, 6); // width=1
  buf.writeUInt16LE(1, 8); // height=1
  buf.writeUInt8(0xF0, 10); // GCT flag, no GCT
  return buf;
}

/** SVG file (should be rejected) */
export function makeSVG(): Buffer {
  return Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"><circle r="10"/></svg>');
}

/** PDF file (should be rejected) */
export function makePDF(): Buffer {
  return Buffer.from("%PDF-1.4 fake content");
}

/** Text file (should be rejected) */
export function makeText(): Buffer {
  return Buffer.from("This is not an image.");
}
