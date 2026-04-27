import mongoose from 'mongoose'

const schema = new mongoose.Schema({
  _id: { type: String },
  email: { type: String, required: true, unique: true },
  password_hash: { type: String, required: true },
  name: { type: String, required: true },
  gender: { type: String, default: 'unknown' },
  role: { type: String, default: 'user' },
  created_at: { type: String, required: true },
})

export const User = mongoose.model('User', schema)
