import Link from "next/link";
import { Mail } from "lucide-react";

export const metadata = { title: "이메일 인증" };

export default function VerifyPage() {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-8 text-center shadow-sm">
      <Mail className="mx-auto h-12 w-12 text-mint" />
      <h1 className="mt-4 font-heading text-2xl font-bold text-navy">이메일 인증</h1>
      <p className="mt-2 text-sm text-gray-500">
        가입 시 입력한 이메일로 인증 링크를 발송했습니다.
        <br />
        이메일을 확인하여 인증을 완료해주세요.
      </p>
      <div className="mt-6 space-y-3">
        <Link
          href="/login"
          className="block rounded-lg bg-mint px-6 py-3 text-sm font-medium text-white hover:bg-mint-dark"
        >
          로그인 페이지로
        </Link>
        <p className="text-xs text-gray-400">
          이메일이 도착하지 않았다면 스팸 폴더를 확인해주세요.
        </p>
      </div>
    </div>
  );
}
