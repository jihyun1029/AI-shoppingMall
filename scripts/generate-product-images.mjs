/**
 * women_product_rows.json 기준으로 public/images/products/ 에 SVG 생성 (product-01.svg ~ product-100.svg)
 * 선행: npm run generate:women-seed
 * 실행: node scripts/generate-product-images.mjs
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const rowsPath = path.join(__dirname, '../server/data/women_product_rows.json')
const outDir = path.join(__dirname, '../public/images/products')

function esc(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

/** @param {{ id: number; name: string }} p */
function hueFor(p, variant) {
  return (p.id * 19 + (variant === 'b' ? 47 : 0) + p.name.length * 3) % 360
}

/** @param {string} code */
function silhouette(code, subCategory, variant) {
  const v = variant === 'b' ? 1 : 0
  switch (code) {
    case 'top':
      return `
  <g opacity="0.88" transform="translate(${v * 8 - 4},${v * -6})" fill="none" stroke="#0a0a0a" stroke-width="2.2" stroke-linejoin="round">
    <path d="M280 380 Q400 340 520 380 L540 520 Q400 560 260 520 Z" fill="rgba(255,255,255,0.35)"/>
    <path d="M320 380 L320 320 Q400 280 480 320 L480 380"/>
    <path d="M340 520 L340 720 Q400 740 460 720 L460 520"/>
  </g>`
    case 'outer':
      return `
  <g opacity="0.88" transform="translate(${v * 6},${v * -4})" fill="none" stroke="#0a0a0a" stroke-width="2.2" stroke-linejoin="round">
    <path d="M240 360 L280 340 L520 340 L560 360 L580 540 L400 580 L220 540 Z" fill="rgba(255,255,255,0.3)"/>
    <path d="M400 340 L400 520"/>
    <path d="M320 360 L360 420 L400 400 L440 420 L480 360"/>
  </g>`
    case 'bottom':
      return `
  <g opacity="0.88" transform="translate(${v * 5},0)" fill="none" stroke="#0a0a0a" stroke-width="2.2" stroke-linejoin="round">
    <path d="M320 380 L480 380 L500 420 L480 760 L400 780 L320 760 L300 420 Z" fill="rgba(255,255,255,0.32)"/>
    <path d="M400 380 L400 500"/>
    <path d="M340 420 L340 720 M460 420 L460 720"/>
  </g>`
    case 'dress':
      return `
  <g opacity="0.88" transform="translate(${v * 4},0)" fill="none" stroke="#0a0a0a" stroke-width="2.2" stroke-linejoin="round">
    <path d="M340 320 Q400 300 460 320 L500 400 L480 760 L400 800 L320 760 L300 400 Z" fill="rgba(255,255,255,0.33)"/>
    <path d="M360 320 L360 280 Q400 260 440 280 L440 320"/>
  </g>`
    case 'shoes':
      return `
  <g opacity="0.9" transform="translate(${v * 10},${v * 12})" fill="none" stroke="#0a0a0a" stroke-width="2.2" stroke-linejoin="round">
    <path d="M220 520 Q280 480 420 500 L620 540 Q660 560 640 600 L200 580 Q180 540 220 520 Z" fill="rgba(255,255,255,0.4)"/>
    <path d="M240 560 L600 590"/>
    <ellipse cx="400" cy="575" rx="120" ry="28" fill="rgba(0,0,0,0.06)"/>
  </g>`
    case 'bag':
      return `
  <g opacity="0.9" transform="translate(0,${v * 8})" fill="none" stroke="#0a0a0a" stroke-width="2.2" stroke-linejoin="round">
    <path d="M280 420 L520 420 L540 480 L520 720 L280 720 L260 480 Z" fill="rgba(255,255,255,0.36)"/>
    <path d="M320 420 Q400 360 480 420"/>
    <path d="M300 480 L500 480"/>
  </g>`
    case 'accessory':
      if (subCategory === '귀걸이') {
        return `
  <g opacity="0.9" transform="translate(0,${v * 6})" fill="none" stroke="#0a0a0a" stroke-width="2.2" stroke-linejoin="round">
    <circle cx="340" cy="480" r="42" fill="rgba(255,255,255,0.25)"/>
    <circle cx="460" cy="480" r="42" fill="rgba(255,255,255,0.25)"/>
    <path d="M340 438 Q400 400 460 438"/>
  </g>`
      }
      if (subCategory === '목걸이') {
        return `
  <g opacity="0.9" transform="translate(${v * 4},${v * 4})" fill="none" stroke="#0a0a0a" stroke-width="2.2" stroke-linejoin="round">
    <path d="M280 420 Q400 380 520 420 Q400 520 280 420" fill="rgba(255,255,255,0.22)"/>
    <circle cx="400" cy="500" r="28" fill="rgba(255,255,255,0.35)"/>
  </g>`
      }
      if (subCategory === '스카프') {
        return `
  <g opacity="0.88" transform="translate(${v * -6},${v * 8})" fill="none" stroke="#0a0a0a" stroke-width="2.2" stroke-linejoin="round">
    <path d="M260 460 Q400 420 540 460 Q520 560 400 600 Q280 560 260 460 Z" fill="rgba(255,255,255,0.3)"/>
    <path d="M300 500 Q400 480 500 500"/>
  </g>`
      }
      return `
  <g opacity="0.88" fill="none" stroke="#0a0a0a" stroke-width="2.2" stroke-linejoin="round">
    <rect x="320" y="420" width="160" height="160" rx="12" fill="rgba(255,255,255,0.28)"/>
    <path d="M360 460 L440 540 M440 460 L360 540"/>
  </g>`
    default:
      return silhouette('top', subCategory, variant)
  }
}

