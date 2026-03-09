"use client";

interface Step {
  number: number;
  label: string;
}

export default function StepIndicator({
  steps,
  currentStep,
}: {
  steps: Step[];
  currentStep: number;
}) {
  return (
    <div className="flex items-center gap-1 overflow-x-auto pb-2">
      {steps.map((step) => (
        <div key={step.number} className="flex items-center">
          <div className="flex flex-col items-center min-w-[3rem]">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                step.number === currentStep
                  ? "bg-blue-600 text-white"
                  : step.number < currentStep
                    ? "bg-blue-100 text-blue-600"
                    : "bg-gray-200 text-gray-400"
              }`}
            >
              {step.number < currentStep ? (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                step.number
              )}
            </div>
            <span
              className={`text-[10px] mt-1 whitespace-nowrap ${
                step.number === currentStep
                  ? "text-blue-600 font-medium"
                  : "text-gray-400"
              }`}
            >
              {step.label}
            </span>
          </div>
          {step.number < steps.length && (
            <div
              className={`w-4 h-0.5 mt-[-12px] ${
                step.number < currentStep ? "bg-blue-300" : "bg-gray-200"
              }`}
            />
          )}
        </div>
      ))}
    </div>
  );
}
