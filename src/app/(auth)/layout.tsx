import Image from "next/image";
import Link from "next/link";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center px-4">
      {/* Background gradient */}
      <div className="fixed inset-0 -z-10 bg-gradient-to-br from-gray-50 via-white to-mint/5" />
      <div
        className="fixed inset-0 -z-10 opacity-30"
        style={{
          backgroundImage: "radial-gradient(circle at 70% 20%, rgba(46,196,182,0.08) 0%, transparent 50%), radial-gradient(circle at 30% 80%, rgba(11,59,87,0.05) 0%, transparent 50%)",
        }}
      />

      <Link href="/" className="mb-8 flex items-center gap-2">
        <Image
          src="/logos/krw_shop_logo_symbol_transparent.png"
          alt="권리샵"
          width={40}
          height={40}
        />
        <span className="font-heading text-2xl font-bold text-navy">권리샵</span>
      </Link>
      <div className="w-full max-w-md animate-fade-in-scale">{children}</div>
    </div>
  );
}
