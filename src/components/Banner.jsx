import { Link } from 'react-router-dom'

export function Banner() {
  return (
    <section className="relative overflow-hidden bg-zinc-900 text-white">
      <div className="absolute inset-0 opacity-40">
        <img
          src="/images/banner-hero.svg"
          alt=""
          className="h-full w-full object-cover"
        />
      </div>
      <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/50 to-transparent" />
      <div className="relative mx-auto flex max-w-7xl flex-col gap-6 px-4 py-20 sm:px-6 sm:py-28 lg:max-w-2xl lg:py-32">
        <p className="text-xs font-semibold uppercase tracking-[0.35em] text-zinc-300">
          26 SPRING · CURATED
        </p>
        <h1 className="text-3xl font-light leading-tight tracking-tight sm:text-5xl">
          차분한 톤과
          <br />
          <span className="font-semibold">구조적인 실루엣</span>
        </h1>
        <p className="max-w-md text-sm leading-relaxed text-zinc-300">
          시즌 아우터와 데일리 니트를 한곳에서. 무신사·29CM 감성을 참고한 미니멀
          패션 스토어 플로우를 경험해 보세요.
        </p>
        <div className="flex flex-wrap gap-3">
          <Link
            to="/shop?sort=newest"
            className="inline-flex items-center justify-center rounded-full bg-white px-6 py-2.5 text-sm font-semibold text-zinc-900 transition hover:bg-zinc-100"
          >
            신상 보기
          </Link>
          <Link
            to="/shop?category=outer"
            className="inline-flex items-center justify-center rounded-full border border-white/40 px-6 py-2.5 text-sm font-medium text-white transition hover:bg-white/10"
          >
            아우터 컬렉션
          </Link>
        </div>
      </div>
    </section>
  )
}
