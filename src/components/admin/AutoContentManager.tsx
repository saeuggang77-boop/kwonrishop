"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { toast } from "@/lib/toast";

interface Config {
  enabled: boolean;
  autoCommentEnabled: boolean;
  postsPerDay: number;
  commentsPerPostMin: number;
  commentsPerPostMax: number;
  authorReplyRateMin: number;
  authorReplyRateMax: number;
  activeStartHour: number;
  activeEndHour: number;
  realPostAutoReply: boolean;
  seoKeywords: string[];
  categoryWeights: Record<string, number>;
}

interface PoolStat {
  type: "POST" | "COMMENT" | "REPLY";
  total: number;
  used: number;
  remaining: number;
}

interface GhostStat {
  personality: string;
  count: number;
}

interface GhostUser {
  id: string;
  name: string;
  ghostPersonality: string | null;
}

interface PoolItem {
  id: string;
  title: string | null;
  content: string;
  personality: string;
  category: string;
  createdAt: string;
}

interface Stats {
  poolStats: PoolStat[];
  ghostStats: GhostStat[];
  totalGhostUsers: number;
  ghostUsers: GhostUser[];
  todayActivity: {
    posts: number;
    comments: number;
    replies: number;
  };
}

const TYPE_LABELS = {
  POST: "게시글",
  COMMENT: "댓글",
  REPLY: "답글",
};

const PERSONALITY_LABELS: Record<string, string> = {
  CHATTY: "수다쟁이",
  ADVISOR: "조언자",
  QUESTIONER: "질문형",
  EMOJI_LOVER: "이모지러버",
  CALM: "차분형",
  SASSY: "당돌형",
  CUSTOM: "직접작성",
};

const CATEGORY_OPTIONS = [
  { key: "STARTUP", label: "창업이야기" },
  { key: "PROPERTY", label: "상가/매물" },
  { key: "FRANCHISE_TALK", label: "프랜차이즈" },
  { key: "TIPS", label: "경영팁" },
  { key: "FREE", label: "자유수다" },
];

