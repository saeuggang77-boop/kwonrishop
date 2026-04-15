"use client";

export default function SkipLink() {
  return (
    <a
      href="#main-content"
      className="absolute -top-full left-0 z-[100] px-4 py-2 bg-green-700 text-white rounded-lg outline-none ring-2 ring-green-500 ring-offset-2 focus:top-4 focus:left-4 transition-[top]"
    >
      본문으로 건너뛰기
    </a>
  );
}
