"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { MessageSquare, Lock, Trash2, Reply, Loader2 } from "lucide-react";

interface CommentSectionProps {
  listingId: string;
  sellerId: string;
}

interface CommentUser {
  id: string;
  name: string | null;
  image: string | null;
}

interface Comment {
  id: string;
  content: string | null;
  isSecret: boolean;
  isHidden: boolean;
  createdAt: string;
  user: CommentUser;
  replies: Comment[];
}

interface SessionUser {
  id: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
}

function formatRelativeTime(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);
  if (diffMin < 1) return "방금 전";
  if (diffMin < 60) return `${diffMin}분 전`;
  if (diffHour < 24) return `${diffHour}시간 전`;
  if (diffDay < 7) return `${diffDay}일 전`;
  return date.toLocaleDateString("ko-KR");
}

function UserAvatar({ user }: { user: CommentUser }) {
  const initials = user.name ? user.name.charAt(0).toUpperCase() : "?";
  return (
    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-purple-100 text-sm font-semibold text-purple-700">
      {initials}
    </div>
  );
}

export function CommentSection({ listingId }: CommentSectionProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [currentUser, setCurrentUser] = useState<SessionUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Main comment form state
  const [content, setContent] = useState("");
  const [isSecret, setIsSecret] = useState(false);

  // Reply form state
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState("");
  const [replyIsSecret, setReplyIsSecret] = useState(false);

  const fetchComments = useCallback(async () => {
    try {
      const res = await fetch(`/api/listings/${listingId}/comments`);
      if (res.ok) {
        const json = await res.json();
        setComments(json.data ?? []);
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, [listingId]);

  useEffect(() => {
    async function fetchSession() {
      try {
        const res = await fetch("/api/auth/session");
        if (res.ok) {
          const session = await res.json();
          if (session?.user) {
            setCurrentUser(session.user);
          }
        }
      } catch {
        // not logged in
      }
    }

    fetchSession();
    fetchComments();
  }, [fetchComments]);

  const totalCount = comments.reduce(
    (acc, c) => acc + 1 + (c.replies?.length || 0),
    0
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!content.trim() || submitting) return;

    setSubmitting(true);
    try {
      const res = await fetch(`/api/listings/${listingId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: content.trim(), isSecret }),
      });
      if (res.ok) {
        setContent("");
        setIsSecret(false);
        await fetchComments();
      }
    } catch {
      // silently fail
    } finally {
      setSubmitting(false);
    }
  }

  async function handleReplySubmit(parentId: string) {
    if (!replyContent.trim() || submitting) return;

    setSubmitting(true);
    try {
      const res = await fetch(`/api/listings/${listingId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: replyContent.trim(),
          isSecret: replyIsSecret,
          parentId,
        }),
      });
      if (res.ok) {
        setReplyContent("");
        setReplyIsSecret(false);
        setReplyingTo(null);
        await fetchComments();
      }
    } catch {
      // silently fail
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(commentId: string) {
    try {
      const res = await fetch(`/api/comments/${commentId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        await fetchComments();
      }
    } catch {
      // silently fail
    }
  }

  function renderComment(comment: Comment, isReply: boolean = false) {
    const isAuthor = currentUser?.id === comment.user.id;

    return (
      <div key={comment.id} className="py-4">
        <div className="flex gap-3">
          <UserAvatar user={comment.user} />
          <div className="min-w-0 flex-1">
            {/* Name + time */}
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-gray-900">
                {comment.user.name || "익명"}
              </span>
              <span className="text-xs text-gray-400">
                {formatRelativeTime(comment.createdAt)}
              </span>
              {comment.isSecret && (
                <span className="inline-flex items-center gap-1 rounded-full bg-purple-100 px-2 py-0.5 text-xs text-purple-700">
                  <Lock className="h-3 w-3" />
                  비밀 댓글
                </span>
              )}
            </div>

            {/* Content */}
            {comment.isHidden ? (
              <p className="mt-1 text-sm italic text-gray-400">
                {"🔒 비밀 댓글입니다"}
              </p>
            ) : (
              <p className="mt-1 whitespace-pre-wrap text-sm text-gray-700">
                {comment.content}
              </p>
            )}

            {/* Action buttons */}
            <div className="mt-2 flex items-center gap-3">
              {!isReply && currentUser && (
                <button
                  type="button"
                  onClick={() => {
                    setReplyingTo(
                      replyingTo === comment.id ? null : comment.id
                    );
                    setReplyContent("");
                    setReplyIsSecret(false);
                  }}
                  className="flex items-center gap-1 text-xs text-gray-400 transition-colors hover:text-purple-600"
                >
                  <Reply className="h-3.5 w-3.5" />
                  답글
                </button>
              )}
              {isAuthor && (
                <button
                  type="button"
                  onClick={() => handleDelete(comment.id)}
                  className="flex items-center gap-1 text-xs text-gray-400 transition-colors hover:text-red-500"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  삭제
                </button>
              )}
            </div>

            {/* Inline reply form */}
            {!isReply && replyingTo === comment.id && (
              <div className="mt-3">
                <textarea
                  value={replyContent}
                  onChange={(e) => setReplyContent(e.target.value)}
                  placeholder="답글을 입력하세요..."
                  rows={2}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
                />
                <div className="mt-2 flex items-center justify-between">
                  <label className="flex cursor-pointer items-center gap-1.5 text-xs text-gray-500">
                    <input
                      type="checkbox"
                      checked={replyIsSecret}
                      onChange={(e) => setReplyIsSecret(e.target.checked)}
                      className="rounded border-gray-300"
                    />
                    <Lock className="h-3 w-3" />
                    비밀 댓글
                  </label>
                  <button
                    type="button"
                    onClick={() => handleReplySubmit(comment.id)}
                    disabled={submitting || !replyContent.trim()}
                    className="rounded-lg bg-purple-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-purple-700 disabled:opacity-50"
                  >
                    답글 작성
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Replies */}
        {!isReply && comment.replies && comment.replies.length > 0 && (
          <div className="ml-4 mt-2 border-l-2 border-gray-200 pl-8">
            {comment.replies.map((reply) => renderComment(reply, true))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6">
      {/* Header */}
      <div className="flex items-center gap-2">
        <MessageSquare className="h-5 w-5 text-purple-600" />
        <h3 className="text-lg font-bold text-gray-900">댓글</h3>
        <span className="text-sm text-gray-400">{totalCount}</span>
      </div>

      {/* Comment Form */}
      <div className="mt-4">
        {!currentUser ? (
          <div className="rounded-lg bg-gray-50 px-4 py-3 text-center text-sm text-gray-500">
            <Link
              href="/login"
              className="font-medium text-purple-600 hover:underline"
            >
              로그인
            </Link>
            {" 후 댓글을 작성할 수 있습니다"}
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="댓글을 입력하세요..."
              rows={3}
              className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
            />
            <div className="mt-2 flex items-center justify-between">
              <label className="flex cursor-pointer items-center gap-1.5 text-sm text-gray-500">
                <input
                  type="checkbox"
                  checked={isSecret}
                  onChange={(e) => setIsSecret(e.target.checked)}
                  className="rounded border-gray-300"
                />
                <Lock className="h-3.5 w-3.5" />
                비밀 댓글
              </label>
              <button
                type="submit"
                disabled={submitting || !content.trim()}
                className="rounded-lg bg-purple-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-purple-700 disabled:opacity-50"
              >
                작성
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Divider */}
      <hr className="my-4 border-gray-100" />

      {/* Comment List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-purple-600" />
        </div>
      ) : comments.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <MessageSquare className="h-10 w-10 text-gray-300" />
          <p className="mt-3 text-sm text-gray-400">
            아직 댓글이 없습니다. 첫 번째 댓글을 남겨보세요!
          </p>
        </div>
      ) : (
        <div className="divide-y divide-gray-100">
          {comments.map((comment) => renderComment(comment))}
        </div>
      )}
    </div>
  );
}
