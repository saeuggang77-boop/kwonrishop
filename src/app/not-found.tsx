import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-4">
      <h1 className="text-6xl font-bold text-navy">404</h1>
      <p className="mt-4 text-lg text-gray-600">페이지를 찾을 수 없습니다.</p>
      <p className="mt-1 text-sm text-gray-400">
        요청하신 페이지가 존재하지 않거나 이동되었습니다.
      </p>
      <div className="mt-8 flex gap-3">
        <Link
          href="/"
          className="rounded-lg bg-mint px-6 py-3 text-sm font-medium text-white hover:bg-mint-dark"
        >
          홈으로 돌아가기
        </Link>
        <Link
          href="/listings"
          className="rounded-lg border border-gray-300 px-6 py-3 text-sm text-gray-600 hover:bg-gray-50"
        >
          매물 검색
        </Link>
      </div>
    </div>
  );
}
