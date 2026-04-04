export default function AboutPage() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-navy-600 to-navy-800 text-white py-20">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-6">
            상가 직거래의 새로운 기준, 권리샵
          </h1>
          <p className="text-xl md:text-2xl text-navy-100 max-w-3xl mx-auto">
            투명하고 안전한 상가 권리금 거래 플랫폼
          </p>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
              우리의 미션
            </h2>
            <p className="text-lg text-gray-700 leading-relaxed text-center mb-12">
              권리샵은 상가 권리금 거래의 투명성을 높이고, 매도자와 매수자가
              안전하게 직거래할 수 있는 환경을 만듭니다. 중개 수수료 부담 없이
              합리적인 가격으로 거래할 수 있도록 돕고, 정확한 매물 정보 제공을
              통해 신뢰할 수 있는 거래 문화를 조성합니다.
            </p>

            {/* Key Values */}
            <div className="grid md:grid-cols-3 gap-8 mt-12">
              <div className="text-center p-6">
                <div className="w-16 h-16 bg-navy-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg
                    className="w-8 h-8 text-navy-700"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                  투명한 거래
                </h3>
                <p className="text-gray-600">
                  숨겨진 비용 없이 모든 정보를 공개하여 신뢰할 수 있는 거래를
                  지원합니다.
                </p>
              </div>

              <div className="text-center p-6">
                <div className="w-16 h-16 bg-navy-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg
                    className="w-8 h-8 text-navy-700"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                  정확한 정보
                </h3>
                <p className="text-gray-600">
                  검증된 매물 정보만을 제공하여 시간과 비용을 절약할 수 있도록
                  돕습니다.
                </p>
              </div>

              <div className="text-center p-6">
                <div className="w-16 h-16 bg-navy-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg
                    className="w-8 h-8 text-navy-700"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                    />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                  안전한 소통
                </h3>
                <p className="text-gray-600">
                  개인정보를 보호하면서도 원활한 거래 협의가 가능한 환경을
                  제공합니다.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Company Info Section */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
              회사 정보
            </h2>
            <div className="bg-white rounded-lg shadow-sm p-8">
              <dl className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <dt className="text-sm font-semibold text-gray-600 mb-1">
                    회사명
                  </dt>
                  <dd className="text-lg text-gray-900">씨이오</dd>
                </div>
                <div>
                  <dt className="text-sm font-semibold text-gray-600 mb-1">
                    대표이사
                  </dt>
                  <dd className="text-lg text-gray-900">박상만</dd>
                </div>
                <div>
                  <dt className="text-sm font-semibold text-gray-600 mb-1">
                    사업자등록번호
                  </dt>
                  <dd className="text-lg text-gray-900">408-70-43230</dd>
                </div>
                <div>
                  <dt className="text-sm font-semibold text-gray-600 mb-1">
                    통신판매업
                  </dt>
                  <dd className="text-lg text-gray-900">제2023-서울동작-1252호</dd>
                </div>
                <div className="md:col-span-2">
                  <dt className="text-sm font-semibold text-gray-600 mb-1">
                    주소
                  </dt>
                  <dd className="text-lg text-gray-900">
                    서울특별시 동작구 장승배기로4길 9
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-semibold text-gray-600 mb-1">
                    고객센터
                  </dt>
                  <dd className="text-lg text-gray-900">1588-7928</dd>
                </div>
                <div>
                  <dt className="text-sm font-semibold text-gray-600 mb-1">
                    이메일
                  </dt>
                  <dd className="text-lg text-gray-900">
                    samsungcu@naver.com
                  </dd>
                </div>
              </dl>
            </div>
          </div>
        </div>
      </section>

      {/* Contact CTA */}
      <section className="py-16 bg-navy-700 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">
            권리샵과 함께 시작해보세요
          </h2>
          <p className="text-xl text-navy-100 mb-8">
            투명하고 안전한 상가 거래의 새로운 경험
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="/sell"
              className="bg-white text-navy-700 px-8 py-3 rounded-lg font-semibold hover:bg-navy-50 transition-colors"
            >
              매물 등록하기
            </a>
            <a
              href="/listings"
              className="bg-navy-700 text-white px-8 py-3 rounded-lg font-semibold hover:bg-navy-800 transition-colors border-2 border-white"
            >
              매물 검색하기
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
