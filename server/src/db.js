import mongoose from 'mongoose'

export async function connectMongo() {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/shopping-mall'
  await mongoose.connect(uri)
  console.log(`MongoDB connected: ${uri.replace(/:\/\/[^@]*@/, '://***@')}`)
}
