export const metadata = { title: "면책조항" };

export default function DisclaimerPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="font-heading text-3xl font-bold text-navy">면책조항</h1>
      <div className="mt-8 space-y-6">
        <section>
          <h2 className="text-xl font-bold text-navy">서비스 이용 안내</h2>
          <p className="mt-2 text-gray-600">
            권리샵에서 제공하는 모든 정보(시세 분석, 가치 평가, 시장 동향, 권리진단서 등)는
            공개된 데이터와 통계 모델을 기반으로 작성된 참고용 자료이며, 법적 효력이 없습니다.
          </p>
        </section>
        <section>
          <h2 className="text-xl font-bold text-navy">예측 및 분석의 한계</h2>
          <p className="mt-2 text-gray-600">
            예측치는 추정치이며 실제 거래 결과와 다를 수 있습니다. 플랫폼은 매물의
            정확성, 적법성, 완전성을 보증하지 않습니다.
          </p>
        </section>
        <section>
          <h2 className="text-xl font-bold text-navy">전문가 검토 권장</h2>
          <div className="mt-2 rounded-lg border-2 border-warning bg-warning/10 p-4">
            <p className="font-medium text-gray-800">
              중요한 부동산 거래 및 권리 관련 의사결정 시, 반드시 전문 법무사,
              변호사, 또는 공인중개사의 검토를 받으시기 바랍니다.
            </p>
          </div>
        </section>
        <section>
          <h2 className="text-xl font-bold text-navy">데이터 출처</h2>
          <ul className="mt-2 list-disc space-y-1 pl-6 text-gray-600">
            <li>등기부등본 공개정보</li>
            <li>국토교통부 실거래가 공개시스템</li>
            <li>플랫폼 내부 매물 데이터</li>
            <li>통계청 부동산 관련 통계</li>
          </ul>
        </section>
        <section>
          <h2 className="text-xl font-bold text-navy">책임 제한</h2>
          <p className="mt-2 text-gray-600">
            권리샵은 서비스 이용으로 인해 발생하는 직접적, 간접적, 부수적, 결과적
            손해에 대하여 관련 법령이 허용하는 범위 내에서 책임을 지지 않습니다.
          </p>
        </section>
        <section>
          <h2 className="text-xl font-bold text-navy">권리진단서 면책조항</h2>
          <ul className="mt-2 list-disc space-y-1 pl-6 text-gray-600">
            <li>권리진단서는 권리샵이 제공하는 참고용 분석 자료이며, 법적 효력이 있는 공식 문서가 아닙니다.</li>
            <li>분석 결과는 입력된 정보와 공개 데이터를 기반으로 산출되며, 정확성 및 완전성을 보증하지 않습니다.</li>
            <li>권리진단서의 내용을 근거로 한 거래 결정 및 그에 따른 손실에 대해 권리샵은 책임지지 않습니다.</li>
            <li>실제 거래 시 반드시 공인중개사, 법률 전문가 등 관련 전문가와 상담하시기 바랍니다.</li>
            <li>권리진단서에 포함된 시세 정보는 조사 시점의 데이터를 기반으로 하며, 시장 상황에 따라 변동될 수 있습니다.</li>
          </ul>
        </section>
      </div>
      <div className="mt-12 rounded-lg bg-gray-100 p-6 text-center text-sm text-gray-500">
        <p>
          본 면책조항에 대한 문의사항은{" "}
          <span className="text-navy">legal@kwonrishop.com</span>
          으로 연락해 주세요.
        </p>
      </div>
    </div>
  );
}
