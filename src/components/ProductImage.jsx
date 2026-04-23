import { useMemo } from 'react'
import { productImageCandidates, useProductImageSrc } from '../utils/productImage'

/**
 * @param {{
 *   product?: { image?: string; images?: string[]; id?: string | number };
 *   src?: string;
 *   className?: string;
 *   alt?: string;
 *   loading?: 'lazy' | 'eager';
 * }} props
 */
export function ProductImage({ product = {}, src, className, alt = '', loading, ...rest }) {
  const list = useMemo(() => {
    if (src) {
      return productImageCandidates({ ...product, image: src, images: [src] })
    }
    return productImageCandidates(product)
  }, [product, src])

  const { src: resolved, onError } = useProductImageSrc(list)

  return (
    <img
      src={resolved}
      alt={alt}
      className={className}
      loading={loading}
      onError={onError}
      {...rest}
    />
  )
}
