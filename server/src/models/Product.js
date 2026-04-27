import mongoose from 'mongoose'

const schema = new mongoose.Schema({
  id: { type: Number, required: true, unique: true, index: true },
  brand: { type: String, required: true },
  name: { type: String, required: true },
  category: { type: String, required: true, index: true },
  subCategory: { type: String, required: true, index: true },
  price: { type: Number, required: true },
  discountRate: { type: Number, default: 0 },
  salePrice: { type: Number, required: true },
  colors: { type: [String], default: [] },
  sizes: { type: [String], default: [] },
  gender: { type: String, default: 'female' },
  rating: { type: Number, default: 4.5 },
  reviewCount: { type: Number, default: 0 },
  stock: { type: Number, default: 0 },
  isNew: { type: Boolean, default: false },
  isBest: { type: Boolean, default: false, index: true },
  image: { type: String, default: '' },
  description: { type: String, default: '' },
  createdAt: { type: String, required: true },
  updatedAt: { type: String, required: true },
})

export const Product = mongoose.model('Product', schema)
