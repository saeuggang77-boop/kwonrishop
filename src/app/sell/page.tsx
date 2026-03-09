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
  { number: 1, label: "위치정보" },
  { number: 2, label: "업종/금액" },
  { number: 3, label: "기본정보" },
  { number: 4, label: "추가정보" },
  { number: 5, label: "매물설명" },
  { number: 6, label: "사진" },
  { number: 7, label: "확인" },
];

export default function SellPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { currentStep, setStep } = useListingFormStore();
  const [checkingVerification, setCheckingVerification] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login?callbackUrl=/sell");
      return;
    }

    if (status === "authenticated") {
      // 사업자인증 여부 확인
      fetch("/api/auth/check-verification")
        .then((res) => res.json())
        .then((data) => {
          if (!data.verified) {
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
