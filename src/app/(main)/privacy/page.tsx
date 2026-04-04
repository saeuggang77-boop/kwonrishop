import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "개인정보처리방침 - 권리샵",
  description: "권리샵의 개인정보처리방침을 확인하세요. 회원의 개인정보 수집, 이용, 보관, 파기에 관한 정책.",
  openGraph: {
    title: "개인정보처리방침 - 권리샵",
    description: "권리샵의 개인정보처리방침을 확인하세요.",
  },
};

export default function PrivacyPage() {
  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">
        개인정보처리방침
      </h1>

      <div className="prose prose-sm max-w-none space-y-8 text-gray-700">
        <section>
          <p className="mb-4">
            씨이오(이하 "회사")는 개인정보보호법 제30조에 따라
            정보주체의 개인정보를 보호하고 이와 관련한 고충을 신속하고 원활하게
            처리할 수 있도록 하기 위하여 다음과 같이 개인정보처리방침을
            수립·공개합니다.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            제1조 (개인정보의 처리 목적)
          </h2>
          <p className="mb-2">
            회사는 다음의 목적을 위하여 개인정보를 처리합니다. 처리하고 있는
            개인정보는 다음의 목적 이외의 용도로는 이용되지 않으며, 이용 목적이
            변경되는 경우에는 개인정보보호법 제18조에 따라 별도의 동의를 받는 등
            필요한 조치를 이행할 예정입니다.
          </p>
          <ol className="list-decimal list-inside space-y-2">
            <li>회원 가입 및 관리: 회원 가입의사 확인, 회원제 서비스 제공, 본인
              확인, 회원자격 유지·관리, 서비스 부정이용 방지, 각종 고지·통지
            </li>
            <li>
              매물 등록 및 거래 서비스 제공: 매물 정보 게시, 거래 연락처 제공,
              거래 중개 서비스 제공
            </li>
            <li>마케팅 및 광고: 이벤트 및 광고성 정보 제공, 서비스 이용에 대한
              통계 분석
            </li>
            <li>고객 문의 및 불만 처리: 민원인의 신원 확인, 민원사항 확인, 사실
              조사를 위한 연락·통지, 처리결과 통보
            </li>
          </ol>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            제2조 (처리하는 개인정보의 항목)
          </h2>
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">
                1. 회원가입 시 수집항목
              </h3>
              <ul className="list-disc list-inside ml-4 space-y-1">
                <li>필수항목: 이메일, 비밀번호, 이름, 전화번호</li>
                <li>선택항목: 사업자등록번호, 상호명</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">
                2. 소셜 로그인 시 수집항목
              </h3>
              <ul className="list-disc list-inside ml-4 space-y-1">
                <li>카카오: 이메일, 이름, 프로필 이미지(선택)</li>
                <li>네이버: 이메일, 이름, 전화번호, 프로필 이미지(선택)</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">
                3. 매물 등록 시 수집항목
              </h3>
              <ul className="list-disc list-inside ml-4 space-y-1">
                <li>매물 정보, 연락처, 사진</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">
                4. 결제 시 수집항목
              </h3>
              <ul className="list-disc list-inside ml-4 space-y-1">
                <li>결제정보(토스페이먼츠를 통한 결제 처리)</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">
                5. 자동 수집 항목
              </h3>
              <ul className="list-disc list-inside ml-4 space-y-1">
                <li>
                  IP 주소, 쿠키, 방문 일시, 서비스 이용 기록, 불량 이용 기록
                </li>
              </ul>
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            제3조 (개인정보의 처리 및 보유기간)
          </h2>
          <ol className="list-decimal list-inside space-y-2">
            <li>
              회사는 법령에 따른 개인정보 보유·이용기간 또는 정보주체로부터
              개인정보를 수집 시에 동의받은 개인정보 보유·이용기간 내에서
              개인정보를 처리·보유합니다.
            </li>
            <li>
              각각의 개인정보 처리 및 보유 기간은 다음과 같습니다.
              <ul className="list-disc list-inside ml-6 mt-2 space-y-1">
                <li>회원 가입 및 관리: 회원 탈퇴 시까지</li>
                <li>매물 정보: 매물 삭제 시까지</li>
                <li>전자상거래 관련 기록: 5년 (전자상거래법)</li>
                <li>소비자 불만 또는 분쟁처리 기록: 3년 (전자상거래법)</li>
                <li>대금결제 및 재화 등의 공급 기록: 5년 (전자상거래법)</li>
                <li>계약 또는 청약철회 등에 관한 기록: 5년 (전자상거래법)</li>
                <li>표시·광고에 관한 기록: 6개월 (전자상거래법)</li>
              </ul>
            </li>
          </ol>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            제4조 (개인정보의 제3자 제공)
          </h2>
          <ol className="list-decimal list-inside space-y-2">
            <li>
              회사는 정보주체의 개인정보를 제1조(개인정보의 처리 목적)에서 명시한
              범위 내에서만 처리하며, 정보주체의 동의, 법률의 특별한 규정 등
              개인정보보호법 제17조에 해당하는 경우에만 개인정보를 제3자에게
              제공합니다.
            </li>
            <li>
              회사는 다음과 같이 개인정보를 제3자에게 제공하고 있습니다.
              <div className="ml-6 mt-2 space-y-3">
                <div>
                  <p className="font-semibold">카카오 (소셜 로그인)</p>
                  <ul className="list-disc list-inside ml-4 text-sm">
                    <li>제공받는 자: 카카오</li>
                    <li>제공 목적: 소셜 로그인 서비스 제공</li>
                    <li>제공 항목: 이메일, 이름</li>
                    <li>보유 및 이용기간: 회원 탈퇴 시 또는 동의 철회 시까지</li>
                  </ul>
                </div>
                <div>
                  <p className="font-semibold">네이버 (소셜 로그인)</p>
                  <ul className="list-disc list-inside ml-4 text-sm">
                    <li>제공받는 자: 네이버</li>
                    <li>제공 목적: 소셜 로그인 서비스 제공</li>
                    <li>제공 항목: 이메일, 이름, 전화번호</li>
                    <li>보유 및 이용기간: 회원 탈퇴 시 또는 동의 철회 시까지</li>
                  </ul>
                </div>
                <div>
                  <p className="font-semibold">토스페이먼츠 (결제)</p>
                  <ul className="list-disc list-inside ml-4 text-sm">
                    <li>제공받는 자: 토스페이먼츠</li>
                    <li>제공 목적: 결제 처리</li>
                    <li>제공 항목: 결제 정보</li>
                    <li>보유 및 이용기간: 거래 완료 후 5년</li>
                  </ul>
                </div>
              </div>
            </li>
          </ol>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            제5조 (개인정보처리의 위탁)
          </h2>
          <p>
            회사는 원활한 개인정보 업무처리를 위하여 다음과 같이 개인정보 처리업무를
            위탁하고 있습니다.
          </p>
          <ul className="list-disc list-inside ml-4 mt-2 space-y-1">
            <li>
              현재 개인정보 처리 위탁 업체 없음 (향후 위탁 발생 시 본 방침에
              공개)
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            제6조 (개인정보의 파기)
          </h2>
          <ol className="list-decimal list-inside space-y-2">
            <li>
              회사는 개인정보 보유기간의 경과, 처리목적 달성 등 개인정보가
              불필요하게 되었을 때에는 지체없이 해당 개인정보를 파기합니다.
            </li>
            <li>
              파기의 절차 및 방법은 다음과 같습니다.
              <ul className="list-disc list-inside ml-6 mt-2 space-y-1">
                <li>
                  파기절차: 불필요하게 된 개인정보는 개인정보 보호책임자의 승인
                  후 파기됩니다.
                </li>
                <li>
                  파기방법: 전자적 파일 형태는 복구 불가능한 방법으로 영구 삭제,
                  종이 문서는 분쇄기로 분쇄하거나 소각
                </li>
              </ul>
            </li>
          </ol>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            제7조 (정보주체의 권리·의무 및 행사방법)
          </h2>
          <ol className="list-decimal list-inside space-y-2">
            <li>
              정보주체는 회사에 대해 언제든지 다음 각 호의 개인정보 보호 관련
              권리를 행사할 수 있습니다.
              <ul className="list-disc list-inside ml-6 mt-2 space-y-1">
                <li>개인정보 열람 요구</li>
                <li>오류 등이 있을 경우 정정 요구</li>
                <li>삭제 요구</li>
                <li>처리정지 요구</li>
              </ul>
            </li>
            <li>
              제1항에 따른 권리 행사는 회사에 대해 서면, 전화, 전자우편 등을 통하여
              하실 수 있으며, 회사는 이에 대해 지체없이 조치하겠습니다.
            </li>
          </ol>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            제8조 (개인정보의 안전성 확보조치)
          </h2>
          <p className="mb-2">
            회사는 개인정보의 안전성 확보를 위해 다음과 같은 조치를 취하고
            있습니다.
          </p>
          <ol className="list-decimal list-inside space-y-1">
            <li>관리적 조치: 내부관리계획 수립·시행, 정기적 직원 교육</li>
            <li>기술적 조치: 개인정보처리시스템 접근권한 관리, 접근통제시스템
              설치, 개인정보의 암호화, 보안프로그램 설치
            </li>
            <li>물리적 조치: 전산실, 자료보관실 등의 접근통제</li>
          </ol>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            제9조 (쿠키의 운용)
          </h2>
          <ol className="list-decimal list-inside space-y-2">
            <li>
              회사는 이용자에게 개별적인 맞춤서비스를 제공하기 위해 쿠키(Cookie)를
              사용합니다.
            </li>
            <li>
              쿠키는 웹사이트를 운영하는데 이용되는 서버가 이용자의 컴퓨터
              브라우저에게 보내는 소량의 정보이며 이용자의 PC 하드디스크에
              저장되기도 합니다.
            </li>
            <li>
              이용자는 쿠키 설치에 대한 선택권을 가지고 있습니다. 웹브라우저에서
              옵션을 설정함으로써 모든 쿠키를 허용하거나, 쿠키가 저장될 때마다
              확인을 거치거나, 모든 쿠키의 저장을 거부할 수 있습니다.
            </li>
          </ol>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            제10조 (개인정보 보호책임자)
          </h2>
          <p className="mb-2">
            회사는 개인정보 처리에 관한 업무를 총괄해서 책임지고, 개인정보 처리와
            관련한 정보주체의 불만처리 및 피해구제 등을 위하여 아래와 같이
            개인정보 보호책임자를 지정하고 있습니다.
          </p>
          <div className="ml-4 mt-3 p-4 bg-gray-50 rounded-lg">
            <p className="font-semibold text-gray-900">개인정보 보호책임자</p>
            <ul className="mt-2 space-y-1 text-sm">
              <li>성명: 박상만</li>
              <li>직책: 대표</li>
              <li>연락처: samsungcu@naver.com</li>
              <li>전화: 1588-7928</li>
            </ul>
          </div>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            제11조 (개인정보 열람청구)
          </h2>
          <p>
            정보주체는 개인정보보호법 제35조에 따른 개인정보의 열람 청구를 아래의
            부서에 할 수 있습니다. 회사는 정보주체의 개인정보 열람청구가 신속하게
            처리되도록 노력하겠습니다.
          </p>
          <div className="ml-4 mt-3">
            <p className="font-semibold">개인정보 열람청구 접수·처리 부서</p>
            <ul className="mt-2 space-y-1 text-sm">
              <li>부서명: 고객지원팀</li>
              <li>이메일: samsungcu@naver.com</li>
            </ul>
          </div>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            제12조 (권익침해 구제방법)
          </h2>
          <p className="mb-2">
            정보주체는 아래의 기관에 대해 개인정보 침해에 대한 피해구제, 상담 등을
            문의하실 수 있습니다.
          </p>
          <ul className="list-disc list-inside ml-4 space-y-2">
            <li>
              개인정보 침해신고센터 (한국인터넷진흥원 운영)
              <br />
              <span className="text-sm ml-5">
                - 소관업무: 개인정보 침해사실 신고, 상담 신청
                <br />- 홈페이지: privacy.kisa.or.kr
                <br />- 전화: (국번없이) 118
              </span>
            </li>
            <li>
              개인정보 분쟁조정위원회
              <br />
              <span className="text-sm ml-5">
                - 소관업무: 개인정보 분쟁조정신청, 집단분쟁조정 (민사적 해결)
                <br />- 홈페이지: www.kopico.go.kr
                <br />- 전화: (국번없이) 1833-6972
              </span>
            </li>
            <li>
              대검찰청 사이버범죄수사단: 02-3480-3573 (www.spo.go.kr)
            </li>
            <li>경찰청 사이버안전국: 182 (cyberbureau.police.go.kr)</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            제13조 (개인정보처리방침의 변경)
          </h2>
          <p>
            이 개인정보처리방침은 시행일로부터 적용되며, 법령 및 방침에 따른
            변경내용의 추가, 삭제 및 정정이 있는 경우에는 변경사항의 시행 7일 전부터
            공지사항을 통하여 고지할 것입니다.
          </p>
        </section>

        <section className="mt-12 pt-8 border-t border-gray-300">
          <p className="text-sm text-gray-600">시행일: 2024년 1월 1일</p>
        </section>
      </div>
    </div>
  );
}
