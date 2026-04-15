"use client";

import { useListingFormStore } from "@/store/listingForm";

interface Props {
  onNext: () => void;
  onPrev: () => void;
}

const MIN_LENGTH = 30;
const RECOMMENDED_LENGTH = 200;

export default function Step5Description({ onNext, onPrev }: Props) {
  const { data, updateData } = useListingFormStore();

  const charCount = data.description.length;
  const isValid = charCount >= MIN_LENGTH;

  // 연락처 패턴 감지 (전화번호, 카카오톡 ID, 이메일, SNS 등)
  const contactPattern = /(\d{2,4}[-.\s]?\d{3,4}[-.\s]?\d{4}|01[016789]\d{7,8}|카카오|카톡|kakao|open\.kakao|오픈채팅|텔레그램|telegram|라인|line(?![\w-])|whatsapp|왓츠앱|[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}|인스타|instagram|@\w{3,})/i;
  const hasContact = contactPattern.test(data.description);

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6">
      <h2 className="text-lg font-bold text-gray-900 mb-1">매물설명</h2>
      <p className="text-sm text-gray-500 mb-4">매물에 대해 자유롭게 설명해주세요</p>

      {/* 연락처 기재 금지 경고 */}
      <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
        <svg className="w-5 h-5 text-red-500 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
        </svg>
        <p className="text-sm text-red-600 font-medium">
          매물 설명에 연락처, 카카오톡 아이디를 기재하지 말아주세요.
        </p>
      </div>

      {hasContact && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-sm text-green-700 font-medium">
            연락처 또는 메신저 정보가 감지되었습니다. 삭제 후 등록해주세요.
          </p>
        </div>
      )}

      <textarea
        placeholder={`매물의 장점과 특징을 구체적으로 작성해주세요.\n\n예시:\n- 양도 사유: 개인 사정으로 양도합니다\n- 매장 특징: 역에서 도보 3분, 유동인구 많음\n- 인테리어: 2023년 신규 인테리어 완료\n- 단골 현황: 배달 + 홀 고객 꾸준\n- 기타: 레시피 및 운영 노하우 전수 가능\n\n※ 구체적인 설명이 있을수록 매수자의 관심도가 높아집니다.`}
        value={data.description}
        onChange={(e) => updateData({ description: e.target.value })}
        rows={12}
        className="w-full px-4 py-3 border border-gray-300 bg-white text-gray-900 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none resize-none"
      />

      {/* 글자 수 카운터 */}
      <div className="mt-2 flex justify-between items-center">
        {charCount > 0 && !isValid && (
          <p className="text-xs text-red-500 font-medium">
            최소 {MIN_LENGTH}자 이상 입력해주세요
          </p>
        )}
        {charCount > 0 && isValid && charCount < RECOMMENDED_LENGTH && (
          <p className="text-xs text-green-500 font-medium">
            {RECOMMENDED_LENGTH}자 이상 입력하면 조회수가 높아집니다
          </p>
        )}
        {charCount >= RECOMMENDED_LENGTH && (
          <p className="text-xs text-green-500 font-medium">
            작성 완료
          </p>
        )}
        {charCount === 0 && <span />}
        <p className={`text-xs ${isValid ? "text-gray-400" : charCount > 0 ? "text-red-500" : "text-gray-400"}`}>
          {charCount} / 최소 {MIN_LENGTH}자
        </p>
      </div>

      <div className="mt-8 flex justify-between">
        <button
          onClick={onPrev}
          className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
        >
          이전
        </button>
        <button
          onClick={onNext}
          disabled={!isValid || hasContact}
          className="px-8 py-3 bg-green-700 text-cream rounded-full font-medium hover:bg-green-800 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
        >
          다음
        </button>
      </div>
    </div>
  );
}
