/**
 * 여성 패션 100종 시드 → server/data/women_product_rows.json + seed_women_products.sql
 * 실행: node scripts/generate-women-seed.mjs
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.join(__dirname, '..')
const outJson = path.join(root, 'server/data/women_product_rows.json')
const outSql = path.join(root, 'server/data/seed_women_products.sql')

const BRANDS = [
  'RECTO',
  'STAND OIL',
  'LOW CLASSIC',
  'ANDERSSON BELL',
  'MARGESHERWOOD',
  '8SECONDS WOMEN',
  'ROH SEOUL',
  'KINDERSALMON',
  'LE17SEPTEMBRE',
  'NOTHING WRITTEN',
  'BEMUSE MANSION',
  'URBANIC 30',
  'THE CENTAUR',
  'ARCH THE',
  'OUI MAIS NON',
  'HAI THE LABEL',
  'PREEK',
  'LÉO',
  'EPURE',
  'ATELIER DE LUMEN',
  'MUSEE',
  'OFFON',
  'SOMEWHEREBUTTER',
  'CLUT STUDIO',
  'JUDITH BENHAMOU',
  'HELDER',
  'MOIA',
  'REJINA PYO',
  'GANNI',
  'COS WOMEN',
  'ARKET',
  'TOTEME',
  'LEMAIRE',
  'OUR LEGACY WOMEN',
  'ACNE STUDIOS',
]

const COLOR_POOLS = [
  ['아이보리', '블랙'],
  ['블랙', '차콜'],
  ['베이지', '브라운'],
  ['화이트', '네이비'],
  ['핑크', '아이보리'],
  ['그레이', '블랙'],
  ['크림', '라이트블루'],
  ['버건디', '블랙'],
  ['올리브', '베이지'],
  ['실버', '블랙'],
]

function rnd(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function pick(arr, i) {
  return arr[i % arr.length]
}

function priceForCategory(cat) {
  switch (cat) {
    case 'top':
      return rnd(20000, 80000)
    case 'outer':
      return rnd(80000, 300000)
    case 'bottom':
      return rnd(35000, 120000)
    case 'dress':
      return rnd(50000, 150000)
    case 'shoes':
      return rnd(50000, 200000)
    case 'bag':
      return rnd(50000, 250000)
    case 'accessory':
      return rnd(20000, 100000)
    default:
      return rnd(30000, 90000)
  }
}

function discountFor(i) {
  const opts = [0, 0, 5, 10, 10, 15, 20, 20, 25, 30]
  return opts[i % opts.length]
}

function sizesFor(cat, sub) {
  if (cat === 'shoes') return ['230', '235', '240', '245']
  if (cat === 'bag' || cat === 'accessory') return ['ONE']
  if (sub === '반바지' || sub === '미니 원피스') return ['S', 'M', 'L']
  return ['XS', 'S', 'M', 'L']
}

/** @type {{ category: string, subCategory: string, names: string[] }[]} */
const BLOCKS = [
  {
    category: 'top',
    subCategory: '반팔티',
    names: [
      '에센셜 슬림핏 라운드 티',
      '소프트 코튼 데일리 반팔티',
      '시스루 라인 포인트 티',
    ],
  },
  {
    category: 'top',
    subCategory: '블라우스',
    names: [
      '소프트 터치 블라우스',
      '셔링 넥 페미닌 블라우스',
      '새틴 라이트 블라우스',
    ],
  },
  {
    category: 'top',
    subCategory: '셔츠',
    names: [
      '오버핏 코튼 셔츠',
      '스트라이프 클래식 셔츠',
      '벨 슬리브 셔츠',
    ],
  },
  {
    category: 'top',
    subCategory: '니트',
    names: [
      '슬림핏 라운드 니트',
      '브이넥 울 블렌드 니트',
      '캐시미어 터치 크루 니트',
    ],
  },
  {
    category: 'top',
    subCategory: '가디건',
    names: [
      '미니멀 버튼 가디건',
      '루즈핏 모헤어 가디건',
      '크롭 길이 니트 가디건',
    ],
  },
  {
    category: 'outer',
    subCategory: '자켓',
    names: [
      '싱글 브레스티드 울 자켓',
      '크롭 트위드 자켓',
      '캐주얼 코튼 블레이저',
      '스트럭처드 숄더 자켓',
    ],
  },
  {
    category: 'outer',
    subCategory: '코트',
    names: [
      '핸드메이드 울 코트',
      '오버사이즈 맥 코트',
      '캐시미어 블렌드 롱 코트',
      '미니멌 더블 코트',
    ],
  },
  {
    category: 'outer',
    subCategory: '트렌치코트',
    names: [
      '벨티드 트렌치 코트',
      '미디 기장 클래식 트렌치',
      '라이트웨이트 스프링 트렌치',
      '와이드 슬리브 트렌치',
    ],
  },
  {
    category: 'outer',
    subCategory: '패딩',
    names: [
      '라이트 구스다운 패딩',
      '크롭 패딩 점퍼',
      '미니멀 무광 패딩',
    ],
  },
  {
    category: 'bottom',
    subCategory: '슬랙스',
    names: [
      '하이웨스트 와이드 슬랙스',
      '세미 와이드 핀턱 슬랙스',
      '스트레이트 오피스 슬랙스',
      '텐션 핏 테이퍼드 슬랙스',
    ],
  },
  {
    category: 'bottom',
    subCategory: '데님',
    names: [
      '스트레이트 미드 블루 데님',
      '하이웨스트 슬림 데님',
      '와이드 핏 라이트 데님',
      '루즈핏 데님 셔츠 팬츠',
    ],
  },
  {
    category: 'bottom',
    subCategory: '스커트',
    names: [
      '플리츠 미디 스커트',
      'H라인 미니 스커트',
      '새틴 롱 스커트',
      '랩 실루엣 스커트',
    ],
  },
  {
    category: 'bottom',
    subCategory: '반바지',
    names: [
      '테일러드 쇼츠',
      '코튼 밴딩 쇼츠',
      '데님 쇼츠',
    ],
  },
  {
    category: 'dress',
    subCategory: '미니 원피스',
    names: [
      '셔링 미니 원피스',
      '린넨 블렌드 미니 원피스',
      '슬리브리스 테일러드 원피스',
      '플로럴 라인 미니 원피스',
      '트위드 미니 원피스',
      '저지 핏 미니 원피스',
      '셔츠 카라 미니 원피스',
    ],
  },
  {
    category: 'dress',
    subCategory: '롱 원피스',
    names: [
      '셔츠 롱 원피스',
      '저지 맥시 원피스',
      '슬립 실루엣 롱 원피스',
      '벨티드 셔츠 롱 원피스',
      '플리츠 맥시 원피스',
      '니트 롱 원피스',
      '랩 롱 원피스',
    ],
  },
  {
    category: 'shoes',
    subCategory: '플랫슈즈',
    names: [
      '스퀘어토 레더 플랫',
      '메리제인 플랫',
      '발레리나 플랫',
      '로퍼형 플랫',
    ],
  },
  {
    category: 'shoes',
    subCategory: '힐',
    names: [
      '스틸레토 미들 힐',
      '블록힐 펌프스',
      '스트랩 샌들 힐',
    ],
  },
  {
    category: 'shoes',
    subCategory: '로퍼',
    names: [
      '페니 로퍼',
      '청키 솔 로퍼',
      '비브람 솔 클래식 로퍼',
      '스웨이드 로퍼',
    ],
  },
  {
    category: 'shoes',
    subCategory: '스니커즈',
    names: [
      '볼륨솔 레더 스니커즈',
      '미니멀 화이트 스니커즈',
      '패널 믹스 스니커즈',
    ],
  },
  {
    category: 'bag',
    subCategory: '토트백',
    names: [
      '데일리 쇼퍼 토트',
      '스트럭처드 미니 토트',
      '소프트 레더 토트',
      '캔버스 믹스 토트',
      '스퀘어 미니 토트',
    ],
  },
  {
    category: 'bag',
    subCategory: '숄더백',
    names: [
      '호보 숄더백',
      '체인 스트랩 숄더',
      '소프트 숄더백',
      '하프문 숄더백',
      '키르팅 숄더백',
    ],
  },
  {
    category: 'bag',
    subCategory: '크로스백',
    names: [
      '미니 크로스백',
      '나일론 크로스백',
      '플랩 크로스백',
      '슬링 크로스백',
    ],
  },
  {
    category: 'accessory',
    subCategory: '귀걸이',
    names: [
      '볼드 후프 이어링',
      '드롭 펄 이어링',
      '체인 링 이어링',
      '미니멀 스터드 세트',
      '믹스 메탈 이어링',
    ],
  },
  {
    category: 'accessory',
    subCategory: '목걸이',
    names: [
      '레이어드 체인 네크리스',
      '코인 펜던트 네크리스',
      '바 네크리스',
      '진주 포인트 네크리스',
    ],
  },
  {
    category: 'accessory',
    subCategory: '스카프',
    names: [
      '실크 스퀘어 스카프',
      '울 머플러',
      '린넨 블렌드 스카프',
      '체크 울 스카프',
    ],
  },
]

