"use client";

export default function Error({
  error: _error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-4">
      <h1 className="text-4xl font-bold text-navy">오류가 발생했습니다</h1>
      <p className="mt-4 text-sm text-gray-500">
        잠시 후 다시 시도해주세요. 문제가 지속되면 고객센터로 문의해주세요.
      </p>
      <button
        onClick={reset}
        className="mt-8 rounded-lg bg-navy px-6 py-3 text-sm font-medium text-white hover:bg-navy-dark"
      >
        다시 시도
      </button>
    </div>
  );
}
