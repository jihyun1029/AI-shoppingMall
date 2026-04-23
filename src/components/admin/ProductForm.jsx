import { useMemo, useState } from 'react'
import {
  GENDER_OPTIONS,
  SHOP_CATEGORIES,
  SUBCATEGORY_OPTIONS,
} from '../../data/products'
import { isValidSubCategory } from '../../utils/productHelpers'

function toFormInitial(initial) {
  if (!initial) {
    return {
      brand: '',
      name: '',
      category: 'top',
      subCategory: '반팔티',
      price: 0,
      discountRate: 0,
      image: '',
      imageAlt: '',
      colors: '블랙, 화이트',
      sizes: 'M, L',
      gender: 'unisex',
      rating: 4.5,
      reviewCount: 0,
      stock: 100,
      isNew: false,
      isBest: false,
      description: '',
      material: '',
      care: '',
      shipping: '',
    }
  }
  return {
    brand: initial.brand || '',
    name: initial.name || '',
    category: initial.category || 'top',
    subCategory:
      initial.subCategory ||
      (SUBCATEGORY_OPTIONS[initial.category]?.[0] ?? SUBCATEGORY_OPTIONS.top[0]),
    price: initial.originalPrice || initial.salePrice || initial.price || 0,
    discountRate: initial.discountRate || 0,
    image: initial.image || initial.images?.[0] || '',
    imageAlt: initial.images?.[1] || '',
    colors: (initial.colors || []).map((c) => c.name).join(', '),
    sizes: (initial.sizes || []).join(', '),
    gender: initial.gender || 'unisex',
    rating: initial.rating || 4.5,
    reviewCount: initial.reviewCount || 0,
    stock: initial.stock ?? 0,
    isNew: Boolean(initial.isNew),
    isBest: Boolean(initial.isBest),
    description: initial.description || '',
    material: initial.material || '',
    care: initial.care || '',
    shipping: initial.shipping || '',
  }
}

export function ProductForm({ initial, onSubmit, submitLabel = '저장' }) {
  const [form, setForm] = useState(() => toFormInitial(initial))
  const [errors, setErrors] = useState({})

  const subOptions = useMemo(
    () => SUBCATEGORY_OPTIONS[form.category] ?? [],
    [form.category],
  )

  const update = (key, value) => setForm((prev) => ({ ...prev, [key]: value }))

  const submit = (e) => {
    e.preventDefault()
    const nextErrors = validate(form)
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) return
    onSubmit(form)
  }

  return (
    <form onSubmit={submit} className="space-y-6">
      <section className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
        <h2 className="text-sm font-semibold text-zinc-900">기본 정보</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <Field
            label="브랜드명"
            error={errors.brand}
            value={form.brand}
            onChange={(v) => update('brand', v)}
          />
          <Field
            label="상품명"
            error={errors.name}
            value={form.name}
            onChange={(v) => update('name', v)}
          />
          <Select
            label="카테고리"
            value={form.category}
            onChange={(v) => {
              const nextSub = SUBCATEGORY_OPTIONS[v]?.[0] ?? ''
              setForm((prev) => ({ ...prev, category: v, subCategory: nextSub }))
            }}
            options={SHOP_CATEGORIES.filter((c) => c.id !== 'all').map((c) => ({
              value: c.id,
              label: c.label,
            }))}
          />
          <Select
            label="서브카테고리"
            value={form.subCategory}
            onChange={(v) => update('subCategory', v)}
            options={subOptions.map((x) => ({ value: x, label: x }))}
            error={errors.subCategory}
          />
          <NumberField
            label="정가(원)"
            value={form.price}
            onChange={(v) => update('price', v)}
            error={errors.price}
          />
          <NumberField
            label="할인율(%)"
            value={form.discountRate}
            onChange={(v) => update('discountRate', v)}
            error={errors.discountRate}
          />
          <Field
            label="대표 이미지 URL"
            value={form.image}
            onChange={(v) => update('image', v)}
            error={errors.image}
            placeholder="https://..."
            className="sm:col-span-2"
          />
          <Field
            label="추가 이미지 URL"
            value={form.imageAlt}
            onChange={(v) => update('imageAlt', v)}
            placeholder="https://..."
            className="sm:col-span-2"
          />
          <Field
            label="색상 (쉼표 구분)"
            value={form.colors}
            onChange={(v) => update('colors', v)}
            error={errors.colors}
            className="sm:col-span-2"
          />
          <Field
            label="사이즈 (쉼표 구분)"
            value={form.sizes}
            onChange={(v) => update('sizes', v)}
            error={errors.sizes}
            className="sm:col-span-2"
          />
          <Select
            label="성별"
            value={form.gender}
            onChange={(v) => update('gender', v)}
            options={GENDER_OPTIONS.map((g) => ({ value: g.value, label: g.label }))}
            error={errors.gender}
          />
          <NumberField
            label="재고"
            value={form.stock}
            onChange={(v) => update('stock', v)}
            error={errors.stock}
          />
          <NumberField
            label="평점"
            step="0.1"
            value={form.rating}
            onChange={(v) => update('rating', v)}
          />
          <NumberField
            label="리뷰 수"
            value={form.reviewCount}
            onChange={(v) => update('reviewCount', v)}
          />
        </div>
        <div className="mt-4 flex flex-wrap gap-4 text-sm">
          <Check
            label="신상품"
            checked={form.isNew}
            onChange={(v) => update('isNew', v)}
          />
          <Check
            label="베스트"
            checked={form.isBest}
            onChange={(v) => update('isBest', v)}
          />
        </div>
      </section>

      <section className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
        <h2 className="text-sm font-semibold text-zinc-900">설명 정보</h2>
        <div className="mt-4 grid gap-4">
          <TextArea
            label="상품 설명"
            value={form.description}
            onChange={(v) => update('description', v)}
            error={errors.description}
          />
          <TextArea
            label="소재"
            value={form.material}
            onChange={(v) => update('material', v)}
          />
          <TextArea
            label="세탁"
            value={form.care}
            onChange={(v) => update('care', v)}
          />
          <TextArea
            label="배송 안내"
            value={form.shipping}
            onChange={(v) => update('shipping', v)}
          />
        </div>
      </section>

      <div className="flex justify-end">
        <button
          type="submit"
          className="rounded-full bg-zinc-900 px-8 py-3 text-sm font-semibold text-white hover:bg-zinc-800"
        >
          {submitLabel}
        </button>
      </div>
    </form>
  )
}

