import sharp from 'sharp';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

const publicDir = resolve('static');
const sizes = [192, 512];

if (!existsSync(publicDir)) {
	mkdirSync(publicDir, { recursive: true });
}

const svgPath = resolve(publicDir, 'icon-192.svg');
const svgBuffer = readFileSync(svgPath);

for (const size of sizes) {
	const outPath = resolve(publicDir, `pwa-${size}x${size}.png`);
	await sharp(svgBuffer)
		.resize(size, size)
		.png()
		.toFile(outPath);
	console.log(`Generated ${outPath}`);
}