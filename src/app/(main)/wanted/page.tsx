"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import {
  Search,
  Pause,
  CheckCircle,
  Play,
  Trash2,
  MapPin,
  Tag,
  Banknote,
  Ruler,
  FileText,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { useToast } from "@/components/ui/toast";
import { REGIONS } from "@/lib/utils/constants";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface WantedRequest {
  id: string;
  cities: string[];
  districts: string[];
  categories: string[];
  budgetMin: string | null;
  budgetMax: string | null;
  monthlyRentMax: string | null;
  areaMin: number | null;
  areaMax: number | null;
  memo: string | null;
  status: "ACTIVE" | "PAUSED" | "COMPLETED" | "EXPIRED";
  matchCount: number;
  createdAt: string;
}

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const CITY_LIST = Object.keys(REGIONS);

const CATEGORY_OPTIONS = [
  "한식",
  "중식",
  "일식",
  "양식",
  "분식",
  "카페/베이커리",
  "치킨",
  "피자",
  "패스트푸드",
  "주점/술집",
  "편의점",
  "슈퍼마켓",
  "의류",
  "뷰티/미용",
  "헬스/피트니스",
  "학원/교육",
  "PC방",
  "노래방",
  "세탁소",
  "기타",
];

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  ACTIVE: { label: "활성", color: "bg-green-100 text-green-700" },
  PAUSED: { label: "일시정지", color: "bg-yellow-100 text-yellow-700" },
  COMPLETED: { label: "완료", color: "bg-blue-100 text-blue-700" },
  EXPIRED: { label: "만료", color: "bg-gray-100 text-gray-500" },
};

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export default function WantedPage() {
  const { data: session, status: authStatus } = useSession();
  const { toast } = useToast();

  // Form state
  const [selectedCities, setSelectedCities] = useState<string[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [budgetMin, setBudgetMin] = useState("");
  const [budgetMax, setBudgetMax] = useState("");
  const [monthlyRentMax, setMonthlyRentMax] = useState("");
  const [areaMin, setAreaMin] = useState("");
  const [areaMax, setAreaMax] = useState("");
  const [memo, setMemo] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // List state
  const [requests, setRequests] = useState<WantedRequest[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchRequests = useCallback(async () => {
    if (!session?.user) return;
    setLoading(true);
    try {
      const res = await fetch("/api/wanted-requests");
      if (res.ok) {
        const json = await res.json();
        setRequests(json.data);
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [session?.user]);

  useEffect(() => {
    if (session?.user) {
      fetchRequests();
    }
  }, [session?.user, fetchRequests]);

  const toggleCity = (city: string) => {
    setSelectedCities((prev) =>
      prev.includes(city) ? prev.filter((c) => c !== city) : [...prev, city]
    );
  };

  const toggleCategory = (cat: string) => {
    setSelectedCategories((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    );
  };

  const handleSubmit = async () => {
    if (selectedCities.length === 0) {
      toast("error", "희망 지역을 1개 이상 선택해주세요.");
      return;
    }
    if (selectedCategories.length === 0) {
      toast("error", "희망 업종을 1개 이상 선택해주세요.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/wanted-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cities: selectedCities,
          districts: [],
          categories: selectedCategories,
          budgetMin: budgetMin || undefined,
          budgetMax: budgetMax || undefined,
          monthlyRentMax: monthlyRentMax || undefined,
          areaMin: areaMin || undefined,
          areaMax: areaMax || undefined,
          memo: memo || undefined,
        }),
      });

      if (res.ok) {
        toast("success", "의뢰가 등록되었습니다.");
        // Reset form
        setSelectedCities([]);
        setSelectedCategories([]);
        setBudgetMin("");
        setBudgetMax("");
        setMonthlyRentMax("");
        setAreaMin("");
        setAreaMax("");
        setMemo("");
        fetchRequests();
      } else {
        const json = await res.json();
        toast("error", json.error || "등록에 실패했습니다.");
      }
    } catch {
      toast("error", "서버 오류가 발생했습니다.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      const res = await fetch(`/api/wanted-requests/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        toast("success", "상태가 변경되었습니다.");
        fetchRequests();
      } else {
        const json = await res.json();
        toast("error", json.error || "변경에 실패했습니다.");
      }
    } catch {
      toast("error", "서버 오류가 발생했습니다.");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("정말 삭제하시겠습니까?")) return;
    try {
      const res = await fetch(`/api/wanted-requests/${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        toast("success", "의뢰가 삭제되었습니다.");
        fetchRequests();
      } else {
        const json = await res.json();
        toast("error", json.error || "삭제에 실패했습니다.");
      }
    } catch {
      toast("error", "서버 오류가 발생했습니다.");
    }
  };

  const formatWon = (val: string | null) => {
    if (!val) return null;
    const num = parseInt(val);
    if (isNaN(num)) return null;
    if (num >= 10000) return `${(num / 10000).toFixed(num % 10000 === 0 ? 0 : 1)}억원`;
    return `${num.toLocaleString()}만원`;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="bg-surface-1 px-4 py-12 text-center md:py-16">
        <div className="mx-auto max-w-3xl">
          <Search className="mx-auto mb-4 h-10 w-10 text-accent" />
          <h1 className="font-heading text-2xl font-bold text-navy md:text-3xl">
            원하는 조건의 점포를 찾아드립니다
          </h1>
          <p className="mt-3 text-sm text-gray-500 md:text-base">
            조건을 등록하면 매칭되는 매물이 등록될 때 알림을 보내드립니다
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-4xl px-4 py-8">
        {/* Auth Gate */}
        {authStatus === "loading" ? (
          <div className="flex justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-navy" />
          </div>
        ) : !session?.user ? (
          <div className="rounded-xl border border-gray-200 bg-white p-8 text-center shadow-sm">
            <AlertCircle className="mx-auto mb-4 h-12 w-12 text-gray-400" />
            <h2 className="text-lg font-bold text-gray-800">
              로그인이 필요합니다
            </h2>
            <p className="mt-2 text-sm text-gray-500">
              점포 찾기 의뢰를 등록하려면 로그인해주세요.
            </p>
            <Link
              href="/login"
              className="mt-6 inline-block rounded-lg bg-navy px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-navy-light"
            >
              로그인하기
            </Link>
          </div>
        ) : (
          <>
            {/* Registration Form */}
            <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm md:p-8">
              <h2 className="mb-6 text-lg font-bold text-gray-900">
                의뢰 등록
              </h2>

              {/* Cities */}
              <div className="mb-6">
                <label className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-gray-700">
                  <MapPin className="h-4 w-4" />
                  희망 지역 <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5">
                  {CITY_LIST.map((city) => (
                    <button
                      key={city}
                      type="button"
                      onClick={() => toggleCity(city)}
                      className={`rounded-lg border px-3 py-2 text-xs font-medium transition-all ${
                        selectedCities.includes(city)
                          ? "border-navy bg-navy text-white"
                          : "border-gray-200 bg-white text-gray-600 hover:border-navy/30 hover:bg-navy/5"
                      }`}
                    >
                      {city.replace(/(특별시|광역시|특별자치시|특별자치도|도)$/, "")}
                    </button>
                  ))}
                </div>
                {selectedCities.length > 0 && (
                  <p className="mt-2 text-xs text-navy">
                    선택: {selectedCities.map((c) => c.replace(/(특별시|광역시|특별자치시|특별자치도|도)$/, "")).join(", ")}
                  </p>
                )}
              </div>

              {/* Categories */}
              <div className="mb-6">
                <label className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-gray-700">
                  <Tag className="h-4 w-4" />
                  희망 업종 <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5">
                  {CATEGORY_OPTIONS.map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => toggleCategory(cat)}
                      className={`rounded-lg border px-3 py-2 text-xs font-medium transition-all ${
                        selectedCategories.includes(cat)
                          ? "border-navy bg-navy text-white"
                          : "border-gray-200 bg-white text-gray-600 hover:border-navy/30 hover:bg-navy/5"
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Budget Range */}
              <div className="mb-6">
                <label className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-gray-700">
                  <Banknote className="h-4 w-4" />
                  예산 범위 (만원)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    placeholder="최소"
                    value={budgetMin}
                    onChange={(e) => setBudgetMin(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-navy focus:outline-none focus:ring-1 focus:ring-navy"
                  />
                  <span className="text-gray-400">~</span>
                  <input
                    type="number"
                    placeholder="최대"
                    value={budgetMax}
                    onChange={(e) => setBudgetMax(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-navy focus:outline-none focus:ring-1 focus:ring-navy"
                  />
                </div>
              </div>

              {/* Monthly Rent */}
              <div className="mb-6">
                <label className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-gray-700">
                  <Banknote className="h-4 w-4" />
                  월세 상한 (만원)
                </label>
                <input
                  type="number"
                  placeholder="월세 상한"
                  value={monthlyRentMax}
                  onChange={(e) => setMonthlyRentMax(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-navy focus:outline-none focus:ring-1 focus:ring-navy md:w-1/2"
                />
              </div>

              {/* Area Range */}
              <div className="mb-6">
                <label className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-gray-700">
                  <Ruler className="h-4 w-4" />
                  면적 범위 (평)
                </label>
                <div className="flex items-center gap-2 md:w-1/2">
                  <input
                    type="number"
                    placeholder="최소"
                    value={areaMin}
                    onChange={(e) => setAreaMin(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-navy focus:outline-none focus:ring-1 focus:ring-navy"
                  />
                  <span className="text-gray-400">~</span>
                  <input
                    type="number"
                    placeholder="최대"
                    value={areaMax}
                    onChange={(e) => setAreaMax(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-navy focus:outline-none focus:ring-1 focus:ring-navy"
                  />
                </div>
              </div>

              {/* Memo */}
              <div className="mb-6">
                <label className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-gray-700">
                  <FileText className="h-4 w-4" />
                  추가 요청사항
                </label>
                <textarea
                  placeholder="원하는 조건이나 요청사항을 자유롭게 작성해주세요."
                  value={memo}
                  onChange={(e) => setMemo(e.target.value)}
                  rows={3}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-navy focus:outline-none focus:ring-1 focus:ring-navy"
                />
              </div>

              {/* Submit */}
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="w-full rounded-lg bg-navy py-3 text-sm font-bold text-white transition-colors hover:bg-navy-light disabled:cursor-not-allowed disabled:opacity-50 md:w-auto md:px-12"
              >
                {submitting ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    등록 중...
                  </span>
                ) : (
                  "의뢰 등록"
                )}
              </button>
            </div>

            {/* My Requests List */}
            <div className="mt-8">
              <h2 className="mb-4 text-lg font-bold text-gray-900">
                내 의뢰 목록
              </h2>

              {loading ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="h-6 w-6 animate-spin text-navy" />
                </div>
              ) : requests.length === 0 ? (
                <div className="rounded-xl border border-gray-200 bg-white p-8 text-center">
                  <p className="text-sm text-gray-500">
                    등록된 의뢰가 없습니다.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {requests.map((req) => (
                    <div
                      key={req.id}
                      className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          {/* Status Badge */}
                          <span
                            className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${
                              STATUS_LABELS[req.status]?.color ?? "bg-gray-100 text-gray-500"
                            }`}
                          >
                            {STATUS_LABELS[req.status]?.label ?? req.status}
                          </span>
                          {req.matchCount > 0 && (
                            <span className="ml-2 text-xs text-navy font-medium">
                              매칭 {req.matchCount}건
                            </span>
                          )}

                          {/* Summary */}
                          <div className="mt-3 space-y-1.5">
                            <div className="flex items-center gap-1.5 text-sm text-gray-700">
                              <MapPin className="h-3.5 w-3.5 text-gray-400" />
                              {req.cities
                                .map((c) => c.replace(/(특별시|광역시|특별자치시|특별자치도|도)$/, ""))
                                .join(", ")}
                            </div>
                            <div className="flex items-center gap-1.5 text-sm text-gray-700">
                              <Tag className="h-3.5 w-3.5 text-gray-400" />
                              {req.categories.join(", ")}
                            </div>
                            {(req.budgetMin || req.budgetMax) && (
                              <div className="flex items-center gap-1.5 text-sm text-gray-700">
                                <Banknote className="h-3.5 w-3.5 text-gray-400" />
                                예산: {formatWon(req.budgetMin) ?? "제한없음"} ~{" "}
                                {formatWon(req.budgetMax) ?? "제한없음"}
                              </div>
                            )}
                            {req.monthlyRentMax && (
                              <div className="flex items-center gap-1.5 text-sm text-gray-700">
                                <Banknote className="h-3.5 w-3.5 text-gray-400" />
                                월세 상한: {formatWon(req.monthlyRentMax)}
                              </div>
                            )}
                            {(req.areaMin || req.areaMax) && (
                              <div className="flex items-center gap-1.5 text-sm text-gray-700">
                                <Ruler className="h-3.5 w-3.5 text-gray-400" />
                                면적: {req.areaMin ?? "-"} ~ {req.areaMax ?? "-"}평
                              </div>
                            )}
                            {req.memo && (
                              <p className="mt-1 text-xs text-gray-500 line-clamp-2">
                                {req.memo}
                              </p>
                            )}
                          </div>

                          <p className="mt-2 text-xs text-gray-400">
                            {new Date(req.createdAt).toLocaleDateString("ko-KR")} 등록
                          </p>
                        </div>

                        {/* Actions */}
                        <div className="ml-4 flex flex-col gap-1.5">
                          {req.status === "ACTIVE" && (
                            <button
                              onClick={() => handleStatusChange(req.id, "PAUSED")}
                              className="flex items-center gap-1 rounded-md border border-gray-200 px-2.5 py-1.5 text-xs text-gray-600 transition-colors hover:bg-gray-50"
                              title="일시정지"
                            >
                              <Pause className="h-3 w-3" />
                              정지
                            </button>
                          )}
                          {req.status === "PAUSED" && (
                            <button
                              onClick={() => handleStatusChange(req.id, "ACTIVE")}
                              className="flex items-center gap-1 rounded-md border border-green-200 px-2.5 py-1.5 text-xs text-green-600 transition-colors hover:bg-green-50"
                              title="재개"
                            >
                              <Play className="h-3 w-3" />
                              재개
                            </button>
                          )}
                          {(req.status === "ACTIVE" || req.status === "PAUSED") && (
                            <button
                              onClick={() => handleStatusChange(req.id, "COMPLETED")}
                              className="flex items-center gap-1 rounded-md border border-blue-200 px-2.5 py-1.5 text-xs text-blue-600 transition-colors hover:bg-blue-50"
                              title="완료"
                            >
                              <CheckCircle className="h-3 w-3" />
                              완료
                            </button>
                          )}
                          <button
                            onClick={() => handleDelete(req.id)}
                            className="flex items-center gap-1 rounded-md border border-red-200 px-2.5 py-1.5 text-xs text-red-500 transition-colors hover:bg-red-50"
                            title="삭제"
                          >
                            <Trash2 className="h-3 w-3" />
                            삭제
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
