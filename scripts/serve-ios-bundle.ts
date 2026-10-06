/**
 * Serves the iOS bundle (.output-ios/public) for the app-mode e2e run.
 * Like the iOS shell, every path without a file extension gets the SPA entry.
 *
 * Usage: tsx scripts/serve-ios-bundle.ts [port]
 */

import { createServer } from 'node:http'
import { readFile } from 'node:fs/promises'
import { extname, join, normalize } from 'node:path'

const ROOT = '.output-ios/public'
const port = Number(process.argv[2] ?? 4173)

const CONTENT_TYPES: Record<string, string> = {
    '.html': 'text/html; charset=utf-8',
    '.js': 'text/javascript',
    '.mjs': 'text/javascript',
    '.css': 'text/css',
    '.json': 'application/json',
    '.svg': 'image/svg+xml',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.webp': 'image/webp',
    '.ico': 'image/x-icon',
    '.woff': 'font/woff',
    '.woff2': 'font/woff2',
}

createServer(async (req, res) => {
    const pathname = normalize(decodeURIComponent(new URL(req.url ?? '/', 'http://localhost').pathname))
    const file = extname(pathname) ? join(ROOT, pathname) : join(ROOT, 'index.html')
    try {
        const body = await readFile(file)
        res.writeHead(200, { 'content-type': CONTENT_TYPES[extname(file)] ?? 'application/octet-stream' })
        res.end(body)
    } catch {
        res.writeHead(404).end()
    }
}).listen(port, 'localhost', () => console.log(`iOS bundle on http://localhost:${port}`))
