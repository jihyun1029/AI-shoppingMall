/**
 * women_product_rows.json 기준으로 이미지 생성용 프롬프트 JSON 생성
 * 실행: node scripts/generate-product-image-prompts.mjs
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { buildCompactImagePrompt, buildProductImagePrompt } from '../src/utils/productImagePrompt.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.join(__dirname, '..')
const rowsPath = path.join(root, 'server/data/women_product_rows.json')
const outJson = path.join(root, 'server/data/product_image_prompts.json')
const outTxt = path.join(root, 'server/data/product_image_prompts.txt')

const raw = fs.readFileSync(rowsPath, 'utf8')
const rows = JSON.parse(raw)
if (!Array.isArray(rows)) throw new Error('Invalid women_product_rows.json')

const entries = rows.map((row) => {
  const color = (() => {
    try {
      const a = JSON.parse(row.colors || '[]')
      return Array.isArray(a) && a[0] ? String(a[0]) : ''
    } catch {
      return ''
    }
  })()

  const product = {
    brand: row.brand,
    name: row.name,
    category: row.category,
    subCategory: row.subCategory,
    colors: row.colors,
    color,
  }

  return {
    id: row.id,
    brand: row.brand,
    name: row.name,
    category: row.category,
    subCategory: row.subCategory,
    representativeColor: color,
    prompt: buildProductImagePrompt(product),
    promptCompact: buildCompactImagePrompt(product),
  }
})

fs.writeFileSync(outJson, JSON.stringify(entries, null, 2), 'utf8')

const txt = entries
  .map((e) => `[#${e.id}] FULL:\n${e.prompt}\n\n[#${e.id}] COMPACT:\n${e.promptCompact}`)
  .join('\n\n========\n\n')
fs.writeFileSync(outTxt, txt, 'utf8')

console.log(`Wrote ${entries.length} prompts →\n  ${outJson}\n  ${outTxt}`)
