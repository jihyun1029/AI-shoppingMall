import { RecommendedProductList } from './RecommendedProductList.jsx'

/** @param {{ role: 'user'|'assistant', content: string, products?: object[], onAdded?: () => void }} props */
export function ChatMessage({ role, content, products, onAdded }) {
  const isUser = role === 'user'
  return (
    <div className={`flex w-full ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div className={`flex max-w-[94%] items-start gap-2 sm:max-w-[86%] ${isUser ? 'flex-row-reverse' : ''}`}>
        {!isUser ? (
          <span className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-zinc-900 text-[10px] font-semibold text-white">
            AI
          </span>
        ) : null}
        <div
          className={[
            'rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed shadow-sm',
            isUser ? 'rounded-br-md bg-zinc-900 text-white' : 'rounded-bl-md border border-zinc-200 bg-white text-zinc-800',
          ].join(' ')}
        >
          <p className="whitespace-pre-wrap">{content}</p>
          {!isUser && products?.length ? (
            <RecommendedProductList products={products} onAdded={onAdded} />
          ) : null}
        </div>
      </div>
    </div>
  )
}