export default function AutoContentManager() {
  const [config, setConfig] = useState<Config>({
    enabled: false,
    autoCommentEnabled: true,
    postsPerDay: 8,
    commentsPerPostMin: 2,
    commentsPerPostMax: 10,
    authorReplyRateMin: 20,
    authorReplyRateMax: 60,
    activeStartHour: 0,
    activeEndHour: 0,
    realPostAutoReply: false,
    seoKeywords: [],
    categoryWeights: { STARTUP: 25, PROPERTY: 25, FRANCHISE_TALK: 20, TIPS: 20, FREE: 10 },
  });
  const [stats, setStats] = useState<Stats>({
    poolStats: [],
    ghostStats: [],
    totalGhostUsers: 0,
    ghostUsers: [],
    todayActivity: { posts: 0, comments: 0, replies: 0 },
  });
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState<string | null>(null);
  const [creatingGhosts, setCreatingGhosts] = useState(false);
  const [showGhostList, setShowGhostList] = useState(false);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const [showPoolItems, setShowPoolItems] = useState(false);
  const [poolItems, setPoolItems] = useState<PoolItem[]>([]);
  const [loadingPoolItems, setLoadingPoolItems] = useState(false);
  const [expandedPoolItemId, setExpandedPoolItemId] = useState<string | null>(null);
  const [selectedPoolIds, setSelectedPoolIds] = useState<Set<string>>(new Set());
  const [deletingSelected, setDeletingSelected] = useState(false);
  const [selectedGhostIds, setSelectedGhostIds] = useState<Set<string>>(new Set());
  const [deletingSelectedGhosts, setDeletingSelectedGhosts] = useState(false);
  const [editItem, setEditItem] = useState<{id: string; title: string; content: string; category: string} | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [createForm, setCreateForm] = useState({ title: "", content: "", category: "STARTUP" });
  const [recentlyGeneratedAfter, setRecentlyGeneratedAfter] = useState<string | null>(null);
  const [filterRecentOnly, setFilterRecentOnly] = useState(false);

  // 초기 데이터 로드
  useEffect(() => {
    loadConfig();
    loadStats();
  }, []);

  const loadConfig = async () => {
    try {
      const res = await fetch("/api/admin/auto-content/config");
      if (res.ok) {
        const data = await res.json();
        setConfig({
          ...data,
          seoKeywords: data.seoKeywords || [],
          categoryWeights: data.categoryWeights || { STARTUP: 25, PROPERTY: 25, FRANCHISE_TALK: 20, TIPS: 20, FREE: 10 },
        });
      }
    } catch (error) {
      console.error("Config load error:", error);
    }
  };

  const loadStats = async () => {
    try {
      const res = await fetch("/api/admin/auto-content/stats");
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (error) {
      console.error("Stats load error:", error);
    }
  };

  const refreshStats = async () => {
    try {
      const res = await fetch("/api/admin/auto-content/stats");
      if (res.ok) {
        const data = await res.json();
        setStats(prev => ({ ...prev, ...data }));
      }
    } catch (error) {
      console.error("Stats refresh error:", error);
    }
  };

  const handleSaveConfig = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/admin/auto-content/config", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config),
      });

      if (res.ok) {
        toast.success("설정이 저장되었습니다");
      } else {
        const data = await res.json();
        toast.error(data.error || "설정 저장에 실패했습니다");
      }
    } catch (error) {
      toast.error("설정 저장 중 오류가 발생했습니다");
    } finally {
      setSaving(false);
    }
  };

  const handleGenerate = async (type: "POST" | "COMMENT" | "REPLY") => {
    setGenerating(type);
    try {
      const res = await fetch("/api/admin/auto-content/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, count: 30 }),
      });

      if (res.ok) {
        const data = await res.json();
        toast.success(data.message);
        await refreshStats();
        if (data.generatedAfter) {
          setRecentlyGeneratedAfter(data.generatedAfter);
          setFilterRecentOnly(true);
          setShowPoolItems(true);
          await loadPoolItems();
        }
      } else {
        const data = await res.json();
        toast.error(data.error || "생성에 실패했습니다");
      }
    } catch (error) {
      toast.error("생성 중 오류가 발생했습니다");
    } finally {
      setGenerating(null);
    }
  };

  const handleCreateGhosts = async () => {
    setCreatingGhosts(true);
    try {
      const res = await fetch("/api/admin/auto-content/ghost-users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ count: 10 }),
      });

      if (res.ok) {
        const data = await res.json();
        toast.success(data.message);
        await refreshGhostUsers();
        await refreshStats();
      } else {
        const data = await res.json();
        toast.error(data.error || "생성에 실패했습니다");
      }
    } catch (error) {
      toast.error("생성 중 오류가 발생했습니다");
    } finally {
      setCreatingGhosts(false);
    }
  };

  const refreshGhostUsers = async () => {
    try {
      const res = await fetch("/api/admin/auto-content/ghost-users");
      if (res.ok) {
        const data = await res.json();
        setStats(prev => ({ ...prev, ghostUsers: data.ghostUsers }));
      }
    } catch (error) {
      console.error("Ghost users refresh error:", error);
    }
  };

  const handleStartEdit = (user: GhostUser) => {
    setEditingUserId(user.id);
    setEditingName(user.name);
  };

  const handleCancelEdit = () => {
    setEditingUserId(null);
    setEditingName("");
  };

  const handleSaveEdit = async (userId: string) => {
    if (!editingName.trim()) {
      toast.error("닉네임을 입력해주세요");
      return;
    }

    try {
      const res = await fetch("/api/admin/auto-content/ghost-users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: userId, name: editingName.trim() }),
      });

      if (res.ok) {
        toast.success("닉네임이 수정되었습니다");
        await refreshGhostUsers();
        handleCancelEdit();
      } else {
        const data = await res.json();
        toast.error(data.error || "수정에 실패했습니다");
      }
    } catch (error) {
      toast.error("수정 중 오류가 발생했습니다");
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm("이 유령회원을 삭제하시겠습니까?")) {
      return;
    }

    try {
      const res = await fetch(`/api/admin/auto-content/ghost-users?id=${userId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        toast.success("유령회원이 삭제되었습니다");
        await refreshGhostUsers();
        await refreshStats();
      } else {
        const data = await res.json();
        toast.error(data.error || "삭제에 실패했습니다");
      }
    } catch (error) {
      toast.error("삭제 중 오류가 발생했습니다");
    }
  };

  const handleDeleteSelectedGhosts = async () => {
    if (selectedGhostIds.size === 0) return;
    if (!confirm(`선택한 ${selectedGhostIds.size}명의 유령회원을 삭제하시겠습니까?`)) return;

    setDeletingSelectedGhosts(true);
    try {
      const res = await fetch("/api/admin/auto-content/ghost-users", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: Array.from(selectedGhostIds) }),
      });

      if (res.ok) {
        toast.success(`${selectedGhostIds.size}명의 유령회원이 삭제되었습니다`);
        setSelectedGhostIds(new Set());
        await refreshGhostUsers();
        await refreshStats();
      } else {
        const data = await res.json();
        toast.error(data.error || "삭제에 실패했습니다");
      }
    } catch (error) {
      toast.error("삭제 중 오류가 발생했습니다");
    } finally {
      setDeletingSelectedGhosts(false);
    }
  };

  const toggleGhostSelect = (userId: string) => {
    setSelectedGhostIds(prev => {
      const next = new Set(prev);
      if (next.has(userId)) next.delete(userId);
      else next.add(userId);
      return next;
    });
  };

  const toggleSelectAllGhosts = () => {
    if (selectedGhostIds.size === stats.ghostUsers.length) {
      setSelectedGhostIds(new Set());
    } else {
      setSelectedGhostIds(new Set(stats.ghostUsers.map(u => u.id)));
    }
  };

  const loadPoolItems = async () => {
    setLoadingPoolItems(true);
    try {
      const res = await fetch("/api/admin/auto-content/pool");
      if (res.ok) {
        const data = await res.json();
        setPoolItems(data.poolItems);
      } else {
        toast.error("원고 목록 조회 실패");
      }
    } catch (error) {
      toast.error("원고 목록 조회 중 오류 발생");
    } finally {
      setLoadingPoolItems(false);
    }
  };

  const handleEditItem = async () => {
    if (!editItem) return;
    try {
      const res = await fetch("/api/admin/auto-content/pool", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editItem),
      });
      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error || "수정 실패");
        return;
      }
      toast.success("원고가 수정되었습니다");
      setEditItem(null);
      await loadPoolItems();
    } catch (error) {
      toast.error("수정 중 오류가 발생했습니다");
    }
  };

  const handleCreateItem = async () => {
    if (!createForm.title.trim() || !createForm.content.trim()) {
      toast.error("제목과 내용을 입력해주세요");
      return;
    }
    try {
      const res = await fetch("/api/admin/auto-content/pool", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(createForm),
      });
      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error || "추가 실패");
        return;
      }
      toast.success("원고가 추가되었습니다");
      setCreateForm({ title: "", content: "", category: "STARTUP" });
      setShowCreateForm(false);
      await loadPoolItems();
      await refreshStats();
    } catch (error) {
      toast.error("추가 중 오류가 발생했습니다");
    }
  };

  const handleTogglePoolItems = async () => {
    if (!showPoolItems) {
      await loadPoolItems();
    }
    setShowPoolItems(!showPoolItems);
  };

  const handleDeletePoolItem = async (itemId: string) => {
    if (!confirm("이 원고를 삭제하시겠습니까?")) {
      return;
    }

    try {
      const res = await fetch("/api/admin/auto-content/pool", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: [itemId] }),
      });

      if (res.ok) {
        toast.success("원고가 삭제되었습니다");
        setPoolItems(poolItems.filter(item => item.id !== itemId));
        await refreshStats();
      } else {
        const data = await res.json();
        toast.error(data.error || "삭제에 실패했습니다");
      }
    } catch (error) {
      toast.error("삭제 중 오류가 발생했습니다");
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedPoolIds.size === 0) return;
    if (!confirm(`선택한 ${selectedPoolIds.size}개의 원고를 삭제하시겠습니까?`)) return;

    setDeletingSelected(true);
    try {
      const res = await fetch("/api/admin/auto-content/pool", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: Array.from(selectedPoolIds) }),
      });

      if (res.ok) {
        toast.success(`${selectedPoolIds.size}개의 원고가 삭제되었습니다`);
        setPoolItems(poolItems.filter(item => !selectedPoolIds.has(item.id)));
        setSelectedPoolIds(new Set());
        await refreshStats();
      } else {
        const data = await res.json();
        toast.error(data.error || "삭제에 실패했습니다");
      }
    } catch (error) {
      toast.error("삭제 중 오류가 발생했습니다");
    } finally {
      setDeletingSelected(false);
    }
  };

  const togglePoolItemSelect = (itemId: string) => {
    setSelectedPoolIds(prev => {
      const next = new Set(prev);
      if (next.has(itemId)) next.delete(itemId);
      else next.add(itemId);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedPoolIds.size === poolItems.length) {
      setSelectedPoolIds(new Set());
    } else {
      setSelectedPoolIds(new Set(poolItems.map(item => item.id)));
    }
  };

  return (
    <div className="space-y-6">
      {/* Edit Modal */}
      {editItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-2xl rounded-xl bg-white p-6 shadow-xl">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">원고 수정</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">제목</label>
                <input
                  type="text"
                  value={editItem.title}
                  onChange={(e) => setEditItem({ ...editItem, title: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="제목을 입력하세요"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">내용</label>
                <textarea
                  value={editItem.content}
                  onChange={(e) => setEditItem({ ...editItem, content: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 min-h-[150px] focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="내용을 입력하세요"
                  rows={6}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">카테고리</label>
                <select
                  value={editItem.category}
                  onChange={(e) => setEditItem({ ...editItem, category: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  {CATEGORY_OPTIONS.map((cat) => (
                    <option key={cat.key} value={cat.key}>
                      {cat.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  onClick={() => setEditItem(null)}
                  className="border border-gray-300 rounded-lg hover:bg-gray-50 px-4 py-2"
                >
                  취소
                </button>
                <button
                  onClick={handleEditItem}
                  className="bg-blue-600 text-white rounded-lg hover:bg-blue-700 px-4 py-2"
                >
                  저장
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create Modal */}
      {showCreateForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-2xl rounded-xl bg-white p-6 shadow-xl">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">원고 추가</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">제목</label>
                <input
                  type="text"
                  value={createForm.title}
                  onChange={(e) => setCreateForm({ ...createForm, title: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="제목을 입력하세요"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">내용</label>
                <textarea
                  value={createForm.content}
                  onChange={(e) => setCreateForm({ ...createForm, content: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 min-h-[150px] focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="내용을 입력하세요"
                  rows={6}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">카테고리</label>
                <select
                  value={createForm.category}
                  onChange={(e) => setCreateForm({ ...createForm, category: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  {CATEGORY_OPTIONS.map((cat) => (
                    <option key={cat.key} value={cat.key}>
                      {cat.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  onClick={() => {
                    setShowCreateForm(false);
                    setCreateForm({ title: "", content: "", category: "STARTUP" });
                  }}
                  className="border border-gray-300 rounded-lg hover:bg-gray-50 px-4 py-2"
                >
                  취소
                </button>
                <button
                  onClick={handleCreateItem}
                  className="bg-blue-600 text-white rounded-lg hover:bg-blue-700 px-4 py-2"
                >
                  추가
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 섹션 1: 시스템 설정 */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-1">시스템 설정</h2>
        <p className="text-sm text-gray-500 mb-6">자동 콘텐츠 생성 시스템 제어</p>

        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <label className="text-base font-medium text-gray-900">시스템 활성화</label>
              <p className="text-sm text-gray-500">자동 콘텐츠 생성 ON/OFF</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={config.enabled}
                onChange={(e) => setConfig({ ...config, enabled: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <label className="text-base font-medium text-gray-900">자동 댓글 활성화</label>
              <p className="text-sm text-gray-500">OFF 시 게시글만 발행되고 댓글/답글은 생성되지 않습니다</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={config.autoCommentEnabled}
                onChange={(e) => setConfig({ ...config, autoCommentEnabled: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          <div className="rounded-md bg-blue-50 border border-blue-200 p-3 text-xs text-gray-700 space-y-1">
            <p>게시글마다 총 대화 수(댓글+글쓴이 답글)가 최소~최대 범위 내에서 랜덤 결정됩니다.</p>
            <p>글쓴이가 설정된 비율만큼 답글에 참여하여 자연스러운 대화를 형성합니다.</p>
            <p>요일별 자동 변동: 금·토 +20~30% | 월·화 -10~20% | 수·목·일 ±10%</p>
            <p>예시: 게시글 8개 × 대화 2~10개 = 하루 약 48개 (게시글별 편중 적용)</p>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">일일 게시글 수 (기준값)</label>
              <input
                type="number"
                min="0"
                max="100"
                value={config.postsPerDay}
                onChange={(e) => setConfig({ ...config, postsPerDay: parseInt(e.target.value) || 0 })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">게시글당 대화 수 (최소~최대)</label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="0"
                  max="20"
                  value={config.commentsPerPostMin}
                  onChange={(e) => setConfig({ ...config, commentsPerPostMin: parseInt(e.target.value) || 0 })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="최소"
                />
                <span className="text-gray-500">~</span>
                <input
                  type="number"
                  min="0"
                  max="20"
                  value={config.commentsPerPostMax}
                  onChange={(e) => setConfig({ ...config, commentsPerPostMax: parseInt(e.target.value) || 0 })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="최대"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">글쓴이 답글 비율 (최소~최대 %)</label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={config.authorReplyRateMin}
                  onChange={(e) => setConfig({ ...config, authorReplyRateMin: parseInt(e.target.value) || 0 })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="최소"
                />
                <span className="text-gray-500">~</span>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={config.authorReplyRateMax}
                  onChange={(e) => setConfig({ ...config, authorReplyRateMax: parseInt(e.target.value) || 0 })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="최대"
                />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-base font-medium text-gray-900">24시간 운영</label>
                <p className="text-sm text-gray-500">시간 제한 없이 하루 종일 콘텐츠 생성</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.activeStartHour === config.activeEndHour}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setConfig({ ...config, activeStartHour: 0, activeEndHour: 0 });
                    } else {
                      setConfig({ ...config, activeStartHour: 14, activeEndHour: 4 });
                    }
                  }}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
            {config.activeStartHour !== config.activeEndHour && (
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">활동 시작 시간</label>
                  <select
                    value={config.activeStartHour}
                    onChange={(e) => setConfig({ ...config, activeStartHour: parseInt(e.target.value) })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    {Array.from({ length: 24 }, (_, i) => (
                      <option key={i} value={i}>{i}시</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">활동 종료 시간</label>
                  <select
                    value={config.activeEndHour}
                    onChange={(e) => setConfig({ ...config, activeEndHour: parseInt(e.target.value) })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    {Array.from({ length: 24 }, (_, i) => (
                      <option key={i} value={i}>{i}시</option>
                    ))}
                  </select>
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between">
            <div>
              <label className="text-base font-medium text-gray-900">실제 유저 글 자동 댓글</label>
              <p className="text-sm text-gray-500">실제 유저가 작성한 글에도 자동 댓글 작성</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={config.realPostAutoReply}
                onChange={(e) => setConfig({ ...config, realPostAutoReply: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-base font-medium text-gray-900">SEO 키워드 ({config.seoKeywords.length}개)</label>
                <p className="text-sm text-gray-500">자동 생성 콘텐츠에 포함할 키워드</p>
              </div>
              <Link href="/admin/auto-content/keywords">
                <button className="border border-gray-300 rounded-lg hover:bg-gray-50 px-4 py-2 text-sm flex items-center gap-1">
                  키워드 관리
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </button>
              </Link>
            </div>
            {config.seoKeywords.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {config.seoKeywords.slice(0, 10).map((keyword) => (
                  <span key={keyword} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    {keyword}
                  </span>
                ))}
                {config.seoKeywords.length > 10 && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                    +{config.seoKeywords.length - 10}개 더
                  </span>
                )}
              </div>
            )}
          </div>

          <button
            onClick={handleSaveConfig}
            disabled={saving}
            className="bg-blue-600 text-white rounded-lg hover:bg-blue-700 px-4 py-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? "저장 중..." : "저장"}
          </button>
        </div>
      </div>

      {/* 섹션 2: 콘텐츠 풀 현황 */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-1">콘텐츠 풀 현황</h2>
        <p className="text-sm text-gray-500 mb-6">AI가 생성한 콘텐츠 재고 관리</p>

        <div className="mb-6 space-y-3">
          <label className="block text-base font-medium text-gray-900">카테고리 비율</label>
          <p className="text-sm text-gray-500">자동 생성 게시글의 카테고리 분배 비율</p>
          <div className="grid gap-3 sm:grid-cols-2">
            {CATEGORY_OPTIONS.map((cat) => (
              <div key={cat.key} className="flex items-center gap-2">
                <label className="w-24 shrink-0 text-sm text-gray-700">{cat.label}</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="5"
                  value={config.categoryWeights[cat.key] ?? 0}
                  onChange={(e) => {
                    const val = parseInt(e.target.value) || 0;
                    setConfig({
                      ...config,
                      categoryWeights: { ...config.categoryWeights, [cat.key]: val },
                    });
                  }}
                  className="w-20 border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <span className="text-xs text-gray-500">%</span>
              </div>
            ))}
          </div>
          <div className="flex items-center gap-3">
            <p className="text-xs text-gray-600">
              합계: {Object.values(config.categoryWeights).reduce((a, b) => a + b, 0)}%
              {Object.values(config.categoryWeights).reduce((a, b) => a + b, 0) !== 100 && (
                <span className="text-yellow-600 ml-2">(100%가 아닙니다)</span>
              )}
            </p>
            <button
              onClick={handleSaveConfig}
              disabled={saving}
              className="text-sm border border-gray-300 rounded-lg hover:bg-gray-50 px-3 py-1 disabled:opacity-50"
            >
              {saving ? "저장 중..." : "비율 저장"}
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">타입</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">총 생성</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">사용됨</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">남은 수</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">액션</th>
              </tr>
            </thead>
            <tbody>
              {stats.poolStats.map((stat) => (
                <tr key={stat.type} className="border-b border-gray-100">
                  <td className="py-3 px-4 font-medium text-gray-900">{TYPE_LABELS[stat.type]}</td>
                  <td className="py-3 px-4 text-gray-600">{stat.total}</td>
                  <td className="py-3 px-4 text-gray-600">{stat.used}</td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <span className="text-gray-600">{stat.remaining}</span>
                      {stat.remaining < 20 && stat.type === "POST" && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                          부족
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    {stat.type === "POST" ? (
                      <button
                        onClick={() => handleGenerate(stat.type)}
                        disabled={generating === stat.type}
                        className="text-sm border border-gray-300 rounded-lg hover:bg-gray-50 px-3 py-1 disabled:opacity-50"
                      >
                        {generating === stat.type ? "생성 중..." : "더 생성하기 (30개)"}
                      </button>
                    ) : (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-600">
                        실시간 생성
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-4 flex items-center gap-2 flex-wrap">
          <button
            onClick={handleTogglePoolItems}
            disabled={loadingPoolItems}
            className="text-sm border border-gray-300 rounded-lg hover:bg-gray-50 px-4 py-2 flex items-center gap-2"
          >
            {loadingPoolItems ? "로딩 중..." : showPoolItems ? "원고 목록 숨기기" : "원고 목록 보기"}
            <svg className={`w-4 h-4 transition-transform ${showPoolItems ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          {showPoolItems && recentlyGeneratedAfter && (
            <button
              onClick={() => setFilterRecentOnly(!filterRecentOnly)}
              className={`text-sm rounded-lg px-4 py-2 ${filterRecentOnly ? "bg-blue-600 text-white hover:bg-blue-700" : "border border-gray-300 hover:bg-gray-50"}`}
            >
              방금 생성 ({poolItems.filter(item => new Date(item.createdAt) >= new Date(recentlyGeneratedAfter)).length})
            </button>
          )}
          {showPoolItems && (
            <button
              onClick={() => setShowCreateForm(true)}
              className="text-sm border border-gray-300 rounded-lg hover:bg-gray-50 px-4 py-2"
            >
              원고 추가
            </button>
          )}
          {showPoolItems && selectedPoolIds.size > 0 && (
            <button
              onClick={handleDeleteSelected}
              disabled={deletingSelected}
              className="text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 px-4 py-2 disabled:opacity-50"
            >
              {deletingSelected ? "삭제 중..." : `선택 삭제 (${selectedPoolIds.size}개)`}
            </button>
          )}
        </div>

        {showPoolItems && (
          <div className="mt-4 rounded-lg border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="w-10 px-4 py-3">
                      <input
                        type="checkbox"
                        checked={poolItems.length > 0 && selectedPoolIds.size === poolItems.length}
                        onChange={toggleSelectAll}
                        className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                    </th>
                    <th className="text-left px-4 py-3 text-sm font-medium text-gray-700">제목</th>
                    <th className="text-left px-4 py-3 text-sm font-medium text-gray-700">카테고리</th>
                    <th className="text-left px-4 py-3 text-sm font-medium text-gray-700">내용</th>
                    <th className="text-left px-4 py-3 text-sm font-medium text-gray-700">성격유형</th>
                    <th className="text-right px-4 py-3 text-sm font-medium text-gray-700">액션</th>
                  </tr>
                </thead>
                <tbody>
                  {poolItems.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-8 text-sm text-gray-500">
                        미사용 원고가 없습니다
                      </td>
                    </tr>
                  ) : (
                    (filterRecentOnly && recentlyGeneratedAfter
                      ? poolItems.filter(item => new Date(item.createdAt) >= new Date(recentlyGeneratedAfter))
                      : poolItems
                    ).map((item) => (
                      <tr
                        key={item.id}
                        className={`border-t border-gray-100 cursor-pointer hover:bg-gray-50 ${selectedPoolIds.has(item.id) ? "bg-blue-50" : ""}`}
                        onClick={() => setExpandedPoolItemId(expandedPoolItemId === item.id ? null : item.id)}
                      >
                        <td className="w-10 px-4 py-3" onClick={(e) => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            checked={selectedPoolIds.has(item.id)}
                            onChange={() => togglePoolItemSelect(item.id)}
                            className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                        </td>
                        <td className="px-4 py-3 max-w-[200px]">
                          <div className="flex items-center gap-1">
                            <svg className={`w-3 h-3 text-gray-400 transition-transform ${expandedPoolItemId === item.id ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                            {recentlyGeneratedAfter && new Date(item.createdAt) >= new Date(recentlyGeneratedAfter) && (
                              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-blue-600 text-white animate-pulse">NEW</span>
                            )}
                            <span className="truncate font-medium text-gray-900">{item.title || "제목 없음"}</span>
                          </div>
                          {expandedPoolItemId === item.id && (
                            <div className="mt-3 whitespace-pre-wrap text-sm text-gray-700 border-t border-gray-200 pt-3">
                              {item.content}
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                            {CATEGORY_OPTIONS.find(c => c.key === item.category)?.label || item.category}
                          </span>
                        </td>
                        <td className="px-4 py-3 max-w-[300px]">
                          {expandedPoolItemId !== item.id && (
                            <div className="line-clamp-2 text-sm text-gray-600">
                              {item.content}
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                            {PERSONALITY_LABELS[item.personality] || item.personality}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditItem({
                                  id: item.id,
                                  title: item.title || "",
                                  content: item.content,
                                  category: item.category,
                                });
                              }}
                              className="p-2 text-gray-400 hover:text-blue-600 rounded"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeletePoolItem(item.id);
                              }}
                              className="p-2 text-gray-400 hover:text-red-600 rounded"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* 섹션 3: 유령회원 현황 */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-1">유령회원 현황</h2>
        <p className="text-sm text-gray-500 mb-6">자동 콘텐츠를 작성하는 가상 회원 (총 {stats.totalGhostUsers}명)</p>

        <div className="overflow-x-auto mb-4">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">성격 유형</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">회원 수</th>
              </tr>
            </thead>
            <tbody>
              {stats.ghostStats.map((stat) => (
                <tr key={stat.personality} className="border-b border-gray-100">
                  <td className="py-3 px-4 font-medium text-gray-900">
                    {PERSONALITY_LABELS[stat.personality] || stat.personality}
                  </td>
                  <td className="py-3 px-4 text-gray-600">{stat.count}명</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleCreateGhosts}
            disabled={creatingGhosts}
            className="border border-gray-300 rounded-lg hover:bg-gray-50 px-4 py-2 disabled:opacity-50"
          >
            {creatingGhosts ? "생성 중..." : "추가 생성 (10명)"}
          </button>

          <button
            onClick={() => setShowGhostList(!showGhostList)}
            className="text-sm border border-gray-300 rounded-lg hover:bg-gray-50 px-4 py-2 flex items-center gap-2"
          >
            {showGhostList ? "회원 목록 숨기기" : "회원 목록 보기"}
            <svg className={`w-4 h-4 transition-transform ${showGhostList ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {showGhostList && selectedGhostIds.size > 0 && (
            <button
              onClick={handleDeleteSelectedGhosts}
              disabled={deletingSelectedGhosts}
              className="text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 px-4 py-2 disabled:opacity-50"
            >
              {deletingSelectedGhosts ? "삭제 중..." : `선택 삭제 (${selectedGhostIds.size}명)`}
            </button>
          )}
        </div>

        {showGhostList && (
          <div className="mt-4 rounded-lg border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="w-10 px-4 py-3">
                      <input
                        type="checkbox"
                        checked={stats.ghostUsers.length > 0 && selectedGhostIds.size === stats.ghostUsers.length}
                        onChange={toggleSelectAllGhosts}
                        className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                    </th>
                    <th className="text-left px-4 py-3 text-sm font-medium text-gray-700">닉네임</th>
                    <th className="text-left px-4 py-3 text-sm font-medium text-gray-700">성격유형</th>
                    <th className="text-right px-4 py-3 text-sm font-medium text-gray-700">액션</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.ghostUsers.map((user) => (
                    <tr key={user.id} className={`border-t border-gray-100 ${selectedGhostIds.has(user.id) ? "bg-blue-50" : ""}`}>
                      <td className="w-10 px-4 py-3">
                        <input
                          type="checkbox"
                          checked={selectedGhostIds.has(user.id)}
                          onChange={() => toggleGhostSelect(user.id)}
                          className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                      </td>
                      <td className="px-4 py-3">
                        {editingUserId === user.id ? (
                          <div className="flex items-center gap-2">
                            <input
                              type="text"
                              value={editingName}
                              onChange={(e) => setEditingName(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                  handleSaveEdit(user.id);
                                } else if (e.key === "Escape") {
                                  handleCancelEdit();
                                }
                              }}
                              className="h-8 border border-gray-300 rounded px-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              autoFocus
                            />
                            <button
                              onClick={() => handleSaveEdit(user.id)}
                              className="p-1 text-green-600 hover:bg-green-50 rounded"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                            </button>
                            <button
                              onClick={handleCancelEdit}
                              className="p-1 text-red-600 hover:bg-red-50 rounded"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => handleStartEdit(user)}
                            className="flex items-center gap-2 text-gray-900 hover:text-blue-600 transition-colors"
                          >
                            {user.name}
                            <svg className="w-3 h-3 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                          {PERSONALITY_LABELS[user.ghostPersonality || ""] || user.ghostPersonality}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => handleDeleteUser(user.id)}
                          className="p-2 text-gray-400 hover:text-red-600 rounded"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* 섹션 4: 오늘의 활동 */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-1">오늘의 활동</h2>
        <p className="text-sm text-gray-500 mb-6">오늘 자동 생성된 콘텐츠 통계</p>

        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
            <div className="text-sm text-gray-600">게시글</div>
            <div className="mt-2 text-2xl font-bold text-blue-600">
              {stats.todayActivity.posts}
            </div>
          </div>
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
            <div className="text-sm text-gray-600">댓글</div>
            <div className="mt-2 text-2xl font-bold text-blue-600">
              {stats.todayActivity.comments}
            </div>
          </div>
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
            <div className="text-sm text-gray-600">답글</div>
            <div className="mt-2 text-2xl font-bold text-blue-600">
              {stats.todayActivity.replies}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
