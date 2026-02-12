"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  User, Mail, Phone, Building, CreditCard, Shield,
  Calendar, FileText, MessageSquare, Calculator, ChevronRight,
  CheckCircle, Crown,
} from "lucide-react";

interface ProfileData {
  id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  role: string;
  image: string | null;
  emailVerified: string | null;
  businessName: string | null;
  businessNumber: string | null;
  subscriptionTier: string;
  createdAt: string;
  _count: {
    listings: number;
    inquiriesSent: number;
    reportPurchases: number;
    simulations: number;
  };
}

const ROLE_LABELS: Record<string, string> = {
  BUYER: "매수자",
  SELLER: "매도자",
  ADMIN: "관리자",
};

const TIER_CONFIG: Record<string, { label: string; color: string; bg: string; border: string }> = {
  FREE: { label: "FREE", color: "text-gray-600", bg: "bg-gray-100", border: "border-gray-200" },
  PRO: { label: "PRO", color: "text-mint", bg: "bg-mint/10", border: "border-mint/30" },
  EXPERT: { label: "EXPERT", color: "text-navy", bg: "bg-navy/10", border: "border-navy/30" },
};

export default function ProfilePage() {
  const { data: session, status, update } = useSession();
  const router = useRouter();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);

  // Form state
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [businessNumber, setBusinessNumber] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
  }, [status, router]);

  const fetchProfile = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/profile");
      const json = await res.json();
      if (json.data) {
        setProfile(json.data);
        setName(json.data.name ?? "");
        setPhone(json.data.phone ?? "");
        setBusinessName(json.data.businessName ?? "");
        setBusinessNumber(json.data.businessNumber ?? "");
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (status === "authenticated") fetchProfile();
  }, [status, fetchProfile]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setMessage(null);
    try {
      const res = await fetch("/api/auth/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, phone, businessName, businessNumber }),
      });
      if (res.ok) {
        await update({ name });
        setMessage({ type: "success", text: "프로필이 저장되었습니다." });
        fetchProfile();
      } else {
        setMessage({ type: "error", text: "저장에 실패했습니다." });
      }
    } catch {
      setMessage({ type: "error", text: "서버 오류가 발생했습니다." });
    } finally {
      setIsSaving(false);
    }
  };

  if (loading || !session) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-8">
        <div className="h-8 w-40 animate-pulse rounded bg-gray-200" />
        <div className="mt-6 space-y-6">
          <div className="h-48 animate-pulse rounded-xl bg-gray-100" />
          <div className="h-64 animate-pulse rounded-xl bg-gray-100" />
        </div>
      </div>
    );
  }

  const tierConfig = TIER_CONFIG[profile?.subscriptionTier ?? "FREE"] ?? TIER_CONFIG.FREE;
  const joinDate = profile?.createdAt
    ? new Date(profile.createdAt).toLocaleDateString("ko-KR", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "";

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="text-2xl font-bold text-navy">내 프로필</h1>

      {/* Profile Header Card */}
      <div className="mt-6 overflow-hidden rounded-xl border border-gray-200 bg-white">
        <div className="bg-gradient-to-r from-mint/10 to-navy/10 px-6 py-6">
          <div className="flex items-center gap-4">
            {/* Avatar */}
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-navy/20 text-2xl font-bold text-navy">
              {profile?.name?.charAt(0) ?? session.user.email?.charAt(0) ?? "?"}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-navy">
                  {profile?.name ?? "이름 미설정"}
                </h2>
                <span className={`rounded-md border px-2 py-0.5 text-xs font-bold ${tierConfig.bg} ${tierConfig.color} ${tierConfig.border}`}>
                  {tierConfig.label}
                </span>
                <span className="rounded-md bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">
                  {ROLE_LABELS[profile?.role ?? "BUYER"]}
                </span>
              </div>
              <p className="mt-1 text-sm text-gray-500">{profile?.email}</p>
              <div className="mt-1 flex items-center gap-3 text-xs text-gray-400">
                <span className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {joinDate} 가입
                </span>
                {profile?.emailVerified && (
                  <span className="flex items-center gap-1 text-green-600">
                    <CheckCircle className="h-3 w-3" />
                    이메일 인증됨
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Activity Stats */}
        {profile?._count && (
          <div className="grid grid-cols-4 divide-x divide-gray-100 border-t border-gray-100">
            <StatItem
              icon={<FileText className="h-4 w-4 text-mint" />}
              label="등록 매물"
              value={profile._count.listings}
            />
            <StatItem
              icon={<MessageSquare className="h-4 w-4 text-blue-500" />}
              label="문의"
              value={profile._count.inquiriesSent}
            />
            <StatItem
              icon={<Shield className="h-4 w-4 text-orange-500" />}
              label="리포트"
              value={profile._count.reportPurchases}
            />
            <StatItem
              icon={<Calculator className="h-4 w-4 text-navy" />}
              label="시뮬레이션"
              value={profile._count.simulations}
            />
          </div>
        )}
      </div>

      {/* Subscription CTA */}
      {(profile?.subscriptionTier === "FREE") && (
        <Link
          href="/pricing"
          className="mt-4 flex items-center justify-between rounded-xl border border-accent/30 bg-accent/5 px-5 py-4 transition-colors hover:bg-accent/10"
        >
          <div className="flex items-center gap-3">
            <Crown className="h-5 w-5 text-accent" />
            <div>
              <p className="text-sm font-semibold text-navy">PRO 플랜으로 업그레이드</p>
              <p className="text-xs text-gray-500">시세 비교, 시뮬레이터, 리포트 무료 혜택</p>
            </div>
          </div>
          <ChevronRight className="h-5 w-5 text-accent" />
        </Link>
      )}

      {/* Profile Edit Form */}
      <form onSubmit={handleSave} className="mt-6 space-y-6">
        {/* Basic Info */}
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
          <div className="border-b border-gray-100 px-6 py-4">
            <h3 className="flex items-center gap-2 text-base font-semibold text-navy">
              <User className="h-4 w-4" />
              기본 정보
            </h3>
          </div>
          <div className="space-y-4 px-6 py-5">
            <FormField label="이메일" icon={<Mail className="h-4 w-4" />} disabled>
              <input
                value={profile?.email ?? ""}
                disabled
                className="input-field bg-gray-50 text-gray-500"
              />
            </FormField>
            <FormField label="이름" icon={<User className="h-4 w-4" />}>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="이름을 입력하세요"
                className="input-field"
              />
            </FormField>
            <FormField label="전화번호" icon={<Phone className="h-4 w-4" />}>
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="010-0000-0000"
                className="input-field"
              />
            </FormField>
          </div>
        </div>

        {/* Business Info (Seller only or anyone who wants) */}
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
          <div className="border-b border-gray-100 px-6 py-4">
            <h3 className="flex items-center gap-2 text-base font-semibold text-navy">
              <Building className="h-4 w-4" />
              사업자 정보
            </h3>
            <p className="mt-0.5 text-xs text-gray-400">매도자인 경우 사업자 정보를 입력하면 신뢰도가 높아집니다</p>
          </div>
          <div className="space-y-4 px-6 py-5">
            <FormField label="상호명" icon={<Building className="h-4 w-4" />}>
              <input
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                placeholder="예: 권리샵"
                className="input-field"
              />
            </FormField>
            <FormField label="사업자등록번호" icon={<CreditCard className="h-4 w-4" />}>
              <input
                value={businessNumber}
                onChange={(e) => setBusinessNumber(e.target.value)}
                placeholder="000-00-00000"
                className="input-field"
              />
            </FormField>
          </div>
        </div>

        {/* Account Info (read-only) */}
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
          <div className="border-b border-gray-100 px-6 py-4">
            <h3 className="flex items-center gap-2 text-base font-semibold text-navy">
              <Shield className="h-4 w-4" />
              계정 정보
            </h3>
          </div>
          <div className="divide-y divide-gray-50 px-6 py-2">
            <InfoRow label="계정 유형" value={ROLE_LABELS[profile?.role ?? "BUYER"] ?? profile?.role ?? ""} />
            <InfoRow label="구독 플랜" value={tierConfig.label} badge={tierConfig} />
            <InfoRow label="가입일" value={joinDate} />
            <InfoRow
              label="이메일 인증"
              value={profile?.emailVerified ? "인증됨" : "미인증"}
              verified={!!profile?.emailVerified}
            />
          </div>
        </div>

        {/* Save Button */}
        {message && (
          <div
            className={`rounded-lg px-4 py-3 text-sm ${
              message.type === "success"
                ? "bg-green-50 text-green-700"
                : "bg-red-50 text-red-700"
            }`}
          >
            {message.text}
          </div>
        )}

        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={isSaving}
            className="rounded-lg bg-accent px-8 py-3 text-sm font-medium text-white transition-colors hover:bg-accent-dark disabled:opacity-50"
          >
            {isSaving ? "저장 중..." : "프로필 저장"}
          </button>
          <Link
            href="/my/subscription"
            className="rounded-lg border border-gray-300 px-6 py-3 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
          >
            구독 관리
          </Link>
        </div>
      </form>

      {/* Quick Links */}
      <div className="mt-8 overflow-hidden rounded-xl border border-gray-200 bg-white">
        <div className="border-b border-gray-100 px-6 py-4">
          <h3 className="text-base font-semibold text-navy">바로가기</h3>
        </div>
        <div className="divide-y divide-gray-50">
          <QuickLink href="/my/reports" label="내 리포트" description="구매한 권리분석 리포트 확인" icon={<FileText className="h-4 w-4 text-mint" />} />
          <QuickLink href="/my/simulations" label="내 시뮬레이션" description="저장된 창업 시뮬레이션 확인" icon={<Calculator className="h-4 w-4 text-navy" />} />
          <QuickLink href="/my/consultations" label="내 상담" description="전문가 상담 내역 확인" icon={<MessageSquare className="h-4 w-4 text-blue-500" />} />
        </div>
      </div>
    </div>
  );
}

