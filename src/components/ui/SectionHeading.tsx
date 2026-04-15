"use client";

import Link from "next/link";

interface Props {
  kicker?: string;
  title: string;
  titleAccent?: string; // 세리프 이탤릭 강조 (숫자·영문 권장)
  description?: string;
  moreHref?: string;
  moreLabel?: string;
  align?: "left" | "center";
}

export default function SectionHeading({
  kicker,
  title,
  titleAccent,
  description,
  moreHref,
  moreLabel = "전체 보기 →",
  align = "left",
}: Props) {
  const isCenter = align === "center";
  return (
    <div className={`mb-10 ${isCenter ? "text-center" : "flex items-end justify-between gap-6 flex-wrap"}`}>
      <div className={isCenter ? "" : "max-w-2xl"}>
        {kicker && (
          <div className={`text-xs font-semibold text-terra-500 tracking-[0.15em] uppercase mb-2 ${isCenter ? "" : "flex items-center gap-2"}`}>
            {!isCenter && <span className="w-6 h-px bg-terra-500" />}
            {kicker}
          </div>
        )}
        <h2 className="font-extrabold text-green-700 text-3xl md:text-4xl tracking-tight leading-tight">
          {title}
          {titleAccent && (
            <>
              {" "}
              <span className="font-light text-terra-500">{titleAccent}</span>
            </>
          )}
        </h2>
        {description && (
          <p className="text-muted text-sm md:text-base mt-3 leading-relaxed">{description}</p>
        )}
      </div>

      {moreHref && !isCenter && (
        <Link href={moreHref} className="text-sm font-semibold text-green-700 hover:text-terra-500 whitespace-nowrap">
          {moreLabel}
        </Link>
      )}
    </div>
  );
}
