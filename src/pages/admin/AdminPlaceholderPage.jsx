export function AdminPlaceholderPage({ title }) {
  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm">
      <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">{title}</h1>
      <p className="mt-2 text-sm text-zinc-500">
        포트폴리오용 UI 목업 영역입니다. 실제 API 연동 없이 관리자 화면 흐름을 보여줍니다.
      </p>
    </div>
  )
}