function FormField({
  label,
  icon,
  disabled,
  children,
}: {
  label: string;
  icon: React.ReactNode;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className={`mb-1.5 flex items-center gap-1.5 text-sm font-medium ${disabled ? "text-gray-400" : "text-gray-700"}`}>
        {icon}
        {label}
      </label>
      {children}
    </div>
  );
}

function StatItem({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
}) {
  return (
    <div className="px-4 py-4 text-center">
      <div className="flex items-center justify-center">{icon}</div>
      <p className="mt-1.5 text-lg font-bold text-navy">{value}</p>
      <p className="text-xs text-gray-500">{label}</p>
    </div>
  );
}

function InfoRow({
  label,
  value,
  badge,
  verified,
}: {
  label: string;
  value: string;
  badge?: { color: string; bg: string; border: string };
  verified?: boolean;
}) {
  return (
    <div className="flex items-center justify-between py-3">
      <span className="text-sm text-gray-500">{label}</span>
      <span className="flex items-center gap-1.5 text-sm font-medium text-gray-800">
        {badge ? (
          <span className={`rounded-md border px-2 py-0.5 text-xs font-bold ${badge.bg} ${badge.color} ${badge.border}`}>
            {value}
          </span>
        ) : verified !== undefined ? (
          <span className={`flex items-center gap-1 ${verified ? "text-green-600" : "text-gray-400"}`}>
            {verified && <CheckCircle className="h-3.5 w-3.5" />}
            {value}
          </span>
        ) : (
          value
        )}
      </span>
    </div>
  );
}

function QuickLink({
  href,
  label,
  description,
  icon,
}: {
  href: string;
  label: string;
  description: string;
  icon: React.ReactNode;
}) {
  return (
    <Link href={href} className="flex items-center justify-between px-6 py-4 transition-colors hover:bg-gray-50">
      <div className="flex items-center gap-3">
        {icon}
        <div>
          <p className="text-sm font-medium text-gray-800">{label}</p>
          <p className="text-xs text-gray-400">{description}</p>
        </div>
      </div>
      <ChevronRight className="h-4 w-4 text-gray-400" />
    </Link>
  );
}
