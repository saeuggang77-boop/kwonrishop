"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useToast } from "@/components/ui/toast";

interface PremiumOffer {
  id: string;
  offerAmount: number;
  reason: string;
  status: string;
  createdAt: string;
  user: { id: string; name: string | null; image: string | null };
}

function addCommas(v: string) {
  const n = v.replace(/[^0-9]/g, "");
  return n ? Number(n).toLocaleString() : "";
}
function stripCommas(v: string) {
  return v.replace(/[^0-9]/g, "");
}

export function PremiumOfferSection({
  listingId,
  sellerId,
  userId,
  premiumFee,
  compact = false,
}: {
  listingId: string;
  sellerId: string;
  userId: string | null;
  premiumFee: number;
  compact?: boolean;
}) {
  const { toast } = useToast();
  const isOwner = userId === sellerId;

  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [myOffer, setMyOffer] = useState<PremiumOffer | null>(null);
  const [ownerOffers, setOwnerOffers] = useState<PremiumOffer[]>([]);
  const [loadingOffers, setLoadingOffers] = useState(false);

  // Owner: fetch received offers
  useEffect(() => {
    if (!isOwner || !userId) return;
    setLoadingOffers(true);
    fetch(`/api/listings/${listingId}/premium-offers`)
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => setOwnerOffers(Array.isArray(data) ? data : []))
      .catch(() => setOwnerOffers([]))
      .finally(() => setLoadingOffers(false));
  }, [isOwner, userId, listingId]);

  // Non-owner: check if already offered
  useEffect(() => {
    if (isOwner || !userId) return;
    fetch(`/api/listings/${listingId}/premium-offers/mine`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => { if (data?.id) setMyOffer(data); })
      .catch(() => {});
  }, [isOwner, userId, listingId]);

  const handleSubmit = async () => {
    const numAmount = Number(stripCommas(amount));
    if (!numAmount || numAmount <= 0) {
      toast("error", "제안 금액을 입력해주세요.");
      return;
    }
    if (reason.trim().length < 5) {
      toast("error", "제안 사유를 5자 이상 입력해주세요.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`/api/listings/${listingId}/premium-offers`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ offerAmount: numAmount, reason: reason.trim() }),
      });
      if (res.ok) {
        const data = await res.json();
        setMyOffer({ ...data, user: { id: userId!, name: null, image: null } });
        toast("success", "제안이 전송되었습니다.");
        setAmount("");
        setReason("");
      } else {
        const err = await res.json().catch(() => ({}));
        toast("error", err.error || "제안 전송에 실패했습니다.");
      }
    } catch {
      toast("error", "네트워크 오류가 발생했습니다.");
    } finally {
      setSubmitting(false);
    }
  };

  // Not logged in
  if (!userId) {
    return (
      <div className={compact ? "p-5 text-center" : "mt-4 overflow-hidden rounded-xl border border-gray-200 bg-white p-5 text-center"}>
        {!compact && <p className="text-sm font-bold text-gray-700">권리금 제안하기</p>}
        <p className={compact ? "text-sm text-gray-500" : "mt-2 text-sm text-gray-500"}>로그인 후 권리금을 제안할 수 있습니다.</p>
        <Link
          href="/login"
          className="mt-3 inline-block rounded-lg bg-purple px-6 py-2.5 text-sm font-bold text-white transition-colors hover:bg-purple/90"
        >
          로그인
        </Link>
      </div>
    );
  }

  // Owner: show received offers
  if (isOwner) {
    return (
      <div className={compact ? "" : "mt-4 overflow-hidden rounded-xl border border-gray-200 bg-white"}>
        {!compact && (
          <div className="bg-gradient-to-r from-purple/5 to-purple/10 px-5 py-4">
            <h3 className="text-sm font-bold text-purple">받은 권리금 제안 ({ownerOffers.length}건)</h3>
          </div>
        )}
        <div className={compact ? "p-4" : "p-4"}>
          {loadingOffers ? (
            <div className="py-4 text-center text-sm text-gray-400">불러오는 중...</div>
          ) : ownerOffers.length === 0 ? (
            <p className="py-4 text-center text-sm text-gray-400">아직 받은 제안이 없습니다.</p>
          ) : (
            <div className="space-y-3">
              {ownerOffers.map((offer) => (
                <div key={offer.id} className="rounded-lg border border-gray-100 bg-gray-50 p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">{offer.user.name || "익명"}</span>
                    <span className="text-sm font-bold text-purple">{offer.offerAmount.toLocaleString()}만원</span>
                  </div>
                  <p className="mt-1.5 whitespace-pre-line text-sm text-gray-600">{offer.reason}</p>
                  <div className="mt-2 flex items-center justify-between">
                    <span className="text-xs text-gray-400">
                      {new Date(offer.createdAt).toLocaleDateString("ko-KR")}
                    </span>
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      offer.status === "pending"
                        ? "bg-yellow-100 text-yellow-700"
                        : offer.status === "accepted"
                          ? "bg-green-100 text-green-700"
                          : "bg-gray-100 text-gray-500"
                    }`}>
                      {offer.status === "pending" ? "대기중" : offer.status === "accepted" ? "수락됨" : "거절됨"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Already offered
  if (myOffer) {
    return (
      <div className={compact ? "p-5" : "mt-4 overflow-hidden rounded-xl border border-gray-200 bg-white p-5"}>
        {!compact && <p className="text-sm font-bold text-gray-700">권리금 제안하기</p>}
        <div className="mt-3 rounded-lg bg-purple/5 p-4 text-center">
          <p className="text-sm text-gray-600">이미 제안을 보냈습니다.</p>
          <p className="mt-1 text-lg font-bold text-purple">{myOffer.offerAmount.toLocaleString()}만원</p>
          <p className="mt-1 text-xs text-gray-400">
            {new Date(myOffer.createdAt).toLocaleDateString("ko-KR")} 제안
          </p>
        </div>
      </div>
    );
  }

  // Offer form
  return (
    <div className={compact ? "" : "mt-4 overflow-hidden rounded-xl border border-gray-200 bg-white"}>
      {!compact && (
        <div className="bg-gradient-to-r from-purple/5 to-purple/10 px-5 py-4">
          <h3 className="text-sm font-bold text-purple">권리금 제안하기</h3>
          <p className="mt-1 text-xs text-gray-500">이 매물에 관심이 있다면 권리금을 제안해보세요!</p>
        </div>
      )}
      <div className="space-y-3 p-4">
        {premiumFee > 0 && (
          <p className="text-xs text-gray-500">
            현재 매도자 요청 권리금: <span className="font-bold text-purple">{premiumFee.toLocaleString()}만원</span>
          </p>
        )}
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">제안 금액</label>
          <div className="flex items-center gap-2">
            <input
              type="text"
              inputMode="numeric"
              value={addCommas(amount)}
              onChange={(e) => setAmount(stripCommas(e.target.value))}
              placeholder="제안할 금액 입력"
              className="flex-1 rounded-lg border border-gray-200 px-3 py-2.5 text-right text-sm outline-none transition-colors focus:border-purple focus:ring-1 focus:ring-purple/20"
            />
            <span className="shrink-0 text-sm font-medium text-gray-500">만원</span>
          </div>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">제안 사유</label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder={"매도자가 이해할 수 있는 이유를 적어주세요\n예) 시설 노후화 감안, 주변 시세 대비 등"}
            rows={3}
            className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none transition-colors focus:border-purple focus:ring-1 focus:ring-purple/20 placeholder:text-gray-400 resize-none"
          />
        </div>
        <button
          onClick={handleSubmit}
          disabled={submitting}
          className="w-full rounded-lg bg-purple py-3 text-sm font-bold text-white transition-colors hover:bg-purple/90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {submitting ? "전송 중..." : "제안하기"}
        </button>
      </div>
    </div>
  );
}
