"use client";

import { useState, useCallback } from "react";
import { Search, MapPin, Store, TrendingUp, TrendingDown, BarChart3, Users, Loader2 } from "lucide-react";
import dynamic from "next/dynamic";
import { AnalysisMap } from "@/components/area-analysis/analysis-map";
import {
  KAKAO_CATEGORY_MAP,
  RADIUS_OPTIONS,
  CHART_COLORS,
  isSeoulAddress,
  type NearbyResult,
  type StoreStats,
  type SeoulData,
  type NearbyPlace,
} from "@/lib/utils/area-analysis";
import { useToast } from "@/components/ui/toast";

// Dynamic Recharts imports (avoid SSR)
const ResponsiveContainer = dynamic(() => import("recharts").then((m) => m.ResponsiveContainer), { ssr: false });
const PieChart = dynamic(() => import("recharts").then((m) => m.PieChart), { ssr: false });
const Pie = dynamic(() => import("recharts").then((m) => m.Pie), { ssr: false });
const Cell = dynamic(() => import("recharts").then((m) => m.Cell), { ssr: false });
const BarChart = dynamic(() => import("recharts").then((m) => m.BarChart), { ssr: false });
const Bar = dynamic(() => import("recharts").then((m) => m.Bar), { ssr: false });
const XAxis = dynamic(() => import("recharts").then((m) => m.XAxis), { ssr: false });
const YAxis = dynamic(() => import("recharts").then((m) => m.YAxis), { ssr: false });
const CartesianGrid = dynamic(() => import("recharts").then((m) => m.CartesianGrid), { ssr: false });
const Tooltip = dynamic(() => import("recharts").then((m) => m.Tooltip), { ssr: false });

