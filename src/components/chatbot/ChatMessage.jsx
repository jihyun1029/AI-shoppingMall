import { RecommendedProductList } from './RecommendedProductList.jsx'

const INTENT_LABEL = {
  PRODUCT_RECOMMEND: '상품 추천',
  COORDINATION_RECOMMEND: '코디 추천',
  CART_RECOMMEND: '장바구니 추천',
  GENERAL_INFO: '안내',
}

/** @param {{ role: 'user'|'assistant', content: string, products?: object[], intent?: string, onAdded?: () => void }} props */
export function ChatMessage({ role, content, products, intent, onAdded }) {
  const isUser = role === 'user'
  const intentLabel = intent && INTENT_LABEL[intent]
  return (
    <div className={`flex w-full ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div
        className={[
          'flex items-start gap-2',
          isUser ? 'max-w-[94%] flex-row-reverse sm:max-w-[86%]' : 'w-full max-w-[min(720px,calc(100vw-48px))]',
        ].join(' ')}
      >
        {!isUser ? (
          <span className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-zinc-900 text-[10px] font-semibold text-white">
            AI
          </span>
        ) : null}
        <div
          className={[
            'min-w-0 rounded-2xl px-3.5 py-2.5 text-sm shadow-sm',
            isUser
              ? 'max-w-full rounded-br-md bg-zinc-900 text-white leading-relaxed'
              : 'w-full max-w-full rounded-bl-md border border-zinc-200 bg-white text-zinc-800 leading-[1.7]',
          ].join(' ')}
        >
          {!isUser && intentLabel ? (
            <p className="mb-1.5 text-[10px] font-medium uppercase tracking-wide text-zinc-400">{intentLabel}</p>
          ) : null}
          <p className="whitespace-pre-wrap break-words [overflow-wrap:break-word] [word-break:keep-all]">{content}</p>
          {!isUser && products?.length ? (
            <RecommendedProductList products={products} onAdded={onAdded} />
          ) : null}
        </div>
      </div>
    </div>
  )
}