function descriptionFor(name, sub, brand) {
  return (
    `${name}은(는) ${brand}의 시즌 무드에 맞춰 데일리부터 오피스까지 폭넓게 활용하기 좋은 실루엣입니다. ` +
    `${sub} 카테고리에서 두드러지는 디테일과 착용감을 균형 있게 담았습니다. ` +
    `가벼운 레이어링이나 단독 착용 모두 자연스럽게 어울립니다.`
  )
}

function buildRows() {
  const rows = []
  let id = 1
  const baseDate = new Date('2025-01-15T12:00:00Z')
  for (const block of BLOCKS) {
    for (let i = 0; i < block.names.length; i++) {
      const name = block.names[i]
      const brand = pick(BRANDS, id + i * 3)
      const list = priceForCategory(block.category)
      const discountRate = discountFor(id)
      const salePrice = Math.max(0, Math.round((list * (100 - discountRate)) / 100))
      const colors = JSON.stringify(pick(COLOR_POOLS, id))
      const sizes = JSON.stringify(sizesFor(block.category, block.subCategory))
      const rating = Math.round((4.2 + (id % 8) * 0.1) * 10) / 10
      const reviewCount = rnd(12, 420) + (id % 50)
      const stock = rnd(8, 180)
      const isNew = id % 5 === 0 ? 1 : 0
      const isBest = id % 7 === 0 ? 1 : 0
      const image = `/images/products/product-${String(id).padStart(2, '0')}.svg`
      const createdAt = new Date(baseDate.getTime() - id * 86400000).toISOString().slice(0, 10)
      const updatedAt = new Date().toISOString()

      rows.push({
        id,
        brand,
        name,
        category: block.category,
        subCategory: block.subCategory,
        price: list,
        discountRate,
        salePrice,
        colors,
        sizes,
        gender: 'female',
        rating,
        reviewCount,
        stock,
        isNew,
        isBest,
        image,
        description: descriptionFor(name, block.subCategory, brand),
        createdAt,
        updatedAt,
      })
      id += 1
    }
  }
  if (rows.length !== 100) {
    throw new Error(`Expected 100 rows, got ${rows.length}`)
  }
  return rows
}