export default function AreaAnalysisPage() {
  const { toast } = useToast();
  const [address, setAddress] = useState("");
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [radius, setRadius] = useState(500);
  const [nearbyResults, setNearbyResults] = useState<NearbyResult[]>([]);
  const [allPlaces, setAllPlaces] = useState<NearbyPlace[]>([]);
  const [storeStats, setStoreStats] = useState<StoreStats | null>(null);
  const [seoulData, setSeoulData] = useState<SeoulData | null>(null);
  const [isSeoul, setIsSeoul] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [analyzed, setAnalyzed] = useState(false);

  const handleSearch = useCallback(async () => {
    if (!address.trim()) return;
    setIsLoading(true);
    setAnalyzed(false);

    try {
      // Use Kakao geocoding to get coordinates
      const waitForKakao = () =>
        new Promise<void>((resolve) => {
          if (window.kakao?.maps?.services) {
            resolve();
            return;
          }
          const check = setInterval(() => {
            if (window.kakao?.maps?.services) {
              clearInterval(check);
              resolve();
            }
          }, 100);
          setTimeout(() => {
            clearInterval(check);
            resolve();
          }, 5000);
        });

      await waitForKakao();

      const geocoder = new window.kakao.maps.services.Geocoder();
      const places = new window.kakao.maps.services.Places();

      // Try keyword search first (more flexible), fallback to address search
      const result = await new Promise<{ lat: number; lng: number; address: string } | null>((resolve) => {
        places.keywordSearch(address, (data: any, status: any) => {
          if (status === window.kakao.maps.services.Status.OK && data.length > 0) {
            resolve({
              lat: Number(data[0].y),
              lng: Number(data[0].x),
              address: data[0].road_address_name || data[0].address_name || address,
            });
          } else {
            // Fallback: address search
            geocoder.addressSearch(address, (data2: any, status2: any) => {
              if (status2 === window.kakao.maps.services.Status.OK && data2.length > 0) {
                resolve({
                  lat: Number(data2[0].y),
                  lng: Number(data2[0].x),
                  address: data2[0].road_address?.address_name || data2[0].address_name || address,
                });
              } else {
                resolve(null);
              }
            });
          }
        });
      });

      if (!result) {
        toast("error", "주소를 찾을 수 없습니다. 다시 입력해주세요.");
        setIsLoading(false);
        return;
      }

      setCoords({ lat: result.lat, lng: result.lng });
      setAddress(result.address);
      const seoul = isSeoulAddress(result.address);
      setIsSeoul(seoul);

      // Fetch all data in parallel
      const [nearbyRes, storesRes, seoulRes] = await Promise.all([
        fetch(`/api/area-analysis/nearby?x=${result.lng}&y=${result.lat}&radius=${radius}`).then((r) =>
          r.ok ? r.json() : [],
        ),
        fetch(`/api/area-analysis/stores?lat=${result.lat}&lng=${result.lng}&radius=${radius}`).then((r) =>
          r.ok ? r.json() : null,
        ),
        seoul
          ? fetch(`/api/area-analysis/seoul?lat=${result.lat}&lng=${result.lng}`).then((r) => (r.ok ? r.json() : null))
          : Promise.resolve(null),
      ]);

      setNearbyResults(nearbyRes);
      setAllPlaces(nearbyRes.flatMap((r: NearbyResult) => r.places));
      setStoreStats(storesRes);
      setSeoulData(seoulRes);
      setAnalyzed(true);
    } catch (err) {
      console.error("Analysis error:", err);
      toast("error", "분석 중 오류가 발생했습니다.");
    } finally {
      setIsLoading(false);
    }
  }, [address, radius]);

  // Category summary (from nearby results)
  const categorySummary = nearbyResults
    .map((r) => ({ key: r.categoryKey, label: r.categoryLabel, count: r.count }))
    .filter((c) => c.count > 0)
    .sort((a, b) => b.count - a.count);

  const totalNearby = categorySummary.reduce((s, c) => s + c.count, 0);

  // Pie chart data for category distribution
  const pieData = categorySummary.map((c, i) => ({
    name: c.label,
    value: c.count,
    color: CHART_COLORS[i % CHART_COLORS.length],
  }));

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-navy py-8 md:py-12">
        <div className="mx-auto max-w-5xl px-4 text-center">
          <h1 className="font-heading text-xl font-bold text-white md:text-3xl">상권분석</h1>
          <p className="mt-2 text-sm text-white/60">주소를 입력하면 주변 상권 현황을 분석해드립니다</p>
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-4 py-6 md:py-8">
        {/* Search Bar */}
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm md:p-6">
          <div className="flex flex-col gap-3 md:flex-row md:items-end">
            <div className="flex-1">
              <label className="mb-1.5 block text-sm font-medium text-gray-700">분석할 주소</label>
              <div className="flex items-center gap-2 rounded-lg border border-gray-300 px-3 py-2.5 focus-within:border-[#1B3A5C] focus-within:ring-1 focus-within:ring-[#1B3A5C]">
                <MapPin className="h-4 w-4 shrink-0 text-gray-400" />
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  placeholder="예: 서울 강남구 역삼동, 홍대입구역, 부산 해운대"
                  className="w-full bg-transparent text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none"
                />
              </div>
            </div>

            {/* Radius selector */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">반경</label>
              <div className="flex gap-1.5">
                {RADIUS_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setRadius(opt.value)}
                    className={`rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                      radius === opt.value
                        ? "bg-[#1B3A5C] text-white"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={handleSearch}
              disabled={isLoading || !address.trim()}
              className="flex min-h-[44px] items-center justify-center gap-2 rounded-lg bg-[#1B3A5C] px-6 text-sm font-bold text-white transition-colors hover:bg-[#15304D] disabled:opacity-50"
            >
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
              분석하기
            </button>
          </div>

          {/* Category filter tabs */}
          {analyzed && (
            <div className="mt-4 flex flex-wrap gap-2 border-t border-gray-100 pt-4">
              <button
                onClick={() => setSelectedCategory(null)}
                className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                  !selectedCategory ? "bg-[#1B3A5C] text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                전체
              </button>
              {Object.entries(KAKAO_CATEGORY_MAP).map(([key, { label }]) => (
                <button
                  key={key}
                  onClick={() => setSelectedCategory(selectedCategory === key ? null : key)}
                  className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                    selectedCategory === key ? "bg-[#1B3A5C] text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Map */}
        <div className="mt-6 h-[350px] md:h-[450px]">
          <AnalysisMap center={coords} radius={radius} places={allPlaces} selectedCategory={selectedCategory} />
        </div>

        {/* Results */}
        {analyzed && (
          <div className="mt-6 space-y-6">
            {/* Summary stat cards */}
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              <div className="rounded-xl border border-gray-200 bg-white p-4 text-center">
                <Store className="mx-auto h-6 w-6 text-[#1B3A5C]" />
                <p className="mt-2 text-2xl font-bold text-[#1B3A5C]">{totalNearby}</p>
                <p className="text-xs text-gray-500">주변 점포</p>
              </div>
              <div className="rounded-xl border border-gray-200 bg-white p-4 text-center">
                <BarChart3 className="mx-auto h-6 w-6 text-amber-600" />
                <p className="mt-2 text-2xl font-bold text-amber-600">{storeStats?.total ?? "-"}</p>
                <p className="text-xs text-gray-500">등록 상가</p>
              </div>
              <div className="rounded-xl border border-gray-200 bg-white p-4 text-center">
                <TrendingUp className="mx-auto h-6 w-6 text-green-600" />
                <p className="mt-2 text-2xl font-bold text-green-600">
                  {storeStats ? `${storeStats.openRate}%` : "-"}
                </p>
                <p className="text-xs text-gray-500">영업률</p>
              </div>
              <div className="rounded-xl border border-gray-200 bg-white p-4 text-center">
                <TrendingDown className="mx-auto h-6 w-6 text-red-500" />
                <p className="mt-2 text-2xl font-bold text-red-500">
                  {storeStats ? `${storeStats.closeRate}%` : "-"}
                </p>
                <p className="text-xs text-gray-500">폐업률</p>
              </div>
            </div>

            {/* Charts row */}
            <div className="grid gap-6 md:grid-cols-2">
              {/* Donut Chart: Category distribution */}
              <div className="rounded-xl border border-gray-200 bg-white p-4 md:p-6">
                <h3 className="text-sm font-bold text-gray-900">업종별 분포</h3>
                <div className="mt-4 h-[250px]">
                  {pieData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={pieData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={90}
                          paddingAngle={2}
                          dataKey="value"
                          nameKey="name"
                          label={({ name, percent }: any) => `${name} ${(percent * 100).toFixed(0)}%`}
                          labelLine={false}
                        >
                          {pieData.map((entry, idx) => (
                            <Cell key={idx} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value: any) => [`${value}개`, "점포 수"]} />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex h-full items-center justify-center text-sm text-gray-400">데이터 없음</div>
                  )}
                </div>
              </div>

              {/* Bar Chart: Category counts */}
              <div className="rounded-xl border border-gray-200 bg-white p-4 md:p-6">
                <h3 className="text-sm font-bold text-gray-900">카테고리별 점포 수</h3>
                <div className="mt-4 h-[250px]">
                  {categorySummary.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={categorySummary} layout="vertical" margin={{ left: 10, right: 20 }}>
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                        <XAxis type="number" tick={{ fontSize: 11 }} />
                        <YAxis type="category" dataKey="label" tick={{ fontSize: 11 }} width={60} />
                        <Tooltip formatter={(value: any) => [`${value}개`, "점포 수"]} />
                        <Bar dataKey="count" fill="#1B3A5C" radius={[0, 4, 4, 0]} barSize={20} />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex h-full items-center justify-center text-sm text-gray-400">데이터 없음</div>
                  )}
                </div>
              </div>
            </div>

            {/* Store stats: category breakdown */}
            {storeStats && storeStats.byCategory.length > 0 && (
              <div className="rounded-xl border border-gray-200 bg-white p-4 md:p-6">
                <h3 className="text-sm font-bold text-gray-900">상가정보 업종 분포</h3>
                <div className="mt-4 h-[250px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={storeStats.byCategory} margin={{ left: 10, right: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis
                        dataKey="name"
                        tick={{ fontSize: 10 }}
                        interval={0}
                        angle={-30}
                        textAnchor="end"
                        height={60}
                      />
                      <YAxis tick={{ fontSize: 11 }} />
                      <Tooltip formatter={(value: any) => [`${value}개`, "점포 수"]} />
                      <Bar dataKey="count" radius={[4, 4, 0, 0]} barSize={30}>
                        {storeStats.byCategory.map((entry, idx) => (
                          <Cell key={idx} fill={entry.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {/* Seoul-only section */}
            {isSeoul && seoulData ? (
              <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 md:p-6">
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-blue-600" />
                  <h3 className="text-sm font-bold text-blue-900">서울 상권 데이터</h3>
                  <span className="rounded bg-blue-100 px-2 py-0.5 text-[10px] font-medium text-blue-600">
                    {seoulData.quarterLabel}
                  </span>
                </div>

                {seoulData.footTraffic.length === 0 && seoulData.estimatedSales.length === 0 ? (
                  <div className="mt-4 flex flex-col items-center py-6 text-center">
                    <Users className="h-10 w-10 text-blue-300" />
                    <p className="mt-2 text-sm font-medium text-blue-800">서울 공공데이터를 불러올 수 없습니다</p>
                    <p className="mt-1 text-xs text-blue-500">서울 열린데이터 광장 서비스 점검 중이거나, 해당 상권 데이터가 아직 제공되지 않습니다</p>
                  </div>
                ) : (
                <div className="mt-4 grid gap-6 md:grid-cols-2">
                  {/* Foot traffic */}
                  {seoulData.footTraffic.length > 0 && (
                    <div>
                      <h4 className="text-xs font-medium text-gray-600">요일별 유동인구</h4>
                      <div className="mt-2 h-[200px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={seoulData.footTraffic}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="dayOfWeek" tick={{ fontSize: 12 }} />
                            <YAxis
                              tick={{ fontSize: 10 }}
                              tickFormatter={(v: number) =>
                                v >= 10000 ? `${(v / 10000).toFixed(0)}만` : v.toLocaleString()
                              }
                            />
                            <Tooltip formatter={(value: any) => [Number(value).toLocaleString() + "명", "유동인구"]} />
                            <Bar dataKey="count" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  )}

                  {/* Estimated sales */}
                  {seoulData.estimatedSales.length > 0 && (
                    <div>
                      <h4 className="text-xs font-medium text-gray-600">업종별 추정매출</h4>
                      <div className="mt-2 h-[200px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={seoulData.estimatedSales} layout="vertical" margin={{ left: 10, right: 20 }}>
                            <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                            <XAxis
                              type="number"
                              tick={{ fontSize: 10 }}
                              tickFormatter={(v: number) =>
                                v >= 100000000
                                  ? `${(v / 100000000).toFixed(0)}억`
                                  : v >= 10000
                                    ? `${(v / 10000).toFixed(0)}만`
                                    : String(v)
                              }
                            />
                            <YAxis type="category" dataKey="category" tick={{ fontSize: 10 }} width={70} />
                            <Tooltip formatter={(value: any) => [`${(Number(value) / 10000).toLocaleString()}만원`, "추정매출"]} />
                            <Bar dataKey="amount" fill="#F59E0B" radius={[0, 4, 4, 0]} barSize={18} />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  )}
                </div>
                )}
              </div>
            ) : isSeoul === false && analyzed ? (
              <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 text-center text-sm text-gray-500">
                <Users className="mx-auto h-8 w-8 text-gray-300" />
                <p className="mt-2">유동인구 및 추정매출 데이터는 서울 지역만 제공됩니다</p>
              </div>
            ) : null}

            {/* Nearby places list */}
            {allPlaces.length > 0 && (
              <div className="rounded-xl border border-gray-200 bg-white p-4 md:p-6">
                <h3 className="text-sm font-bold text-gray-900">주변 점포 목록</h3>
                <div className="mt-3 max-h-[400px] overflow-y-auto">
                  <table className="w-full text-sm">
                    <thead className="sticky top-0 bg-white">
                      <tr className="border-b border-gray-200 text-left text-xs text-gray-500">
                        <th className="pb-2 font-medium">상호명</th>
                        <th className="pb-2 font-medium">업종</th>
                        <th className="pb-2 font-medium text-right">거리</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(selectedCategory ? allPlaces.filter((p) => p.categoryKey === selectedCategory) : allPlaces)
                        .sort((a, b) => a.distance - b.distance)
                        .slice(0, 50)
                        .map((place) => (
                          <tr key={place.id} className="border-b border-gray-50">
                            <td className="py-2 font-medium text-gray-900">{place.name}</td>
                            <td className="py-2 text-gray-500">
                              {KAKAO_CATEGORY_MAP[place.categoryKey]?.label ?? place.category}
                            </td>
                            <td className="py-2 text-right text-gray-400">{place.distance}m</td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Empty state */}
        {!analyzed && !isLoading && (
          <div className="mt-12 text-center">
            <MapPin className="mx-auto h-16 w-16 text-gray-200" />
            <p className="mt-4 text-sm text-gray-400">주소를 입력하고 &quot;분석하기&quot;를 눌러주세요</p>
            <p className="mt-1 text-xs text-gray-300">지역명, 역 이름, 도로명 주소 등으로 검색할 수 있습니다</p>
          </div>
        )}
      </div>
    </div>
  );
}
