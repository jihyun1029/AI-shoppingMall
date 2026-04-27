import 'dotenv/config'
import mongoose from 'mongoose'
import { connectMongo } from './db.js'
import { reseedProducts, seedAdminUser, seedIfEmpty } from './seedDb.js'

const cmd = process.argv[2] || 'if-empty'

try {
  await connectMongo()

  if (cmd === 'if-empty') {
    await seedIfEmpty()
    console.log('Seed if-empty done.')
  } else if (cmd === 'products') {
    await reseedProducts()
    console.log('Products re-seeded.')
  } else if (cmd === 'admin') {
    try {
      await seedAdminUser()
      console.log('Admin user inserted.')
    } catch (e) {
      console.error(e.message)
      process.exit(1)
    }
  } else {
    console.log('Usage: node src/seedCli.js [if-empty|products|admin]')
  }
} catch (e) {
  console.error(e.message)
  process.exit(1)
} finally {
  await mongoose.disconnect()
}
