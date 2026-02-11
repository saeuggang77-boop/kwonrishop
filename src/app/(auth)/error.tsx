"use client";

export default function AuthError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4">
      <div className="mx-auto w-full max-w-md rounded-xl border border-gray-200 bg-white p-10 text-center shadow-sm">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-navy/10">
          <span className="text-3xl text-navy">!</span>
        </div>
        <h2 className="mt-4 text-xl font-bold text-navy">인증 중 오류가 발생했습니다</h2>
        <p className="mt-2 text-sm text-gray-500">
          로그인 또는 인증 처리 중 문제가 발생했습니다. 다시 시도해주세요.
        </p>
        {error.digest && (
          <p className="mt-1 text-xs text-gray-400">오류 코드: {error.digest}</p>
        )}
        <button
          onClick={reset}
          className="mt-6 rounded-lg bg-navy px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-navy-light"
        >
          다시 시도
        </button>
      </div>
    </div>
  );
}
