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

  return (
    <div>
      <div className="flex items-center gap-1 overflow-x-auto pb-2">
        {steps.map((step) => (
          <div key={step.number} className="flex items-center">
            <div className="flex flex-col items-center min-w-[3rem]">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                  step.number === currentStep
                    ? "bg-blue-600 text-white"
                    : step.number < currentStep
                      ? "bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400"
                      : "bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500"
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
                className={`text-[10px] mt-1 whitespace-nowrap ${
                  step.number === currentStep
                    ? "text-blue-600 dark:text-blue-400 font-medium"
                    : step.number < currentStep
                      ? "text-blue-400 dark:text-blue-500"
                      : "text-gray-400 dark:text-gray-500"
                }`}
              >
                {step.label}
              </span>
            </div>
            {step.number < steps.length && (
              <div
                className={`w-4 h-0.5 mt-[-12px] ${
                  step.number < currentStep ? "bg-blue-300 dark:bg-blue-600" : "bg-gray-200 dark:bg-gray-700"
                }`}
              />
            )}
          </div>
        ))}
      </div>
      {current && (
        <div className="mt-3 flex items-center gap-2">
          {current.icon && <span className="text-lg">{current.icon}</span>}
          <span className="text-sm font-semibold text-gray-900 dark:text-white">
            Step {current.number}/7 — {current.label}
          </span>
        </div>
      )}
    </div>
  );
}