function validate(form) {
  const errors = {}
  if (!form.brand.trim()) errors.brand = '브랜드명을 입력해 주세요.'
  if (!form.name.trim()) errors.name = '상품명을 입력해 주세요.'
  if (!form.category) errors.category = '카테고리를 선택해 주세요.'
  if (!isValidSubCategory(form.category, form.subCategory)) {
    errors.subCategory = '서브카테고리를 선택해 주세요.'
  }
  if (Number.isNaN(Number(form.price)) || Number(form.price) <= 0) {
    errors.price = '정가는 0보다 큰 숫자여야 합니다.'
  }
  if (
    Number.isNaN(Number(form.discountRate)) ||
    Number(form.discountRate) < 0 ||
    Number(form.discountRate) > 90
  ) {
    errors.discountRate = '할인율은 0~90 사이 숫자여야 합니다.'
  }
  if (!String(form.image || '').trim()) errors.image = '대표 이미지 URL을 입력해 주세요.'
  if (!String(form.colors || '').trim()) errors.colors = '색상 정보를 입력해 주세요.'
  if (!String(form.sizes || '').trim()) errors.sizes = '사이즈 정보를 입력해 주세요.'
  if (!form.gender) errors.gender = '성별을 선택해 주세요.'
  if (Number.isNaN(Number(form.stock)) || Number(form.stock) < 0) {
    errors.stock = '재고는 0 이상 숫자여야 합니다.'
  }
  if (!String(form.description || '').trim()) {
    errors.description = '상품 설명을 입력해 주세요.'
  }
  return errors
}

function Field({ label, error, value, onChange, className = '', ...props }) {
  return (
    <div className={className}>
      <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
        {label}
      </label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={[
          'mt-1.5 w-full rounded-xl border px-3 py-2 text-sm outline-none',
          error ? 'border-red-300 bg-red-50/30' : 'border-zinc-200 focus:border-zinc-900',
        ].join(' ')}
        {...props}
      />
      {error ? <p className="mt-1 text-xs text-red-600">{error}</p> : null}
    </div>
  )
}

function NumberField({ label, error, value, onChange, ...props }) {
  return (
    <Field
      label={label}
      error={error}
      type="number"
      value={value}
      onChange={(v) => onChange(Number(v))}
      {...props}
    />
  )
}

function Select({ label, value, onChange, options, error }) {
  return (
    <div>
      <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
        {label}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={[
          'mt-1.5 w-full rounded-xl border px-3 py-2 text-sm outline-none',
          error ? 'border-red-300 bg-red-50/30' : 'border-zinc-200 focus:border-zinc-900',
        ].join(' ')}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {error ? <p className="mt-1 text-xs text-red-600">{error}</p> : null}
    </div>
  )
}

function TextArea({ label, value, onChange, error }) {
  return (
    <div>
      <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
        {label}
      </label>
      <textarea
        rows={3}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={[
          'mt-1.5 w-full rounded-xl border px-3 py-2 text-sm outline-none',
          error ? 'border-red-300 bg-red-50/30' : 'border-zinc-200 focus:border-zinc-900',
        ].join(' ')}
      />
      {error ? <p className="mt-1 text-xs text-red-600">{error}</p> : null}
    </div>
  )
}

function Check({ label, checked, onChange }) {
  return (
    <label className="inline-flex items-center gap-2">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="rounded border-zinc-300"
      />
      <span className="text-sm text-zinc-700">{label}</span>
    </label>
  )
}
