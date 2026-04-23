import 'dotenv/config'
import { openDatabase, migrate } from './db.js'
import { reseedProducts, seedAdminUser, seedIfEmpty } from './seedDb.js'

const db = openDatabase()
migrate(db)

const cmd = process.argv[2] || 'if-empty'

if (cmd === 'if-empty') {
  seedIfEmpty(db)
  console.log('Seed if-empty done.')
} else if (cmd === 'products') {
  reseedProducts(db)
  console.log('Products re-seeded.')
} else if (cmd === 'admin') {
  try {
    seedAdminUser(db)
    console.log('Admin user inserted.')
  } catch (e) {
    console.error(e.message)
    process.exit(1)
  }
} else {
  console.log('Usage: node src/seedCli.js [if-empty|products|admin]')
}

db.close()
