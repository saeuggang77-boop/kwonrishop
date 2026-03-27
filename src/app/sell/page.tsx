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
  { number: 7, label: "연동", icon: "\uD83D\uDCCA" },
];

function FairTradeAgreementModal({ onAgree }: { onAgree: () => void }) {
  const [checked, setChecked] = useState(false);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 max-w-lg mx-auto">
      <div className="text-center mb-6">
        <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">공정거래를 위한 약속에<br />동의해주세요!</h2>
      </div>

      <div className="space-y-4 mb-6">
        <div className="flex gap-3 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
          <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold shrink-0 mt-0.5">1</div>
          <p className="text-sm text-gray-700 dark:text-gray-300">
            공정한 거래문화 조성을 위해 <strong>정직하고 구체적인 내용</strong>을 입력해주시기 바랍니다.
          </p>
        </div>
        <div className="flex gap-3 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
          <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold shrink-0 mt-0.5">2</div>
          <p className="text-sm text-gray-700 dark:text-gray-300">
            <strong>허위정보</strong>로 시간낭비하는 상황 발생 시 해당 매물은 <strong className="text-red-500">비공개, 영구활동정지</strong> 처리됩니다.
          </p>
        </div>
        <div className="flex gap-3 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
          <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold shrink-0 mt-0.5">3</div>
          <p className="text-sm text-gray-700 dark:text-gray-300">
            매물 및 매출정보가 미흡시 관리자는 <strong>수정안내 또는 비공개, 삭제</strong> 등의 조치를 취할 수 있습니다.
          </p>
        </div>
      </div>

      <label className="flex items-center gap-3 p-4 border border-gray-200 dark:border-gray-600 rounded-xl cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors mb-4">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => setChecked(e.target.checked)}
          className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
        />
        <span className="text-sm font-medium text-gray-900 dark:text-white">네, 위 내용에 동의합니다</span>
      </label>

      <button
        onClick={onAgree}
        disabled={!checked}
        className="w-full py-3.5 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 disabled:bg-gray-300 dark:disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors text-sm"
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
            router.push("/verify-business");
          } else {
            setCheckingVerification(false);
          }
        })
        .catch(() => setCheckingVerification(false));
    }
  }, [status, router]);

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
        <h1 className="text-xl font-bold text-gray-900 dark:text-white mb-4">매물등록</h1>
        <StepIndicator steps={STEPS} currentStep={currentStep} />
      </div>
      {stepComponents[currentStep]}
    </>
  );
}
