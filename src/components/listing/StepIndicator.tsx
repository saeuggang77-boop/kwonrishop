"use client";

interface Step {
  number: number;
  label: string;
  icon?: string;
}

export default function StepIndicator({
  steps,
  currentStep,
}: {
  steps: Step[];
  currentStep: number;
}) {
  const current = steps.find((s) => s.number === currentStep);
  const totalSteps = steps.length;
  const currentStepLabel = current?.label || "";

  return (
    <div>
      {/* 진행률 */}
      <div className="mb-3">
        <p className="text-sm font-semibold text-gray-600 text-center mb-2">
          <span className="text-green-700">{currentStep}</span> / {totalSteps} 단계 — {currentStepLabel}
        </p>
        <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-green-500 to-green-600 rounded-full transition-all duration-500"
            style={{ width: `${(currentStep / totalSteps) * 100}%` }}
          />
        </div>
      </div>

      <div className="flex items-center gap-1 overflow-x-auto pb-2">
        {steps.map((step) => (
          <div key={step.number} className="flex items-center">
            <div className="flex flex-col items-center min-w-[3rem]">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                  step.number === currentStep
                    ? "bg-green-700 text-white"
                    : step.number < currentStep
                      ? "bg-green-100 text-green-700"
                      : "bg-gray-200 text-gray-400"
                }`}
              >
                {step.number < currentStep ? (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                ) : step.icon ? (
                  <span className="text-xs">{step.icon}</span>
                ) : (
                  step.number
                )}
              </div>
              <span
                className={`mt-1 whitespace-nowrap ${
                  step.number === currentStep
                    ? "block text-xs text-green-700 font-medium"
                    : step.number < currentStep
                      ? "hidden sm:block text-[10px] text-green-400"
                      : "hidden sm:block text-[10px] text-gray-400"
                }`}
              >
                {step.label}
              </span>
            </div>
            {step.number < steps.length && (
              <div
                className={`w-4 h-0.5 mt-[-12px] ${
                  step.number < currentStep ? "bg-green-300" : "bg-gray-200"
                }`}
              />
            )}
          </div>
        ))}
      </div>
      {current && (
        <div className="mt-3 flex items-center gap-2">
          {current.icon && <span className="text-lg">{current.icon}</span>}
          <span className="text-sm font-semibold text-gray-900">
            Step {current.number}/7 — {current.label}
          </span>
        </div>
      )}
    </div>
  );
}
