"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function ProfilePage() {
  const { data: session, update } = useSession();
  const router = useRouter();
  const [name, setName] = useState(session?.user?.name ?? "");
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState("");

  if (!session) {
    router.push("/login");
    return null;
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setMessage("");
    try {
      const res = await fetch("/api/auth/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      if (res.ok) {
        await update({ name });
        setMessage("저장되었습니다.");
      } else {
        setMessage("저장에 실패했습니다.");
      }
    } catch {
      setMessage("서버 오류가 발생했습니다.");
    } finally {
      setIsSaving(false);
    }
  };

  const roleLabels: Record<string, string> = { BUYER: "매수자", SELLER: "매도자", ADMIN: "관리자" };

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="text-2xl font-bold text-navy">내 프로필</h1>

      <form onSubmit={handleSave} className="mt-8 rounded-xl border border-gray-200 bg-white p-6 space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">이메일</label>
          <input value={session.user.email ?? ""} disabled className="input-field bg-gray-50 text-gray-500" />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">이름</label>
          <input value={name} onChange={(e) => setName(e.target.value)} className="input-field" />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">계정 유형</label>
          <input value={roleLabels[session.user.role] ?? session.user.role} disabled className="input-field bg-gray-50 text-gray-500" />
        </div>

        {message && <p className="text-sm text-mint">{message}</p>}

        <button
          type="submit"
          disabled={isSaving}
          className="rounded-lg bg-mint px-6 py-3 text-sm font-medium text-white hover:bg-mint-dark disabled:opacity-50"
        >
          {isSaving ? "저장 중..." : "저장"}
        </button>
      </form>
    </div>
  );
}
