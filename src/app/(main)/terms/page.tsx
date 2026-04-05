import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "이용약관 - 권리샵",
  description: "권리샵의 이용약관을 확인하세요. 서비스 이용에 관한 권리와 의무, 책임 사항 등을 안내합니다.",
  openGraph: {
    title: "이용약관 - 권리샵",
    description: "권리샵의 이용약관을 확인하세요. 서비스 이용에 관한 권리와 의무.",
  },
};

export default function TermsPage() {
  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">이용약관</h1>

      <div className="prose prose-sm max-w-none space-y-8 text-gray-700">
        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            제1조 (목적)
          </h2>
          <p>
            본 약관은 씨이오(이하 "회사")가 운영하는 권리샵
            웹사이트(이하 "사이트")에서 제공하는 상가 권리금 직거래 중개 서비스
            및 관련 제반 서비스(이하 "서비스")의 이용과 관련하여 회사와 회원 간의
            권리, 의무 및 책임사항, 기타 필요한 사항을 규정함을 목적으로 합니다.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            제2조 (정의)
          </h2>
          <ol className="list-decimal list-inside space-y-2">
            <li>
              "사이트"란 회사가 상가 권리금 거래정보를 제공하기 위하여 컴퓨터
              등 정보통신설비를 이용하여 설정한 가상의 영업장을 말합니다.
            </li>
            <li>
              "회원"이란 본 약관에 동의하고 회사가 제공하는 서비스를 이용하는
              자를 말합니다.
            </li>
            <li>
              "매물"이란 회원이 사이트에 등록한 상가 권리금 거래 대상 물건을
              말합니다.
            </li>
            <li>
              "권리금"이란 영업시설·비품, 거래처, 신용, 영업상의 노하우,
              점포위치에 따른 영업상의 이점 등 유형·무형의 재산적 가치의 양도
              또는 이용대가를 말합니다.
            </li>
          </ol>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            제3조 (이용계약의 성립)
          </h2>
          <ol className="list-decimal list-inside space-y-2">
            <li>
              이용계약은 회원이 되고자 하는 자(이하 "가입신청자")가 본 약관의
              내용에 동의한 후 회원가입 신청을 하고, 회사가 이를 승낙함으로써
              성립합니다.
            </li>
            <li>
              회사는 가입신청자의 신청에 대하여 승낙함을 원칙으로 합니다. 다만,
              다음 각 호에 해당하는 경우 회사는 승낙을 거부하거나 사후에 이용계약을
              해지할 수 있습니다.
              <ul className="list-disc list-inside ml-6 mt-2 space-y-1">
                <li>타인의 명의를 도용한 경우</li>
                <li>허위 정보를 기재한 경우</li>
                <li>만 14세 미만인 경우</li>
                <li>기타 회사가 정한 이용신청 요건에 미비한 경우</li>
              </ul>
            </li>
          </ol>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            제4조 (서비스의 제공 및 변경)
          </h2>
          <ol className="list-decimal list-inside space-y-2">
            <li>
              회사는 다음과 같은 서비스를 제공합니다.
              <ul className="list-disc list-inside ml-6 mt-2 space-y-1">
                <li>상가 권리금 매물 정보 제공 및 검색 서비스</li>
                <li>매물 등록 및 관리 서비스</li>
                <li>회원 간 거래 중개 서비스</li>
                <li>커뮤니티 및 정보 교류 서비스</li>
                <li>기타 회사가 정하는 서비스</li>
              </ul>
            </li>
            <li>
              회사는 상당한 이유가 있는 경우 운영상, 기술상의 필요에 따라 제공하고
              있는 서비스를 변경할 수 있습니다.
            </li>
          </ol>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            제5조 (서비스의 중단)
          </h2>
          <p>
            회사는 컴퓨터 등 정보통신설비의 보수점검, 교체 및 고장, 통신의 두절
            등의 사유가 발생한 경우에는 서비스의 제공을 일시적으로 중단할 수
            있습니다. 이 경우 회사는 사전 또는 사후에 이를 공지합니다.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            제6조 (회원의 의무)
          </h2>
          <ol className="list-decimal list-inside space-y-2">
            <li>회원은 다음 행위를 하여서는 안 됩니다.
              <ul className="list-disc list-inside ml-6 mt-2 space-y-1">
                <li>신청 또는 변경 시 허위내용의 등록</li>
                <li>타인의 정보 도용</li>
                <li>회사가 게시한 정보의 변경</li>
                <li>회사가 정한 정보 이외의 정보(컴퓨터 프로그램 등) 송신 또는 게시</li>
                <li>회사와 기타 제3자의 저작권 등 지적재산권 침해</li>
                <li>회사 및 기타 제3자의 명예를 손상시키거나 업무를 방해하는 행위</li>
                <li>외설 또는 폭력적인 메시지, 화상, 음성, 기타 공서양속에 반하는 정보를 사이트에 공개 또는 게시하는 행위</li>
              </ul>
            </li>
            <li>
              회원은 관계법령, 본 약관, 이용안내 및 서비스상에 공지한 주의사항,
              회사가 통지하는 사항 등을 준수하여야 합니다.
            </li>
          </ol>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            제7조 (매물 등록 및 관리)
          </h2>
          <ol className="list-decimal list-inside space-y-2">
            <li>
              회원은 매물 등록 시 정확하고 상세한 정보를 제공하여야 하며, 허위
              정보를 게재해서는 안 됩니다.
            </li>
            <li>
              회사는 등록된 매물이 다음 각 호에 해당하는 경우 사전 통지 없이
              삭제하거나 게시를 거부할 수 있습니다.
              <ul className="list-disc list-inside ml-6 mt-2 space-y-1">
                <li>허위 또는 과장된 정보가 포함된 경우</li>
                <li>타인의 권리를 침해하는 내용인 경우</li>
                <li>법령 또는 본 약관에 위반되는 경우</li>
                <li>기타 회사가 부적절하다고 판단하는 경우</li>
              </ul>
            </li>
          </ol>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            제8조 (거래 관련 책임)
          </h2>
          <ol className="list-decimal list-inside space-y-2">
            <li>
              회사는 회원 간 거래를 중개하는 플랫폼을 제공할 뿐이며, 실제 거래의
              당사자가 아닙니다.
            </li>
            <li>
              회원 간 거래에서 발생하는 모든 책임은 거래 당사자에게 있으며, 회사는
              거래의 안전성, 진실성, 적법성 등에 대하여 어떠한 보증도 하지
              않습니다.
            </li>
            <li>
              회원은 거래 전 충분한 확인 절차를 거쳐야 하며, 거래로 인해 발생하는
              손해에 대해 회사는 책임을 지지 않습니다.
            </li>
          </ol>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            제9조 (유료 서비스)
          </h2>
          <ol className="list-decimal list-inside space-y-2">
            <li>
              회사는 매물 광고 상품(VIP, 프리미엄, 베이직), 프랜차이즈 광고,
              협력업체 광고, 집기 광고, 끌어올리기 등 유료 서비스(이하
              &quot;유료 서비스&quot;)를 제공합니다.
            </li>
            <li>
              유료 서비스의 종류, 이용 요금, 이용 기간 등은 해당 서비스
              페이지에 별도로 게시합니다.
            </li>
            <li>
              회원은 회사가 정한 결제 수단(신용카드, 계좌이체 등)을 통해
              유료 서비스를 구매할 수 있습니다.
            </li>
          </ol>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            제10조 (청약철회 및 환불)
          </h2>
          <ol className="list-decimal list-inside space-y-2">
            <li>
              회원은 유료 서비스를 구매한 날로부터 7일 이내에 청약철회를
              요청할 수 있습니다. 단, 서비스 이용이 개시된 경우(광고 노출이
              시작된 경우) 아래 기준에 따릅니다.
            </li>
            <li>
              환불 기준은 다음과 같습니다.
              <ul className="list-disc list-inside ml-6 mt-2 space-y-1">
                <li>구매 후 광고 노출 시작 전: 전액 환불</li>
                <li>광고 노출이 시작된 후: 환불 불가</li>
                <li>
                  끌어올리기 등 즉시 소모되는 서비스: 사용 후 환불 불가
                </li>
              </ul>
            </li>
            <li>
              환불 요청은 고객센터(문의하기 페이지) 또는 이메일을 통해
              접수할 수 있으며, 접수일로부터 영업일 기준 3일 이내에
              처리됩니다.
            </li>
            <li>
              환불은 원래 결제 수단으로 진행되며, 결제 수단에 따라 환불
              소요 기간이 상이할 수 있습니다.
            </li>
            <li>
              회원의 귀책사유(약관 위반, 허위 매물 등록 등)로 서비스가
              중단된 경우에는 환불되지 않습니다.
            </li>
            <li>
              다른 상품으로 업그레이드 시 기존 광고는 즉시 종료되며, 기존
              상품에 대한 환불은 이루어지지 않습니다.
            </li>
          </ol>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            제11조 (결제 및 과오납금)
          </h2>
          <ol className="list-decimal list-inside space-y-2">
            <li>
              유료 서비스 결제 시 회원은 본인 명의의 결제 수단을 사용하여야
              합니다.
            </li>
            <li>
              과오납금이 발생한 경우 회사는 확인 후 전액 환불합니다.
            </li>
            <li>
              회사의 귀책사유로 과오납금이 발생한 경우 전액을 환불하며,
              회원의 귀책사유인 경우 환불에 소요되는 비용은 회원이
              부담합니다.
            </li>
          </ol>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            제12조 (면책조항)
          </h2>
          <ol className="list-decimal list-inside space-y-2">
            <li>
              회사는 천재지변 또는 이에 준하는 불가항력으로 인하여 서비스를 제공할
              수 없는 경우에는 서비스 제공에 관한 책임이 면제됩니다.
            </li>
            <li>
              회사는 회원의 귀책사유로 인한 서비스 이용의 장애에 대하여 책임을
              지지 않습니다.
            </li>
            <li>
              회사는 회원이 게재한 정보, 자료, 사실의 신뢰도, 정확성 등에 대해서는
              책임을 지지 않습니다.
            </li>
          </ol>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            제13조 (개인정보보호)
          </h2>
          <p>
            회사는 관계법령이 정하는 바에 따라 회원의 개인정보를 보호하기 위해
            노력합니다. 개인정보의 보호 및 이용에 대해서는 관련법령 및 회사의
            개인정보처리방침이 적용됩니다.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            제14조 (분쟁해결)
          </h2>
          <ol className="list-decimal list-inside space-y-2">
            <li>
              회사는 회원이 제기하는 정당한 의견이나 불만을 반영하고 그 피해를
              보상처리하기 위하여 피해보상처리기구를 설치·운영합니다.
            </li>
            <li>
              본 약관과 관련하여 회사와 회원 간에 분쟁이 발생한 경우, 쌍방간
              합의에 의해 원만히 해결하는 것을 원칙으로 합니다.
            </li>
            <li>
              제2항의 규정에도 불구하고 분쟁이 해결되지 않을 경우 관할법원은
              민사소송법상의 관할법원으로 합니다.
            </li>
          </ol>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            제15조 (준거법 및 재판관할)
          </h2>
          <p>
            본 약관의 해석 및 회사와 회원 간의 분쟁에 대하여는 대한민국 법을
            적용하며, 분쟁 발생 시 관할법원은 민사소송법에 따른 관할법원으로
            합니다.
          </p>
        </section>

        <section className="mt-12 pt-8 border-t border-gray-300">
          <p className="text-sm text-gray-600">시행일: 2024년 1월 1일</p>
        </section>
      </div>
    </div>
  );
}
