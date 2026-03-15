import sharp from 'sharp'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const publicDir = path.join(__dirname, '..', 'public')
const src = path.join(publicDir, 'logo.png')

await sharp(src).resize(192, 192).toFile(path.join(publicDir, 'icon-192.png'))
console.log('Generated icon-192.png')

await sharp(src).resize(512, 512).toFile(path.join(publicDir, 'icon-512.png'))
console.log('Generated icon-512.png')
