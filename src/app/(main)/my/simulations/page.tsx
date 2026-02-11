"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Calculator, Trash2, Clock, TrendingUp, ArrowRight } from "lucide-react";
import { useSession } from "next-auth/react";
import { useToast } from "@/components/ui/toast";

interface SimulationItem {
  id: string;
  title: string;
  input: {
    businessType: string;
    city: string;
    district: string;
  };
  result: {
    monthlyProfit: number;
    paybackMonths: number;
    roi: number;
  };
  createdAt: string;
}

export default function MySimulationsPage() {
  const { status } = useSession();
  const { toast } = useToast();
  const [simulations, setSimulations] = useState<SimulationItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (status === "authenticated") {
      fetch("/api/simulations")
        .then((res) => res.json())
        .then((json) => setSimulations(json.data || []))
        .finally(() => setIsLoading(false));
    } else if (status === "unauthenticated") {
      setIsLoading(false);
    }
  }, [status]);

  const handleDelete = async (id: string) => {
    const res = await fetch(`/api/simulations/${id}`, { method: "DELETE" });
    if (res.ok) {
      setSimulations((prev) => prev.filter((s) => s.id !== id));
      toast("success", "시뮬레이션이 삭제되었습니다.");
    } else {
      toast("error", "삭제에 실패했습니다.");
    }
  };

  if (status === "unauthenticated") {
    return (
      <div className="mx-auto max-w-4xl px-4 py-16 text-center">
        <Calculator className="mx-auto h-12 w-12 text-gray-300" />
        <h2 className="mt-4 text-xl font-bold text-navy">로그인이 필요합니다</h2>
        <p className="mt-2 text-sm text-gray-500">시뮬레이션을 저장하려면 로그인해주세요.</p>
        <Link href="/login" className="mt-4 inline-block rounded-lg bg-mint px-6 py-2.5 text-sm font-medium text-white hover:bg-mint/90">
          로그인
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-navy">내 시뮬레이션</h1>
          <p className="mt-1 text-sm text-gray-500">저장된 창업 시뮬레이션 결과를 확인하세요</p>
        </div>
        <Link href="/simulator" className="rounded-lg bg-mint px-4 py-2 text-sm font-medium text-white hover:bg-mint/90">
          새 시뮬레이션
        </Link>
      </div>

      <div className="mt-8">
        {isLoading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-24 animate-pulse rounded-lg bg-gray-200" />
            ))}
          </div>
        ) : simulations.length === 0 ? (
          <div className="py-20 text-center">
            <Calculator className="mx-auto h-12 w-12 text-gray-300" />
            <p className="mt-4 text-gray-500">저장된 시뮬레이션이 없습니다</p>
            <Link href="/simulator" className="mt-4 inline-block rounded-lg bg-mint px-6 py-2.5 text-sm font-medium text-white hover:bg-mint/90">
              시뮬레이션 시작
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {simulations.map((sim) => (
              <div
                key={sim.id}
                className="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-5 shadow-sm"
              >
                <div className="min-w-0 flex-1">
                  <h3 className="font-bold text-navy">{sim.title}</h3>
                  <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-gray-500">
                    <span>{sim.input.businessType}</span>
                    <span>{sim.input.city} {sim.input.district}</span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {new Date(sim.createdAt).toLocaleDateString("ko-KR")}
                    </span>
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-4 text-sm">
                    <span className={sim.result.monthlyProfit >= 0 ? "font-medium text-green-600" : "font-medium text-red-600"}>
                      <TrendingUp className="mr-1 inline h-3.5 w-3.5" />
                      월 순이익 {sim.result.monthlyProfit.toLocaleString("ko-KR")}만원
                    </span>
                    <span className="text-gray-500">
                      회수 {sim.result.paybackMonths === Infinity ? "불가" : `${sim.result.paybackMonths}개월`}
                    </span>
                    <span className="text-gray-500">
                      ROI {sim.result.roi.toFixed(1)}%
                    </span>
                  </div>
                </div>
                <div className="ml-4 flex items-center gap-2">
                  <Link
                    href={`/simulator?load=${sim.id}`}
                    className="rounded-lg border border-gray-300 p-2 text-gray-500 hover:bg-gray-50"
                    title="다시 시뮬레이션"
                  >
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                  <button
                    onClick={() => handleDelete(sim.id)}
                    className="rounded-lg border border-gray-300 p-2 text-red-500 hover:bg-red-50"
                    title="삭제"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
