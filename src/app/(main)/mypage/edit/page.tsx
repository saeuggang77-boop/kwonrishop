"use client";

import { useEffect, useState, useRef } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { formatPhoneInput } from "@/lib/utils";

export default function ProfileEditPage() {
  const { data: session, status, update } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    image: "" as string | null,
  });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [deleteAgreed, setDeleteAgreed] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [hasPassword, setHasPassword] = useState(false);
  const [passwordData, setPasswordData] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [passwordMessage, setPasswordMessage] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login?callbackUrl=/mypage/edit");
      return;
    }
    if (status === "authenticated") {
      fetch("/api/mypage")
        .then((r) => r.json())
        .then((data) => {
          setFormData({
            name: data.user.name || "",
            phone: formatPhoneInput(data.user.phone || ""),
            image: data.user.image || null,
          });
          setHasPassword(data.user.hasPassword || false);
          setLoading(false);
        })
        .catch(() => setLoading(false));
    }
  }, [status, router]);

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setMessage("파일 크기는 5MB 이하여야 합니다.");
      return;
    }
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (res.ok && data.url) {
        setFormData(prev => ({ ...prev, image: data.url }));
      } else {
        setMessage("이미지 업로드에 실패했습니다.");
      }
    } catch {
      setMessage("이미지 업로드 중 오류가 발생했습니다.");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function handlePasswordChange(e: React.FormEvent) {
    e.preventDefault();
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordMessage("새 비밀번호가 일치하지 않습니다.");
      return;
    }
    setChangingPassword(true);
    setPasswordMessage("");
    try {
      const res = await fetch("/api/mypage/password", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setPasswordMessage("비밀번호가 변경되었습니다.");
        setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" });
      } else {
        setPasswordMessage(data.error || "비밀번호 변경에 실패했습니다.");
      }
    } catch {
      setPasswordMessage("오류가 발생했습니다.");
    } finally {
      setChangingPassword(false);
    }
  }

  async function handleDeleteAccount() {
    if (deleteConfirmText !== "회원탈퇴" || !deleteAgreed) return;
    setDeleting(true);
    setDeleteError("");
    try {
      const res = await fetch("/api/mypage/account", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirmation: "회원탈퇴" }),
      });
      const data = await res.json();
      if (res.ok) {
        await signOut({ callbackUrl: "/?withdrawn=1" });
      } else {
        setDeleteError(data.error || "탈퇴 처리에 실패했습니다.");
      }
    } catch {
      setDeleteError("오류가 발생했습니다. 다시 시도해주세요.");
    } finally {
      setDeleting(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage("");

    try {
      const res = await fetch("/api/mypage/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (res.ok) {
        // JWT 토큰 갱신 트리거 → Header 등 세션 기반 UI가 즉시 새 이름/이미지 반영
        await update();
        setMessage("프로필이 수정되었습니다.");
        setTimeout(() => {
          router.push("/mypage");
          router.refresh();
        }, 1000);
      } else {
        setMessage(data.error || "저장에 실패했습니다.");
      }
    } catch (err) {
      setMessage("오류가 발생했습니다.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="max-w-md mx-auto px-4 py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-10 bg-gray-200 rounded" />
          <div className="h-10 bg-gray-200 rounded" />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">프로필 수정</h1>

      <form onSubmit={handleSubmit} className="bg-cream rounded-3xl border border-line p-5">
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-3">프로필 사진</label>
          <div className="flex items-center gap-4">
            <div className="relative">
              {formData.image ? (
                <Image src={formData.image} alt="프로필" width={80} height={80} className="w-20 h-20 rounded-full object-cover" />
              ) : (
                <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center text-green-700 text-2xl font-bold">
                  {formData.name?.[0] || "U"}
                </div>
              )}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="absolute -bottom-1 -right-1 w-9 h-9 bg-green-700 text-white rounded-full flex items-center justify-center shadow-lg hover:bg-green-800 disabled:opacity-50"
              >
                <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <circle cx="12" cy="13" r="3" />
                </svg>
              </button>
            </div>
            <div className="text-sm text-gray-500">
              <p>JPG, PNG 파일 (최대 5MB)</p>
              {formData.image && (
                <button type="button" onClick={() => setFormData({ ...formData, image: null })} className="text-red-400 text-xs mt-1 hover:text-red-500">
                  사진 삭제
                </button>
              )}
              {uploading && <p className="text-green-500 text-xs mt-1">업로드 중...</p>}
            </div>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={handleImageUpload}
          />
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            이름
          </label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            autoComplete="name"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 bg-white text-gray-900"
            required
          />
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            휴대폰 번호
          </label>
          <input
            type="tel"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: formatPhoneInput(e.target.value) })}
            placeholder="010-1234-5678"
            autoComplete="tel"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 bg-white text-gray-900"
          />
        </div>

        {message && (
          <div className={`mb-4 p-3 rounded-lg text-sm ${
            message.includes("성공") || message.includes("수정되었습니다")
              ? "bg-green-50 text-green-700"
              : "bg-red-50 text-red-700"
          }`}>
            {message}
          </div>
        )}

        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => router.push("/mypage")}
            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
          >
            취소
          </button>
          <button
            type="submit"
            disabled={saving}
            className="flex-1 px-4 py-2 bg-green-700 text-cream rounded-full hover:bg-green-800 font-medium disabled:opacity-50"
          >
            {saving ? "저장 중..." : "저장"}
          </button>
        </div>
      </form>

      {/* 비밀번호 변경 (이메일 가입 사용자만) */}
      {hasPassword && (
        <form onSubmit={handlePasswordChange} className="mt-6 bg-cream rounded-3xl border border-line p-5">
          <h2 className="text-sm font-semibold text-gray-900 mb-4">비밀번호 변경</h2>

          <div className="mb-3">
            <label className="block text-sm text-gray-600 mb-1">현재 비밀번호</label>
            <input
              type="password"
              value={passwordData.currentPassword}
              onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
              autoComplete="current-password"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-500"
              required
            />
          </div>

          <div className="mb-3">
            <label className="block text-sm text-gray-600 mb-1">새 비밀번호</label>
            <input
              type="password"
              value={passwordData.newPassword}
              onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
              autoComplete="new-password"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-500"
              required
              minLength={8}
            />
            <p className="text-xs text-gray-400 mt-1">8자 이상, 대/소문자, 숫자, 특수문자 포함</p>
          </div>

          <div className="mb-4">
            <label className="block text-sm text-gray-600 mb-1">새 비밀번호 확인</label>
            <input
              type="password"
              value={passwordData.confirmPassword}
              onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
              autoComplete="new-password"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-500"
              required
            />
          </div>

          {passwordMessage && (
            <div className={`mb-4 p-3 rounded-lg text-sm ${
              passwordMessage.includes("변경되었습니다")
                ? "bg-green-50 text-green-700"
                : "bg-red-50 text-red-700"
            }`}>
              {passwordMessage}
            </div>
          )}

          <button
            type="submit"
            disabled={changingPassword}
            className="w-full px-4 py-2 bg-green-700 text-cream rounded-full hover:bg-green-800 font-medium text-sm disabled:opacity-50"
          >
            {changingPassword ? "변경 중..." : "비밀번호 변경"}
          </button>
        </form>
      )}

      {/* 회원탈퇴 */}
      <div className="mt-8 bg-white rounded-xl border border-red-200 p-5">
        <h2 className="text-sm font-semibold text-red-600 mb-2">회원탈퇴</h2>
        <p className="text-xs text-gray-500 mb-3">
          탈퇴 시 등록한 매물, 집기, 협력업체 정보가 비활성화되며 개인정보가 삭제됩니다. 이 작업은 되돌릴 수 없습니다.
        </p>
        <button
          type="button"
          onClick={() => {
            setShowDeleteModal(true);
            setDeleteConfirmText("");
            setDeleteAgreed(false);
            setDeleteError("");
          }}
          className="text-sm text-red-500 hover:text-red-600 font-medium"
        >
          회원탈퇴 하기
        </button>
      </div>

      {/* 회원탈퇴 확인 모달 */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-xl">
            <h3 className="text-lg font-bold text-gray-900 mb-1">회원탈퇴</h3>
            <p className="text-sm text-gray-500 mb-4">
              정말로 탈퇴하시겠습니까? 아래 내용을 확인해주세요.
            </p>

            <div className="bg-red-50 rounded-lg p-3 mb-4 text-xs text-red-700 space-y-1">
              <p>- 등록한 매물/집기/협력업체가 비활성화됩니다</p>
              <p>- 채팅 내역, 즐겨찾기, 알림이 삭제됩니다</p>
              <p>- 개인정보(이름, 연락처, 사진)가 삭제됩니다</p>
              <p>- 진행 중인 거래가 있으면 탈퇴할 수 없습니다</p>
            </div>

            <label className="flex items-start gap-2 mb-4 cursor-pointer">
              <input
                type="checkbox"
                checked={deleteAgreed}
                onChange={(e) => setDeleteAgreed(e.target.checked)}
                className="mt-0.5 rounded border-gray-300 text-red-600 focus:ring-red-500"
              />
              <span className="text-sm text-gray-700">
                위 내용을 확인했으며, 탈퇴에 동의합니다.
              </span>
            </label>

            <div className="mb-4">
              <label className="block text-sm text-gray-600 mb-1">
                확인을 위해 <strong className="text-red-600">회원탈퇴</strong>를 입력해주세요
              </label>
              <input
                type="text"
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                placeholder="회원탈퇴"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>

            {deleteError && (
              <div className="mb-4 p-3 bg-red-50 rounded-lg text-sm text-red-700">
                {deleteError}
              </div>
            )}

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                disabled={deleting}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium text-sm"
              >
                취소
              </button>
              <button
                type="button"
                onClick={handleDeleteAccount}
                disabled={deleting || deleteConfirmText !== "회원탈퇴" || !deleteAgreed}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {deleting ? "처리 중..." : "탈퇴하기"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
