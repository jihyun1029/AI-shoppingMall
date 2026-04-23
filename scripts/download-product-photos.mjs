/**
 * 실사진 JPG (Lorem Picsum, 시드 고정) → public/images/products/
 * Unsplash 일부 ID는 CDN에서 404가 나와 Picsum으로 통일합니다.
 * 실행: node scripts/download-product-photos.mjs
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import products from '../server/data/seed-products.json' with { type: 'json' }

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const outDir = path.join(__dirname, '../public/images/products')

/** 시드마다 다른 컷, 800×1000 JPG */
function urlForSlot(slot) {
  return `https://picsum.photos/seed/studio-line-${slot}/800/1000.jpg`
}

async function download(url, dest) {
  const res = await fetch(url, { headers: { Accept: 'image/*' } })
  if (!res.ok) throw new Error(`${res.status} ${url}`)
  const buf = Buffer.from(await res.arrayBuffer())
  fs.writeFileSync(dest, buf)
  return buf.length
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms))
}

fs.mkdirSync(outDir, { recursive: true })

let slot = 0
for (const p of products) {
  const pad = String(p.id).padStart(2, '0')
  if (p.id <= 14) {
    const u1 = urlForSlot(slot++)
    const u2 = urlForSlot(slot++)
    process.stdout.write(`#${p.id} a… `)
    await download(u1, path.join(outDir, `product-${pad}-a.jpg`))
    await sleep(180)
    process.stdout.write(`b… `)
    await download(u2, path.join(outDir, `product-${pad}-b.jpg`))
    console.log('ok')
    await sleep(180)
  } else {
    const u = urlForSlot(slot++)
    process.stdout.write(`#${p.id} … `)
    await download(u, path.join(outDir, `product-${pad}.jpg`))
    console.log('ok')
    await sleep(180)
  }
}

console.log('Done. JPG under public/images/products/')