/** @param {{ id: number; brand: string; name: string; category: string; subCategory: string }} p */
function buildSvg(p, variant) {
  const code = String(p.category || 'top')
  const sub = String(p.subCategory || '')
  const h = hueFor(p, variant)
  const h2 = (h + 35) % 360
  const sil = silhouette(code, sub, variant)
  const pad = String(p.id).padStart(2, '0')

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="800" height="1000" viewBox="0 0 800 1000">
  <defs>
    <linearGradient id="bg-${pad}-${variant}" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:hsl(${h},18%,88%)"/>
      <stop offset="55%" style="stop-color:hsl(${h2},12%,78%)"/>
      <stop offset="100%" style="stop-color:hsl(${h},8%,68%)"/>
    </linearGradient>
    <filter id="grain-${pad}" x="0" y="0">
      <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="3" stitchTiles="stitch" result="n"/>
      <feColorMatrix type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0.04 0" in="n" result="g"/>
      <feBlend in="SourceGraphic" in2="g" mode="multiply"/>
    </filter>
  </defs>
  <rect width="800" height="1000" fill="url(#bg-${pad}-${variant})"/>
  <rect width="800" height="1000" filter="url(#grain-${pad})" opacity="0.5"/>
  <rect x="72" y="96" width="656" height="760" rx="6" fill="rgba(255,255,255,0.14)" stroke="rgba(0,0,0,0.06)"/>
  ${sil}
  <text x="400" y="900" text-anchor="middle" font-family="ui-sans-serif,system-ui,sans-serif" font-size="13" fill="#18181b" opacity="0.35">${esc(p.name)}</text>
  <text x="400" y="928" text-anchor="middle" font-family="ui-sans-serif,system-ui,sans-serif" font-size="11" letter-spacing="0.2em" fill="#18181b" opacity="0.28">${esc(p.brand)}</text>
  <text x="400" y="956" text-anchor="middle" font-family="ui-sans-serif,system-ui,sans-serif" font-size="10" fill="#18181b" opacity="0.22">#${pad}</text>
</svg>`
}

if (!fs.existsSync(rowsPath)) {
  console.error('Missing', rowsPath, '→ run: npm run generate:women-seed')
  process.exit(1)
}

const products = JSON.parse(fs.readFileSync(rowsPath, 'utf8'))
if (!Array.isArray(products) || products.length === 0) {
  console.error('women_product_rows.json is empty')
  process.exit(1)
}

fs.mkdirSync(outDir, { recursive: true })

for (const p of products) {
  const pad = String(p.id).padStart(2, '0')
  fs.writeFileSync(path.join(outDir, `product-${pad}.svg`), buildSvg(p, 'a'), 'utf8')
}

console.log(`Generated ${products.length} files → ${outDir}`)
