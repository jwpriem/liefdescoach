import sharp from 'sharp'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const publicDir = path.join(__dirname, '..', 'public')
const src = path.join(publicDir, 'apple.png') // 512x512 high-res source

await sharp(src).resize(180, 180).toFile(path.join(publicDir, 'apple-touch-icon.png'))
console.log('Generated apple-touch-icon.png (180x180)')

await sharp(src).resize(192, 192).toFile(path.join(publicDir, 'icon-192.png'))
console.log('Generated icon-192.png')

// apple.png is already 512x512, copy it as icon-512
await sharp(src).resize(512, 512).toFile(path.join(publicDir, 'icon-512.png'))
console.log('Generated icon-512.png')