function sqlEscape(str) {
  return String(str).replace(/'/g, "''")
}

function rowToValuesSql(r) {
  return `(${r.id}, '${sqlEscape(r.brand)}', '${sqlEscape(r.name)}', '${sqlEscape(r.category)}', '${sqlEscape(r.subCategory)}', ${r.price}, ${r.discountRate}, ${r.salePrice}, '${sqlEscape(r.colors)}', '${sqlEscape(r.sizes)}', 'female', ${r.rating}, ${r.reviewCount}, ${r.stock}, ${r.isNew}, ${r.isBest}, '${sqlEscape(r.image)}', '${sqlEscape(r.description)}', '${sqlEscape(r.createdAt)}', '${sqlEscape(r.updatedAt)}')`
}

function buildSql(rows) {
  const header = `-- Women fashion seed (100). Generated by scripts/generate-women-seed.mjs
-- Usage: sqlite3 shop.db < server/data/seed_women_products.sql
BEGIN TRANSACTION;

DROP TABLE IF EXISTS products;

CREATE TABLE products (
  id INTEGER PRIMARY KEY,
  brand TEXT NOT NULL,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  subCategory TEXT NOT NULL,
  price INTEGER NOT NULL,
  discountRate INTEGER NOT NULL DEFAULT 0,
  salePrice INTEGER NOT NULL,
  colors TEXT NOT NULL DEFAULT '[]',
  sizes TEXT NOT NULL DEFAULT '[]',
  gender TEXT NOT NULL DEFAULT 'female',
  rating REAL NOT NULL DEFAULT 4.5,
  reviewCount INTEGER NOT NULL DEFAULT 0,
  stock INTEGER NOT NULL DEFAULT 0,
  isNew INTEGER NOT NULL DEFAULT 0,
  isBest INTEGER NOT NULL DEFAULT 0,
  image TEXT NOT NULL DEFAULT '',
  description TEXT NOT NULL DEFAULT '',
  createdAt TEXT NOT NULL,
  updatedAt TEXT NOT NULL
);

CREATE INDEX idx_products_category ON products(category);
CREATE INDEX idx_products_subCategory ON products(subCategory);
CREATE INDEX idx_products_brand ON products(brand);
CREATE INDEX idx_products_salePrice ON products(salePrice);
CREATE INDEX idx_products_isBest ON products(isBest);
CREATE INDEX idx_products_isNew ON products(isNew);

INSERT INTO products (
  id, brand, name, category, subCategory, price, discountRate, salePrice,
  colors, sizes, gender, rating, reviewCount, stock, isNew, isBest,
  image, description, createdAt, updatedAt
) VALUES
`

  const values = rows.map(rowToValuesSql).join(',\n')
  const footer = `;

-- 샘플 조회
-- SELECT category, COUNT(*) FROM products GROUP BY category;
-- SELECT * FROM products WHERE isBest = 1 ORDER BY salePrice DESC LIMIT 10;
-- SELECT * FROM products WHERE brand = 'RECTO' LIMIT 5;
-- SELECT * FROM products WHERE subCategory = '블라우스' AND salePrice BETWEEN 30000 AND 80000;

COMMIT;
`
  return header + values + footer
}

const rows = buildRows()
fs.mkdirSync(path.dirname(outJson), { recursive: true })
fs.writeFileSync(outJson, JSON.stringify(rows, null, 2), 'utf8')
fs.writeFileSync(outSql, buildSql(rows), 'utf8')
console.log(`Wrote ${rows.length} rows →\n  ${outJson}\n  ${outSql}`)
