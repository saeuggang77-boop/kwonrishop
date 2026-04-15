import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 bg-cream">
      <div className="text-center">
        <div className="font-serif italic font-light text-[160px] md:text-[200px] leading-none text-terra-300 mb-4">
          404
        </div>
        <h2 className="text-2xl md:text-3xl font-extrabold text-green-700 tracking-tight mb-3">
          페이지를 찾을 수 <span className="font-serif italic font-light text-terra-500">없습니다</span>
        </h2>
        <p className="text-sm text-muted mb-8">
          요청하신 페이지가 존재하지 않거나 이동되었습니다.
        </p>
        <div className="flex gap-3 justify-center flex-wrap">
          <Link
            href="/"
            className="px-6 py-3 bg-green-700 text-cream rounded-full font-semibold hover:bg-green-800 transition-colors text-sm"
          >
            홈으로
          </Link>
          <Link
            href="/listings"
            className="px-6 py-3 border border-line bg-cream text-green-700 rounded-full font-semibold hover:border-green-700 transition-colors text-sm"
          >
            매물 둘러보기
          </Link>
        </div>
      </div>
    </div>
  );
}
