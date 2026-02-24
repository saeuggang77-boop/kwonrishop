"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { CheckCircle2, Search, Bell, Plus, Award, Briefcase, Settings, TrendingUp } from "lucide-react";
import { useEffect } from "react";

export default function WelcomePage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  if (status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-navy border-t-transparent" />
      </div>
    );
  }

  if (!session?.user) {
    return null;
  }

  const role = session.user.role;

  const getWelcomeContent = () => {
    switch (role) {
      case "BUYER":
        return {
          title: "권리샵에 오신 것을 환영합니다!",
          subtitle: "이제 안전한 점포 거래를 시작할 준비가 완료되었습니다.",
          cards: [
            {
              icon: <Search className="h-6 w-6 text-navy" />,
              title: "매물 검색하기",
              description: "원하는 조건의 점포를 찾아보세요",
              link: "/listings",
              linkText: "매물 둘러보기",
            },
            {
              icon: <Bell className="h-6 w-6 text-navy" />,
              title: "관심 알림 설정하기",
              description: "새로운 매물이 등록되면 알림을 받으세요",
              link: "/dashboard/notifications",
              linkText: "알림 설정",
            },
          ],
        };

      case "SELLER":
        return {
          title: "판매자로 가입하신 것을 환영합니다!",
          subtitle: "점포 양도를 위한 첫 걸음을 시작하세요.",
          cards: [
            {
              icon: <Plus className="h-6 w-6 text-navy" />,
              title: "첫 매물 등록하기",
              description: "점포 정보를 등록하고 구매자를 찾으세요",
              link: "/listings/new",
              linkText: "매물 등록",
            },
            {
              icon: <Award className="h-6 w-6 text-navy" />,
              title: "프리미엄 광고 알아보기",
              description: "상단 노출로 더 많은 구매자를 만나세요",
              link: "/pricing",
              linkText: "요금제 보기",
            },
          ],
        };

      case "AGENT":
        return {
          title: "공인중개사님, 환영합니다!",
          subtitle: "전문가로서 더 많은 거래 기회를 만들어보세요.",
          cards: [
            {
              icon: <Plus className="h-6 w-6 text-navy" />,
              title: "매물 등록하기",
              description: "중개 매물을 등록하고 관리하세요",
              link: "/listings/new",
              linkText: "매물 등록",
            },
            {
              icon: <Settings className="h-6 w-6 text-navy" />,
              title: "프로필 완성하기",
              description: "자격번호와 사무소 정보를 추가하세요",
              link: "/dashboard/settings",
              linkText: "프로필 설정",
            },
          ],
        };

      case "FRANCHISE":
        return {
          title: "프랜차이즈 본사님, 환영합니다!",
          subtitle: "가맹점 모집을 효과적으로 진행해보세요.",
          cards: [
            {
              icon: <Briefcase className="h-6 w-6 text-navy" />,
              title: "프랜차이즈 등록하기",
              description: "브랜드 정보를 등록하고 홍보하세요",
              link: "/franchise",
              linkText: "프랜차이즈 정보",
            },
            {
              icon: <Plus className="h-6 w-6 text-navy" />,
              title: "매물 등록하기",
              description: "가맹 가능 매물을 등록하세요",
              link: "/listings/new",
              linkText: "매물 등록",
            },
          ],
        };

      case "EXPERT":
        return {
          title: "전문가님, 환영합니다!",
          subtitle: "전문 지식으로 고객을 도와주세요.",
          cards: [
            {
              icon: <Settings className="h-6 w-6 text-navy" />,
              title: "프로필 완성하기",
              description: "자격증명과 경력을 추가하세요",
              link: "/dashboard/settings",
              linkText: "프로필 설정",
            },
            {
              icon: <TrendingUp className="h-6 w-6 text-navy" />,
              title: "전문 분야 설정하기",
              description: "상담 가능한 분야를 설정하세요",
              link: "/experts",
              linkText: "전문가 페이지",
            },
          ],
        };

      default:
        return {
          title: "권리샵에 오신 것을 환영합니다!",
          subtitle: "안전한 점포 거래를 시작하세요.",
          cards: [],
        };
    }
  };

  const content = getWelcomeContent();

  return (
    <div className="container mx-auto max-w-4xl px-4 py-12">
      <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
        {/* Success Icon */}
        <div className="mb-6 flex justify-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-green-100">
            <CheckCircle2 className="h-12 w-12 text-green-600" />
          </div>
        </div>

        {/* Welcome Message */}
        <h1 className="mb-2 text-center font-heading text-3xl font-bold text-navy">
          {content.title}
        </h1>
        <p className="mb-8 text-center text-gray-600">{content.subtitle}</p>

        {/* Action Cards */}
        <div className="grid gap-6 md:grid-cols-2">
          {content.cards.map((card, index) => (
            <div
              key={index}
              className="rounded-xl border border-gray-200 bg-gray-50 p-6 transition-all hover:border-navy hover:shadow-md"
            >
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-white shadow-sm">
                {card.icon}
              </div>
              <h3 className="mb-2 font-heading text-lg font-bold text-navy">
                {card.title}
              </h3>
              <p className="mb-4 text-sm text-gray-600">{card.description}</p>
              <Link
                href={card.link}
                className="inline-flex items-center text-sm font-medium text-navy hover:underline"
              >
                {card.linkText}
                <svg
                  className="ml-1 h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </Link>
            </div>
          ))}
        </div>

        {/* Go to Home */}
        <div className="mt-8 text-center">
          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-lg bg-accent px-6 py-3 font-medium text-white transition-colors hover:bg-accent-dark"
          >
            홈으로 이동
          </Link>
        </div>
      </div>
    </div>
  );
}
