"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { toast } from "@/lib/toast";

const PAGE_SIZE = 50;

interface ParsedKeyword {
  keyword: string;
  count: number | null;
  percent: string | null;
}

/**
 * 네이버 카페 통계 형식 파싱
 * "상가직거래381.94%" → { keyword: "상가직거래", count: 38, percent: "1.94%" }
 */
function parseNaverStats(text: string): ParsedKeyword[] {
  const lines = text.split(/[\n\r]+/).filter((l) => l.trim().length > 0);
  const results: ParsedKeyword[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    const match = trimmed.match(/^(.+?)(\d+)(\d+\.\d{2}%)$/);
    if (match) {
      results.push({
        keyword: match[1].trim(),
        count: parseInt(match[2]),
        percent: match[3],
      });
    } else {
      const clean = trimmed.replace(/[\d.%]+$/g, "").trim();
      if (clean.length > 0) {
        results.push({ keyword: clean, count: null, percent: null });
      }
    }
  }

  return results;
}

export default function KeywordManager() {
  const [keywords, setKeywords] = useState<string[]>([]);
  const [usage, setUsage] = useState<Record<string, number>>({});
  const [keywordInput, setKeywordInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const [sortMode, setSortMode] = useState<"name" | "most" | "least">("name");
  const [pastePreview, setPastePreview] = useState<ParsedKeyword[]>([]);
  const [pasteSelected, setPasteSelected] = useState<Set<string>>(new Set());
  const [showPastePreview, setShowPastePreview] = useState(false);
  const [loading, setLoading] = useState(true);

  // 초기 로드
  useEffect(() => {
    loadKeywords();
  }, []);

  const loadKeywords = async () => {
    try {
      const res = await fetch("/api/admin/auto-content/config");
      if (res.ok) {
        const data = await res.json();
        setKeywords(data.seoKeywords || []);
        setUsage(data.seoKeywordUsage || {});
      }
    } catch (error) {
      console.error("Keywords load error:", error);
    } finally {
      setLoading(false);
    }
  };

  const filtered = searchQuery
    ? keywords.filter((k) => k.includes(searchQuery))
    : keywords;

  const sorted = [...filtered].sort((a, b) => {
    if (sortMode === "most") return (usage[b] || 0) - (usage[a] || 0);
    if (sortMode === "least") return (usage[a] || 0) - (usage[b] || 0);
    return a.localeCompare(b);
  });

  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const safePage = Math.min(currentPage, totalPages);
  const pageKeywords = sorted.slice(
    (safePage - 1) * PAGE_SIZE,
    safePage * PAGE_SIZE
  );

  const allPageSelected =
    pageKeywords.length > 0 && pageKeywords.every((k) => selected.has(k));

  const saveKeywords = async (newKeywords: string[]) => {
    setSaving(true);
    try {
      const res = await fetch("/api/admin/auto-content/config", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ seoKeywords: newKeywords }),
      });
      if (!res.ok) throw new Error("저장 실패");
      setKeywords(newKeywords);
    } catch {
      toast.error("키워드 저장에 실패했습니다");
      throw new Error("save failed");
    } finally {
      setSaving(false);
    }
  };

  const handleAddKeyword = async () => {
    const keyword = keywordInput.trim();
    if (!keyword) return;
    if (keywords.includes(keyword)) {
      toast.error("이미 등록된 키워드입니다");
      return;
    }
    try {
      await saveKeywords([...keywords, keyword]);
      setKeywordInput("");
      toast.success("키워드가 추가되었습니다");
    } catch {
      // saveKeywords에서 에러 처리됨
    }
  };

  const addKeywords = async (newList: string[]) => {
    const cleaned = newList
      .map((k) => k.trim())
      .filter((k) => k.length > 0 && !keywords.includes(k));
    const unique = [...new Set(cleaned)];

    if (unique.length === 0) {
      toast.error("추가할 새 키워드가 없습니다");
      return;
    }

    try {
      await saveKeywords([...keywords, ...unique]);
      toast.success(`${unique.length}개 키워드가 추가되었습니다`);
    } catch {
      // saveKeywords에서 에러 처리됨
    }
  };

  const extractAndAddKeywords = async (texts: string[]) => {
    const cleaned = texts.map((t) => t.trim()).filter((t) => t.length > 0);
    if (cleaned.length === 0) {
      toast.error("추출할 텍스트가 없습니다");
      return;
    }

    setExtracting(true);
    try {
      const res = await fetch("/api/admin/auto-content/extract-keywords", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ texts: cleaned }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      await addKeywords(data.keywords);
    } catch (err) {
      toast.error(
        `키워드 추출 실패: ${err instanceof Error ? err.message : "알 수 없는 오류"}`
      );
    } finally {
      setExtracting(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const ext = file.name.split(".").pop()?.toLowerCase();

    if (ext === "txt" || ext === "csv") {
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        if (!text) return;
        const texts = text.split(/[\n\r,\t]+/);
        extractAndAddKeywords(texts);
      };
      reader.readAsText(file);
    } else {
      toast.error("지원하지 않는 파일 형식입니다 (.txt, .csv만 지원)");
    }
    e.target.value = "";
  };

  const handleDownload = () => {
    const blob = new Blob([keywords.join("\n")], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "seo-keywords.txt";
    a.click();
    URL.revokeObjectURL(url);
  };

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (!text.trim()) {
        toast.error("클립보드가 비어있습니다");
        return;
      }

      const parsed = parseNaverStats(text);
      if (parsed.length === 0) {
        toast.error("파싱 가능한 키워드가 없습니다");
        return;
      }

      const newOnly = parsed.filter((p) => !keywords.includes(p.keyword));
      if (newOnly.length === 0) {
        toast.error("모든 키워드가 이미 등록되어 있습니다");
        return;
      }

      setPastePreview(newOnly);
      setPasteSelected(new Set(newOnly.map((p) => p.keyword)));
      setShowPastePreview(true);
    } catch {
      toast.error("클립보드 접근 권한이 필요합니다");
    }
  };

  const togglePasteSelect = (keyword: string) => {
    const next = new Set(pasteSelected);
    if (next.has(keyword)) next.delete(keyword);
    else next.add(keyword);
    setPasteSelected(next);
  };

  const togglePasteSelectAll = () => {
    if (pasteSelected.size === pastePreview.length) {
      setPasteSelected(new Set());
    } else {
      setPasteSelected(new Set(pastePreview.map((p) => p.keyword)));
    }
  };

  const handlePasteConfirm = async () => {
    const selectedKeywords = [...pasteSelected];
    if (selectedKeywords.length === 0) {
      toast.error("선택된 키워드가 없습니다");
      return;
    }

    try {
      await addKeywords(selectedKeywords);
      setShowPastePreview(false);
      setPastePreview([]);
      setPasteSelected(new Set());
    } catch {
      // addKeywords에서 에러 처리됨
    }
  };

  const toggleSelect = (keyword: string) => {
    const next = new Set(selected);
    if (next.has(keyword)) next.delete(keyword);
    else next.add(keyword);
    setSelected(next);
  };

  const togglePageAll = () => {
    const next = new Set(selected);
    if (allPageSelected) {
      pageKeywords.forEach((k) => next.delete(k));
    } else {
      pageKeywords.forEach((k) => next.add(k));
    }
    setSelected(next);
  };

  const handleDeleteSelected = async () => {
    if (selected.size === 0) return;
    const remaining = keywords.filter((k) => !selected.has(k));
    try {
      await saveKeywords(remaining);
      setSelected(new Set());
      toast.success(
        `${keywords.length - remaining.length}개 키워드가 삭제되었습니다`
      );
    } catch {
      // saveKeywords에서 에러 처리됨
    }
  };

  const handleDeleteSingle = async (keyword: string) => {
    const remaining = keywords.filter((k) => k !== keyword);
    try {
      await saveKeywords(remaining);
      const next = new Set(selected);
      next.delete(keyword);
      setSelected(next);
    } catch {
      // saveKeywords에서 에러 처리됨
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-400">로딩 중...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-center gap-4">
        <Link href="/admin/auto-content">
          <button className="text-gray-600 hover:text-gray-900 flex items-center gap-1 text-sm">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            돌아가기
          </button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">SEO 키워드 관리</h1>
          <p className="text-sm text-gray-500">총 {keywords.length}개 등록됨</p>
        </div>
      </div>

      {/* 키워드 추가 */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-1">키워드 추가</h2>
        <p className="text-sm text-gray-500 mb-4">
          직접 입력, 파일 업로드, 또는 네이버 카페 통계를 붙여넣기하세요
        </p>
        <div className="flex flex-wrap gap-2">
          <input
            type="text"
            value={keywordInput}
            onChange={(e) => setKeywordInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleAddKeyword();
              }
            }}
            placeholder="키워드 입력 후 Enter"
            className="min-w-[200px] flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            disabled={saving}
          />
          <button
            onClick={handleAddKeyword}
            disabled={saving}
            className="border border-gray-300 rounded-lg hover:bg-gray-50 px-4 py-2"
          >
            추가
          </button>
          <button
            onClick={handlePaste}
            disabled={saving}
            className="border border-blue-300 rounded-lg hover:bg-blue-50 text-blue-600 px-4 py-2 flex items-center gap-1"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            붙여넣기
          </button>
          <button
            disabled={extracting}
            onClick={() => document.getElementById("keyword-file-input")?.click()}
            className="border border-gray-300 rounded-lg hover:bg-gray-50 px-4 py-2 flex items-center gap-1"
          >
            {extracting ? (
              <>로딩 중...</>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                파일
              </>
            )}
          </button>
          {keywords.length > 0 && (
            <button
              onClick={handleDownload}
              className="border border-gray-300 rounded-lg hover:bg-gray-50 px-4 py-2 flex items-center gap-1"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              다운로드
            </button>
          )}
          <input
            id="keyword-file-input"
            type="file"
            accept=".txt,.csv"
            onChange={handleFileUpload}
            className="hidden"
          />
        </div>
      </div>

      {/* 붙여넣기 미리보기 */}
      {showPastePreview && (
        <div className="bg-white rounded-xl border border-blue-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-bold text-gray-900">키워드 미리보기</h2>
              <p className="text-sm text-gray-500">
                등록할 키워드를 선택하세요 ({pasteSelected.size}/{pastePreview.length}개 선택)
              </p>
            </div>
            <button
              onClick={() => {
                setShowPastePreview(false);
                setPastePreview([]);
                setPasteSelected(new Set());
              }}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="flex items-center gap-3 mb-4">
            <button
              onClick={togglePasteSelectAll}
              className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-gray-900 transition-colors"
            >
              <input
                type="checkbox"
                checked={pasteSelected.size === pastePreview.length}
                readOnly
                className="w-4 h-4 rounded border-gray-300 text-blue-600"
              />
              전체 선택
            </button>
            <button
              onClick={handlePasteConfirm}
              disabled={saving || pasteSelected.size === 0}
              className="bg-blue-600 text-white rounded-lg hover:bg-blue-700 px-4 py-2 text-sm disabled:opacity-50"
            >
              {saving ? "등록 중..." : `${pasteSelected.size}개 등록`}
            </button>
          </div>

          <div className="max-h-80 overflow-y-auto space-y-1 rounded-md border border-gray-200 p-2">
            {pastePreview.map((item) => (
              <button
                key={item.keyword}
                onClick={() => togglePasteSelect(item.keyword)}
                className={`flex w-full items-center justify-between rounded px-3 py-2 text-left text-sm transition-colors ${
                  pasteSelected.has(item.keyword)
                    ? "bg-blue-50 text-gray-900"
                    : "text-gray-400 line-through"
                }`}
              >
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={pasteSelected.has(item.keyword)}
                    readOnly
                    className="w-4 h-4 rounded border-gray-300 text-blue-600"
                  />
                  <span>{item.keyword}</span>
                </div>
                {item.count !== null && (
                  <span className="shrink-0 text-xs text-gray-500">
                    {item.count}회 · {item.percent}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 키워드 목록 */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
          <div>
            <h2 className="text-xl font-bold text-gray-900">키워드 목록</h2>
            <p className="text-sm text-gray-500">
              {searchQuery
                ? `"${searchQuery}" 검색 결과: ${filtered.length}개`
                : `총 ${keywords.length}개`}
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <div className="flex gap-1">
              <button
                onClick={() => setSortMode("name")}
                className={`px-3 py-1.5 rounded-lg text-sm ${sortMode === "name" ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
              >
                이름순
              </button>
              <button
                onClick={() => setSortMode("most")}
                className={`px-3 py-1.5 rounded-lg text-sm ${sortMode === "most" ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
              >
                많이 사용
              </button>
              <button
                onClick={() => setSortMode("least")}
                className={`px-3 py-1.5 rounded-lg text-sm ${sortMode === "least" ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
              >
                적게 사용
              </button>
            </div>
            <div className="relative w-full sm:w-64">
              <svg className="absolute left-3 top-1/2 w-4 h-4 -translate-y-1/2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder="키워드 검색..."
                className="w-full border border-gray-300 rounded-lg pl-9 pr-9 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              {searchQuery && (
                <button
                  onClick={() => {
                    setSearchQuery("");
                    setCurrentPage(1);
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          </div>
        </div>

        {pageKeywords.length > 0 && (
          <div className="mb-4 flex items-center gap-3">
            <button
              onClick={togglePageAll}
              className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-gray-900 transition-colors"
            >
              <input
                type="checkbox"
                checked={allPageSelected}
                readOnly
                className="w-4 h-4 rounded border-gray-300 text-blue-600"
              />
              전체 선택
            </button>
            {selected.size > 0 && (
              <button
                onClick={handleDeleteSelected}
                disabled={saving}
                className="bg-red-600 text-white rounded-lg hover:bg-red-700 px-3 py-1.5 text-sm flex items-center gap-1 disabled:opacity-50"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                {selected.size}개 삭제
              </button>
            )}
            {saving && (
              <div className="text-sm text-gray-500">저장 중...</div>
            )}
          </div>
        )}

        {pageKeywords.length === 0 ? (
          <p className="py-8 text-center text-sm text-gray-500">
            {searchQuery ? "검색 결과가 없습니다" : "등록된 키워드가 없습니다"}
          </p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {pageKeywords.map((keyword) => (
              <span
                key={keyword}
                onClick={() => toggleSelect(keyword)}
                className={`cursor-pointer select-none inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-colors ${
                  selected.has(keyword)
                    ? "bg-blue-100 border border-blue-300 text-blue-800"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {keyword}
                <span className="text-xs opacity-60">{usage[keyword] || 0}</span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteSingle(keyword);
                  }}
                  className="hover:text-red-600"
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </span>
            ))}
          </div>
        )}

        {totalPages > 1 && (
          <div className="mt-6 flex items-center justify-center gap-4">
            <button
              disabled={safePage <= 1}
              onClick={() => setCurrentPage(safePage - 1)}
              className="border border-gray-300 rounded-lg hover:bg-gray-50 px-3 py-1.5 text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              이전
            </button>
            <span className="text-sm text-gray-600">
              {safePage} / {totalPages}
            </span>
            <button
              disabled={safePage >= totalPages}
              onClick={() => setCurrentPage(safePage + 1)}
              className="border border-gray-300 rounded-lg hover:bg-gray-50 px-3 py-1.5 text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
            >
              다음
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
