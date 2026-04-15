"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useListingFormStore } from "@/store/listingForm";
import StepIndicator from "@/components/listing/StepIndicator";
import Step1Location from "@/components/listing/steps/Step1Location";
import Step2Category from "@/components/listing/steps/Step2Category";
import Step3BasicInfo from "@/components/listing/steps/Step3BasicInfo";
import Step4Additional from "@/components/listing/steps/Step4Additional";
import Step5Description from "@/components/listing/steps/Step5Description";
import Step6Photos from "@/components/listing/steps/Step6Photos";
import Step7Confirm from "@/components/listing/steps/Step7Confirm";

const STEPS = [
  { number: 1, label: "위치정보", icon: "\uD83D\uDCCD" },
  { number: 2, label: "업종/금액", icon: "\uD83C\uDFEA" },
  { number: 3, label: "기본정보", icon: "\uD83D\uDCCB" },
  { number: 4, label: "추가정보", icon: "\uD83D\uDCB0" },
  { number: 5, label: "매물설명", icon: "\uD83D\uDCDD" },
  { number: 6, label: "사진", icon: "\uD83D\uDCF7" },
  { number: 7, label: "확인", icon: "✅" },
];

function FairTradeAgreementModal({ onAgree }: { onAgree: () => void }) {
  const [checked, setChecked] = useState(false);

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6 max-w-lg mx-auto">
      <div className="text-center mb-6">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-green-700" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-gray-900">공정거래를 위한 약속에<br />동의해주세요!</h2>
      </div>

      <div className="space-y-4 mb-6">
        <div className="flex gap-3 p-4 bg-gray-50 rounded-xl">
          <div className="w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center text-sm font-bold shrink-0 mt-0.5">1</div>
          <p className="text-sm text-gray-700">
            공정한 거래문화 조성을 위해 <strong>정직하고 구체적인 내용</strong>을 입력해주시기 바랍니다.
          </p>
        </div>
        <div className="flex gap-3 p-4 bg-gray-50 rounded-xl">
          <div className="w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center text-sm font-bold shrink-0 mt-0.5">2</div>
          <p className="text-sm text-gray-700">
            <strong>허위정보</strong>로 시간낭비하는 상황 발생 시 해당 매물은 <strong className="text-red-500">비공개, 영구활동정지</strong> 처리됩니다.
          </p>
        </div>
        <div className="flex gap-3 p-4 bg-gray-50 rounded-xl">
          <div className="w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center text-sm font-bold shrink-0 mt-0.5">3</div>
          <p className="text-sm text-gray-700">
            매물 및 매출정보가 미흡시 관리자는 <strong>수정안내 또는 비공개, 삭제</strong> 등의 조치를 취할 수 있습니다.
          </p>
        </div>
        <div className="flex gap-3 p-4 bg-red-50 rounded-xl border border-red-200">
          <div className="w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-sm font-bold shrink-0 mt-0.5">4</div>
          <p className="text-sm text-gray-700">
            본 플랫폼은 <strong>사장님 직거래 전용</strong>입니다. 컨설팅업체·부동산 중개업소 등이 직거래를 가장하여 매물을 등록하는 행위는 「표시·광고의 공정화에 관한 법률」상 <strong className="text-red-500">기만적 광고</strong>에 해당하며, 적발 시 <strong className="text-red-500">즉시 삭제, 영구 이용정지 및 관계기관 신고</strong> 조치됩니다.
          </p>
        </div>
      </div>

      <label className="flex items-center gap-3 p-4 border border-gray-200 rounded-xl cursor-pointer hover:bg-gray-50 transition-colors mb-4">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => setChecked(e.target.checked)}
          className="w-5 h-5 rounded border-gray-300 text-green-700 focus:ring-green-500"
        />
        <span className="text-sm font-medium text-gray-900">네, 위 내용에 동의합니다</span>
      </label>

      <button
        onClick={onAgree}
        disabled={!checked}
        className="w-full py-3.5 bg-green-700 text-white rounded-xl font-semibold hover:bg-green-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors text-sm"
      >
        매물등록 시작하기
      </button>
    </div>
  );
}

export default function SellPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { currentStep, setStep, data, updateData } = useListingFormStore();
  const [checkingVerification, setCheckingVerification] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login?callbackUrl=/sell");
      return;
    }

    if (status === "authenticated") {
      fetch("/api/auth/check-verification")
        .then((res) => res.json())
        .then((d) => {
          if (!d.verified) {
            router.push("/verify-business?role=SELLER");
          } else {
            setCheckingVerification(false);
          }
        })
        .catch(() => setCheckingVerification(false));
    }
  }, [status, router]);

  // 페이지 이탈 경고 (Step1 이후부터)
  useEffect(() => {
    if (currentStep < 1 || !data.agreedToTerms) return;

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = ""; // Chrome requires returnValue to be set
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [currentStep, data.agreedToTerms]);

  if (status === "loading" || checkingVerification) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-pulse text-gray-400">로딩 중...</div>
      </div>
    );
  }

  if (!session) return null;

  // 약관 미동의 시 약관동의 모달 표시
  if (!data.agreedToTerms) {
    return (
      <div className="py-8">
        <FairTradeAgreementModal
          onAgree={() => {
            updateData({ agreedToTerms: true });
            setStep(1);
          }}
        />
      </div>
    );
  }

  function handleNext() {
    if (currentStep < 7) setStep(currentStep + 1);
  }

  function handlePrev() {
    if (currentStep > 1) setStep(currentStep - 1);
  }

  const stepComponents: Record<number, React.ReactNode> = {
    1: <Step1Location onNext={handleNext} />,
    2: <Step2Category onNext={handleNext} onPrev={handlePrev} />,
    3: <Step3BasicInfo onNext={handleNext} onPrev={handlePrev} />,
    4: <Step4Additional onNext={handleNext} onPrev={handlePrev} />,
    5: <Step5Description onNext={handleNext} onPrev={handlePrev} />,
    6: <Step6Photos onNext={handleNext} onPrev={handlePrev} />,
    7: <Step7Confirm onPrev={handlePrev} />,
  };

  return (
    <>
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900 mb-4">매물등록</h1>
        <StepIndicator steps={STEPS} currentStep={currentStep} />
      </div>
      {stepComponents[currentStep]}
    </>
  );
}
