/** @param {import('better-sqlite3').Database} db */
export function migrateProductsTable(db) {
  const exists = db
    .prepare(`SELECT name FROM sqlite_master WHERE type='table' AND name='products'`)
    .get()

  if (!exists) {
    createProductsTable(db)
    return
  }

  const cols = db.prepare(`PRAGMA table_info(products)`).all()
  const colNames = new Set(cols.map((c) => c.name))
  if (colNames.has('payload')) {
    db.exec(`DROP TABLE products`)
    createProductsTable(db)
    return
  }

  if (!colNames.has('salePrice')) {
    db.exec(`DROP TABLE products`)
    createProductsTable(db)
  }
}

function createProductsTable(db) {
  db.exec(`
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

    CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
    CREATE INDEX IF NOT EXISTS idx_products_subCategory ON products(subCategory);
    CREATE INDEX IF NOT EXISTS idx_products_brand ON products(brand);
    CREATE INDEX IF NOT EXISTS idx_products_salePrice ON products(salePrice);
    CREATE INDEX IF NOT EXISTS idx_products_isBest ON products(isBest);
    CREATE INDEX IF NOT EXISTS idx_products_isNew ON products(isNew);
  `)
}
