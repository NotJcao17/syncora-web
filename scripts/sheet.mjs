// node scripts/sheet.mjs <salida.png> <cols> <ancho> img1 img2 ...
import sharp from 'sharp';
const [out, colsS, wS, ...files] = process.argv.slice(2);
const cols = Number(colsS), w = Number(wS);
const tiles = await Promise.all(files.map(async (f) => {
  const img = sharp(f).resize({ width: w });
  const buf = await img.png().toBuffer();
  const meta = await sharp(buf).metadata();
  return { buf, h: meta.height };
}));
const rows = Math.ceil(tiles.length / cols);
const rowH = [];
for (let r = 0; r < rows; r++) rowH.push(Math.max(...tiles.slice(r * cols, r * cols + cols).map((t) => t.h)));
const H = rowH.reduce((a, b) => a + b + 8, 0);
const composites = tiles.map((t, i) => {
  const r = Math.floor(i / cols), c = i % cols;
  return { input: t.buf, left: c * (w + 8), top: rowH.slice(0, r).reduce((a, b) => a + b + 8, 0) };
});
await sharp({ create: { width: cols * (w + 8), height: H, channels: 3, background: '#ff00ff' } })
  .composite(composites).png().toFile(out);
console.log('ok', out);
