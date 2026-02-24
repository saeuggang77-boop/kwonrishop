import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-navy-50 via-white to-navy-50 flex items-center justify-center px-4">
      <div className="max-w-2xl w-full text-center">
        {/* Header */}
        <div className="mb-8">
          <div className="inline-flex items-center justify-center w-24 h-24 bg-navy-100 rounded-full mb-6">
            <svg
              className="w-12 h-12 text-navy-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <h1 className="text-6xl font-bold text-navy-900 mb-4">404</h1>
          <h2 className="text-2xl font-bold text-navy-800 mb-3">
            페이지를 찾을 수 없습니다
          </h2>
          <p className="text-gray-600 max-w-md mx-auto">
            요청하신 페이지가 존재하지 않거나 이동했을 수 있습니다.
            <br />
            주소를 다시 확인해주세요.
          </p>
        </div>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/"
            className="inline-flex items-center justify-center px-8 py-3 bg-navy-600 text-white font-semibold rounded-lg hover:bg-navy-700 transition-colors shadow-md hover:shadow-lg"
          >
            <svg
              className="w-5 h-5 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
              />
            </svg>
            홈으로 가기
          </Link>
          <Link
            href="/listings"
            className="inline-flex items-center justify-center px-8 py-3 bg-white text-navy-600 font-semibold rounded-lg border-2 border-navy-600 hover:bg-navy-50 transition-colors shadow-md hover:shadow-lg"
          >
            <svg
              className="w-5 h-5 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            매물 찾기
          </Link>
        </div>
      </div>
    </div>
  );
}
