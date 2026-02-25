import fs from 'fs';

// A minimal 1x1 base64 transparent PNG
const base64Png = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=";
const buffer = Buffer.from(base64Png, 'base64');

fs.writeFileSync('./public/pwa-192x192.png', buffer);
fs.writeFileSync('./public/pwa-512x512.png', buffer);

console.log('Created placeholder PNGs');
