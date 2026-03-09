"use client";

import { useEffect, useState, useRef } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { getPusherClient } from "@/lib/pusher-client";
import type { Channel } from "pusher-js";

interface ChatRoom {
  id: string;
  listing: {
    id: string;
    storeName: string | null;
    addressRoad: string | null;
    images: { url: string }[];
  };
  participants: {
    user: { id: string; name: string | null; image: string | null };
  }[];
  messages: { content: string; createdAt: string; senderId: string }[];
}

interface Message {
  id: string;
  content: string;
  createdAt: string;
  senderId: string;
  sender: { name: string | null; image: string | null };
}

function ChatContent() {
  const { data: session } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const [activeRoom, setActiveRoom] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [showRoomList, setShowRoomList] = useState(true);
  const channelRef = useRef<Channel | null>(null);

  // 매물에서 채팅 시작 시
  useEffect(() => {
    const listingId = searchParams.get("listingId");
    if (listingId && session) {
      fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ listingId }),
      })
        .then((r) => r.json())
        .then((data) => {
          if (data.chatRoomId) setActiveRoom(data.chatRoomId);
        });
    }
  }, [searchParams, session]);

  // 채팅방 목록
  useEffect(() => {
    if (!session) return;
    fetch("/api/chat")
      .then((r) => r.json())
      .then((data) => { setRooms(data); setLoading(false); });
  }, [session]);

  // 메시지 조회 및 실시간 구독
  useEffect(() => {
    if (!activeRoom) return;

    // 초기 메시지 불러오기
    fetch(`/api/chat/${activeRoom}/messages`)
      .then((r) => r.json())
      .then((data) => setMessages(data.messages || []));

    // Pusher 실시간 구독
    if (process.env.NEXT_PUBLIC_PUSHER_KEY) {
      try {
        const pusher = getPusherClient();
        const channel = pusher.subscribe(`chat-${activeRoom}`);

        channel.bind("new-message", (newMessage: Message) => {
          setMessages((prev) => {
            // 중복 방지
            if (prev.some((m) => m.id === newMessage.id)) return prev;
            return [...prev, newMessage];
          });
        });

        channelRef.current = channel;

        return () => {
          channel.unbind_all();
          channel.unsubscribe();
        };
      } catch (error) {
        console.error("[Pusher] Subscription error:", error);
        // Fallback to polling
        const interval = setInterval(() => {
          fetch(`/api/chat/${activeRoom}/messages`)
            .then((r) => r.json())
            .then((data) => setMessages(data.messages || []));
        }, 3000);
        return () => clearInterval(interval);
      }
    } else {
      // Fallback: 폴링 (Pusher 미설정 시)
      const interval = setInterval(() => {
        fetch(`/api/chat/${activeRoom}/messages`)
          .then((r) => r.json())
          .then((data) => setMessages(data.messages || []));
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [activeRoom]);

  async function sendMessage() {
    if (!input.trim() || !activeRoom) return;
    const content = input;
    setInput("");

    const res = await fetch(`/api/chat/${activeRoom}/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content }),
    });

    if (res.ok) {
      const msg = await res.json();
      setMessages((prev) => [...prev, msg]);
    }
  }

  if (!session) {
    router.push("/login?callbackUrl=/chat");
    return null;
  }

  const activeRoomData = rooms.find((r) => r.id === activeRoom);
  const otherUser = activeRoomData?.participants.find(
    (p) => p.user.id !== session.user.id,
  )?.user;

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-4">채팅</h1>

      <div className="flex gap-4 h-[calc(100vh-12rem)]">
        {/* 채팅방 목록 */}
        <div className={`w-full md:w-80 bg-white rounded-xl border border-gray-200 overflow-y-auto md:shrink-0 ${
          showRoomList ? "block" : "hidden md:block"
        }`}>
          {loading ? (
            <div className="p-4 text-gray-400 text-sm">로딩 중...</div>
          ) : rooms.length === 0 ? (
            <div className="p-4 text-gray-400 text-sm text-center">채팅이 없습니다</div>
          ) : (
            rooms.map((room) => {
              const other = room.participants.find(
                (p) => p.user.id !== session.user.id,
              )?.user;
              const lastMsg = room.messages[0];
              return (
                <button
                  key={room.id}
                  onClick={() => {
                    setActiveRoom(room.id);
                    setShowRoomList(false);
                  }}
                  className={`w-full text-left p-4 border-b border-gray-100 hover:bg-gray-50 transition-colors ${
                    activeRoom === room.id ? "bg-blue-50" : ""
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-sm font-bold text-gray-500 shrink-0">
                      {other?.name?.[0] || "U"}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-900 truncate">
                          {other?.name || "상대방"}
                        </span>
                        {lastMsg && (
                          <span className="text-[10px] text-gray-400 shrink-0">
                            {new Date(lastMsg.createdAt).toLocaleDateString("ko-KR")}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-400 truncate mt-0.5">
                        {room.listing.storeName || room.listing.addressRoad || "매물"}
                      </p>
                      {lastMsg && (
                        <p className="text-xs text-gray-500 truncate mt-0.5">
                          {lastMsg.content}
                        </p>
                      )}
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </div>

        {/* 메시지 영역 */}
        <div className={`flex-1 bg-white rounded-xl border border-gray-200 flex flex-col ${
          showRoomList ? "hidden md:flex" : "flex"
        }`}>
          {activeRoom ? (
            <>
              {/* 상단 바 */}
              <div className="p-4 border-b border-gray-200 flex items-center gap-3">
                <button
                  onClick={() => setShowRoomList(true)}
                  className="md:hidden p-1 -ml-2 text-gray-600 hover:text-gray-900"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <div className="flex-1">
                  <p className="font-medium text-gray-900">{otherUser?.name || "상대방"}</p>
                  <p className="text-xs text-gray-400">
                    {activeRoomData?.listing.storeName || activeRoomData?.listing.addressRoad}
                  </p>
                </div>
              </div>

              {/* 메시지 */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {messages.map((msg) => {
                  const isMine = msg.senderId === session.user.id;
                  return (
                    <div
                      key={msg.id}
                      className={`flex ${isMine ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-[70%] px-4 py-2.5 rounded-2xl text-sm ${
                          isMine
                            ? "bg-blue-600 text-white"
                            : "bg-gray-100 text-gray-900"
                        }`}
                      >
                        {msg.content}
                        <p
                          className={`text-[10px] mt-1 ${
                            isMine ? "text-blue-200" : "text-gray-400"
                          }`}
                        >
                          {new Date(msg.createdAt).toLocaleTimeString("ko-KR", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* 입력 */}
              <div className="p-3 md:p-4 border-t border-gray-200">
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="메시지를 입력하세요"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                    className="flex-1 px-3 md:px-4 py-2.5 border border-gray-300 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    onClick={sendMessage}
                    className="px-4 md:px-5 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 min-w-[60px]"
                  >
                    전송
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">
              채팅방을 선택해주세요
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ChatPage() {
  return (
    <Suspense>
      <ChatContent />
    </Suspense>
  );
}
