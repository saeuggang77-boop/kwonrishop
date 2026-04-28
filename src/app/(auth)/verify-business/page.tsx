"use client";

import { useState, Suspense } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import PushPromptCard from "@/components/PushPromptCard";

function VerifyBusinessContent() {
  const { data: session, status, update } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const requestedRole = searchParams.get("role") as "SELLER" | "FRANCHISE" | "PARTNER" | null;
  const callbackUrl = searchParams.get("callbackUrl");

  const [form, setForm] = useState({
    businessNumber: "",
    representativeName: "",
    openDate: "",
    businessName: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [errorCode, setErrorCode] = useState<string>("");
  const [hasFailedOnce, setHasFailedOnce] = useState(false);
  const [success, setSuccess] = useState(false);
  const [matchedBrandId, setMatchedBrandId] = useState<string | null>(null);
  const [selectedRole, setSelectedRole] = useState<"SELLER" | "FRANCHISE" | "PARTNER">("SELLER");
  const [roleUpdating, setRoleUpdating] = useState(false);

  // requestedRole이 있으면 그대로, 없으면 사용자 선택 값 사용
  const effectiveRole = requestedRole || selectedRole;

  // 역할별 메시지
  const roleMessages: Record<string, string> = {
    SELLER: "사장님으로 매물을 등록하려면 사업자인증이 필요합니다",
    FRANCHISE: "프랜차이즈 본사 인증을 위해 사업자등록이 필요합니다",
    PARTNER: "협력업체 등록을 위해 사업자인증이 필요합니다",
  };

  const roleMessage = roleMessages[effectiveRole];

  // 역할 선택 시 pendingRole DB 업데이트
  async function handleRoleSelect(role: "SELLER" | "FRANCHISE" | "PARTNER") {
    setSelectedRole(role);
    setRoleUpdating(true);
    try {
      await fetch("/api/auth/select-role", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role }),
      });
    } catch {
      // 네트워크 에러 무시 — 인증 시 DB pendingRole 기반으로 재확인됨
    } finally {
      setRoleUpdating(false);
    }
  }

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-gray-400">로딩 중...</div>
      </div>
    );
  }

  if (!session) {
    router.push("/login?callbackUrl=/verify-business");
    return null;
  }

  function formatBusinessNumber(value: string) {
    const nums = value.replace(/\D/g, "").slice(0, 10);
    if (nums.length <= 3) return nums;
    if (nums.length <= 5) return `${nums.slice(0, 3)}-${nums.slice(3)}`;
    return `${nums.slice(0, 3)}-${nums.slice(3, 5)}-${nums.slice(5)}`;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setErrorCode("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/business-verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessNumber: form.businessNumber,
          representativeName: form.representativeName,
          openDate: form.openDate.replace(/-/g, ""),
          businessName: form.businessName || undefined,
          requestedRole: requestedRole || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error);
        setErrorCode(data.errorCode || "");
        setHasFailedOnce(true);
        return;
      }

      if (data.franchiseBrandId) {
        setMatchedBrandId(data.franchiseBrandId);
      }
      await update();
      // JWT 쿠키 갱신 대기
      await new Promise(resolve => setTimeout(resolve, 500));
      setSuccess(true);
    } catch {
      setError("네트워크 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  }

  // 역할별 성공 후 리다이렉트 URL
  const getSuccessRedirect = () => {
    // callbackUrl이 있고 안전한 경로면 우선 사용
    if (callbackUrl && callbackUrl.startsWith("/")) {
      return callbackUrl;
    }

    // 기본 역할별 리다이렉트
    if (effectiveRole === "SELLER") return "/sell";
    if (effectiveRole === "FRANCHISE" && matchedBrandId) return `/franchise/${matchedBrandId}`;
    if (effectiveRole === "FRANCHISE") return "/franchise";
    if (effectiveRole === "PARTNER") return "/partners/register";
    return "/sell";
  };

  if (success) {
    const successRedirect = getSuccessRedirect();
    const buttonText = effectiveRole === "FRANCHISE" ? "브랜드 페이지로" :
                       effectiveRole === "PARTNER" ? "협력업체 등록하기" :
                       "매물 등록하기";

    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-sm border border-gray-200 p-8 text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-green-100 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">인증 완료</h2>
          <p className="text-gray-500 mb-6">
            사업자인증이 완료되었습니다.<br />
            {effectiveRole === "FRANCHISE" && "이제 브랜드 페이지를 관리할 수 있습니다."}
            {effectiveRole === "PARTNER" && "이제 협력업체로 등록할 수 있습니다."}
            {effectiveRole === "SELLER" && "이제 매물을 등록할 수 있습니다."}
          </p>
          {/* 푸시 알림 + PWA 설치 유도 */}
          <div className="mb-4">
            <PushPromptCard accentColor="green" showGrantedText customTitle="고객 알림 받을 준비 되셨나요?" customDescription="문의·채팅이 오면 바로 알려드려요" />
          </div>

          <div className="space-y-2">
            <Link
              href={successRedirect}
              className="block w-full px-4 py-3 bg-green-700 text-cream rounded-full font-medium hover:bg-green-800 transition-colors"
            >
              {buttonText}
            </Link>
            <Link
              href="/"
              className="block w-full px-4 py-3 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors"
            >
              홈으로
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-8">
      <div className="w-full max-w-md mx-auto">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">사업자인증</h1>
          <p className="mt-1 text-sm text-gray-500">
            {roleMessage}
          </p>
        </div>

        {/* 역할 선택 UI (role param 없이 진입 시만 표시) */}
        {!requestedRole && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-5">
            <h3 className="text-sm font-semibold text-gray-800 mb-1">어떤 역할로 활동하시겠어요?</h3>
            <p className="text-xs text-gray-400 mb-4">인증 후 선택한 역할로 전환됩니다</p>
            <div className="space-y-3">
              {/* 사장님 */}
              <button
                type="button"
                disabled={roleUpdating}
                onClick={() => handleRoleSelect("SELLER")}
                className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
                  selectedRole === "SELLER"
                    ? "border-green-500 bg-green-50"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center shrink-0">
                    <svg className="w-5 h-5 text-green-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-gray-900">사장님 (매물 등록)</p>
                    <p className="text-xs text-gray-500 mt-0.5">상가/매장을 직접 등록하고 판매할 수 있습니다</p>
                  </div>
                  {selectedRole === "SELLER" && (
                    <svg className="w-5 h-5 text-green-500 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                    </svg>
                  )}
                </div>
              </button>

              {/* 프랜차이즈 */}
              <button
                type="button"
                disabled={roleUpdating}
                onClick={() => handleRoleSelect("FRANCHISE")}
                className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
                  selectedRole === "FRANCHISE"
                    ? "border-green-500 bg-green-50"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center shrink-0">
                    <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-gray-900">프랜차이즈 본사</p>
                    <p className="text-xs text-gray-500 mt-0.5">공정위 등록 브랜드를 관리할 수 있습니다</p>
                  </div>
                  {selectedRole === "FRANCHISE" && (
                    <svg className="w-5 h-5 text-green-500 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                    </svg>
                  )}
                </div>
              </button>

              {/* 협력업체 */}
              <button
                type="button"
                disabled={roleUpdating}
                onClick={() => handleRoleSelect("PARTNER")}
                className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
                  selectedRole === "PARTNER"
                    ? "border-green-500 bg-green-50"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center shrink-0">
                    <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-gray-900">협력업체</p>
                    <p className="text-xs text-gray-500 mt-0.5">인테리어, 설비, 컨설팅 등 서비스를 등록할 수 있습니다</p>
                  </div>
                  {selectedRole === "PARTNER" && (
                    <svg className="w-5 h-5 text-green-500 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                    </svg>
                  )}
                </div>
              </button>
            </div>
          </div>
        )}

        {/* 프랜차이즈 안내 (역할 선택 또는 URL param으로 FRANCHISE인 경우) */}
        {effectiveRole === "FRANCHISE" && (
          <div className="mb-5 p-3 bg-green-50 border border-green-200 rounded-xl text-xs text-green-700 space-y-1">
            <p className="font-medium">프랜차이즈 본사 인증 안내</p>
            <ul className="list-disc list-inside space-y-0.5">
              <li>공정거래위원회 정보공개서에 등록된 브랜드만 가입 가능합니다</li>
              <li>사업자번호로 브랜드가 자동 매칭됩니다</li>
              <li>인증 완료 후 브랜드 페이지 편집 권한이 부여됩니다</li>
            </ul>
          </div>
        )}

        {/* 개업일자 주의 안내 박스 */}
        <div className="mb-5 bg-amber-50 border border-amber-200 rounded-xl p-4">
          <div className="flex gap-3">
            <div className="shrink-0 mt-0.5">
              <svg className="w-5 h-5 text-amber-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd"/>
              </svg>
            </div>
            <div>
              <p className="text-sm font-semibold text-amber-800">인증 실패가 잦은 항목: 개업일자</p>
              <p className="text-xs text-amber-700 mt-1 leading-relaxed">
                사업자등록증에 적힌 <strong>&ldquo;개업연월일&rdquo;</strong>을 정확히 입력해주세요.<br/>
                <span className="text-amber-600">발급일, 신청일과 다른 경우가 많습니다.</span>
              </p>
            </div>
          </div>
        </div>

        {/* 인증 실패 안내 — errorCode에 따라 표시 분기 */}
        {error && hasFailedOnce && errorCode === "VERIFY_FAIL" && (
          <div className="mb-5 bg-red-50 border border-red-200 rounded-xl p-4">
            <div className="flex gap-3">
              <div className="shrink-0 mt-0.5">
                <svg className="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd"/>
                </svg>
              </div>
              <div>
                <p className="text-sm font-semibold text-red-800">인증에 실패했습니다</p>
                <p className="text-xs text-red-600 mt-1.5 leading-relaxed">다음 항목을 다시 확인해주세요:</p>
                <ul className="text-xs text-red-600 mt-1 space-y-1 list-none">
                  <li className="flex items-start gap-1.5">
                    <span className="text-red-400 mt-px">1.</span>
                    <span><strong>개업일자</strong> — 등록증의 &ldquo;개업연월일&rdquo;과 일치하나요?<br/>
                    <span className="text-red-400">(발급일, 신청일과 혼동하지 않았는지 확인)</span></span>
                  </li>
                  <li className="flex items-start gap-1.5">
                    <span className="text-red-400 mt-px">2.</span>
                    <span><strong>대표자명</strong> — 공동대표인 경우 등록증에 표기된 이름 입력</span>
                  </li>
                  <li className="flex items-start gap-1.5">
                    <span className="text-red-400 mt-px">3.</span>
                    <span><strong>상호명</strong> — 등록증에 적힌 상호와 동일하게 입력</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* 명확한 사유(중복/블랙리스트/이미 인증/시스템 오류 등) — 체크리스트 없이 메시지만 */}
        {error && hasFailedOnce && errorCode && errorCode !== "VERIFY_FAIL" && (
          <div className="mb-5 bg-red-50 border border-red-200 rounded-xl p-4">
            <div className="flex gap-3">
              <div className="shrink-0 mt-0.5">
                <svg className="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd"/>
                </svg>
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-red-800">{error}</p>
                {(errorCode === "DUPLICATE" || errorCode === "ALREADY_VERIFIED") && (
                  <p className="text-xs text-red-600 mt-1.5 leading-relaxed">
                    이미 등록된 사업자등록번호입니다. 본인 명의가 맞다면 <Link href="/contact" className="underline font-semibold">고객센터</Link>로 문의해주세요.
                  </p>
                )}
                {(errorCode === "BLACKLIST_BANNED" || errorCode === "BRAND_TAKEN") && (
                  <p className="text-xs text-red-600 mt-1.5 leading-relaxed">
                    <Link href="/contact" className="underline font-semibold">고객센터</Link>로 문의해주세요.
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 space-y-4"
        >
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              사업자등록번호 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              placeholder="000-00-00000"
              value={form.businessNumber}
              onChange={(e) =>
                setForm({
                  ...form,
                  businessNumber: formatBusinessNumber(e.target.value),
                })
              }
              className="w-full px-4 py-3 border border-gray-300 bg-white text-gray-900 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              대표자명 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              placeholder="홍길동"
              value={form.representativeName}
              onChange={(e) =>
                setForm({ ...form, representativeName: e.target.value })
              }
              className="w-full px-4 py-3 border border-gray-300 bg-white text-gray-900 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              개업일자 <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              value={form.openDate}
              onChange={(e) => setForm({ ...form, openDate: e.target.value })}
              className={`w-full px-4 py-3 rounded-lg outline-none ${
                hasFailedOnce && errorCode === "VERIFY_FAIL"
                  ? "border-2 border-red-400 bg-red-50 text-gray-900 focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  : "border border-gray-300 bg-white text-gray-900 focus:ring-2 focus:ring-green-500 focus:border-green-500"
              }`}
              required
            />
            {hasFailedOnce && errorCode === "VERIFY_FAIL" ? (
              <div className="mt-2 bg-red-50 border border-red-200 rounded-lg px-3 py-2.5">
                <div className="flex items-start gap-2">
                  <svg className="w-4 h-4 text-red-500 shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd"/>
                  </svg>
                  <div className="text-xs leading-relaxed">
                    <p className="text-red-700 font-semibold">개업일자를 다시 확인하세요!</p>
                    <p className="text-red-600 mt-0.5">
                      사업자등록증의 <strong>&ldquo;개업연월일&rdquo;</strong>을 입력해야 합니다.<br/>
                      하단의 &ldquo;발급일&rdquo;이나 신청일과 <strong>다른 경우가 많습니다.</strong>
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="mt-2 bg-green-50 border border-green-100 rounded-lg px-3 py-2.5">
                <div className="flex items-start gap-2">
                  <svg className="w-4 h-4 text-green-500 shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a.75.75 0 000 1.5h.253a.25.25 0 01.244.304l-.459 2.066A1.75 1.75 0 0010.747 15H11a.75.75 0 000-1.5h-.253a.25.25 0 01-.244-.304l.459-2.066A1.75 1.75 0 009.253 9H9z" clipRule="evenodd"/>
                  </svg>
                  <div className="text-xs leading-relaxed">
                    <p className="text-green-800 font-medium">사업자등록증 확인 방법</p>
                    <p className="text-green-700 mt-0.5">
                      등록증 중간의 <strong>&ldquo;개업연월일&rdquo;</strong> 항목을 확인하세요.<br/>
                      하단의 &ldquo;발급일&rdquo;이나 신청일과 <strong className="text-red-500">다를 수 있습니다.</strong>
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              상호명 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              placeholder="상호명을 입력하세요"
              value={form.businessName}
              onChange={(e) =>
                setForm({ ...form, businessName: e.target.value })
              }
              className="w-full px-4 py-3 border border-gray-300 bg-white text-gray-900 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-green-700 text-cream rounded-full font-medium hover:bg-green-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? "인증 중..." : hasFailedOnce ? "다시 인증하기" : "사업자 인증하기"}
          </button>

          <p className="text-xs text-gray-400 text-center">
            국세청 사업자등록 진위확인 API를 통해 인증됩니다
          </p>

        </form>
      </div>
    </div>
  );
}

export default function VerifyBusinessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-pulse text-gray-400">로딩 중...</div>
      </div>
    }>
      <VerifyBusinessContent />
    </Suspense>
  );
}
