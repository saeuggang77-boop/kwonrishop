"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Search, Calculator, Users, User } from "lucide-react";

const tabs = [
  { href: "/", icon: Home, label: "홈", match: "exact" as const },
  { href: "/listings", icon: Search, label: "매물", match: "startsWith" as const },
  { href: "/simulator", icon: Calculator, label: "시뮬레이터", match: "startsWith" as const },
  { href: "/experts", icon: Users, label: "전문가", match: "startsWith" as const },
  { href: "/dashboard", icon: User, label: "마이", match: "startsWith" as const },
];

export function MobileTabBar() {
  const pathname = usePathname();

  const isActive = (href: string, match: "exact" | "startsWith") => {
    if (match === "exact") {
      return pathname === href;
    }
    return pathname.startsWith(href);
  };

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 flex border-t border-gray-200 bg-white/95 backdrop-blur-sm md:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
    >
      {tabs.map((item) => {
        const active = isActive(item.href, item.match);
        return (
          <Link
            key={item.href}
            href={item.href}
            className="relative flex flex-1 flex-col items-center gap-1 py-2 text-xs transition-colors"
            aria-current={active ? "page" : undefined}
          >
            {/* Active indicator dot */}
            {active && (
              <div className="absolute top-0 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-mint" />
            )}

            <item.icon
              className={`h-5 w-5 ${active ? "text-mint" : "text-gray-500"}`}
            />
            <span className={active ? "text-mint font-medium" : "text-gray-500"}>
              {item.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
