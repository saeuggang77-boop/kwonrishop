import { redirect } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { Shield, ListChecks, Users, BarChart3, FileText, DollarSign, Home } from "lucide-react";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    redirect("/");
  }

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 z-50 flex h-screen w-56 flex-col border-r border-gray-200 bg-navy">
        <div className="flex items-center gap-2 px-5 py-5">
          <Image
            src="/logos/krw_shop_logo_symbol_transparent.png"
            alt="권리샵"
            width={28}
            height={28}
          />
          <span className="font-heading text-sm font-bold text-white">관리자</span>
        </div>
        <nav className="flex-1 space-y-1 px-3 py-4">
          <SideLink href="/admin" icon={<BarChart3 className="h-4 w-4" />} label="대시보드" />
          <SideLink href="/admin/queue" icon={<Shield className="h-4 w-4" />} label="사기탐지 큐" />
          <SideLink href="/admin/listings" icon={<ListChecks className="h-4 w-4" />} label="매물 관리" />
          <SideLink href="/admin/users" icon={<Users className="h-4 w-4" />} label="회원 관리" />
          <SideLink href="/admin/settlements" icon={<DollarSign className="h-4 w-4" />} label="정산" />
          <SideLink href="/admin/audit" icon={<FileText className="h-4 w-4" />} label="감사 로그" />
        </nav>
        <div className="border-t border-navy-light px-3 py-4">
          <SideLink href="/" icon={<Home className="h-4 w-4" />} label="사이트로 이동" />
        </div>
      </aside>

      {/* Main Content */}
      <main className="relative z-0 ml-56 flex-1 bg-gray-50 p-8">
        {children}
      </main>
    </div>
  );
}

function SideLink({ href, icon, label }: { href: string; icon: React.ReactNode; label: string }) {
  return (
    <Link
      href={href}
      className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-gray-300 transition hover:bg-navy-light hover:text-white"
    >
      {icon}
      {label}
    </Link>
  );
}
