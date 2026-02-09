import Image from "next/image";
import Link from "next/link";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-4">
      <Link href="/" className="mb-8 flex items-center gap-2">
        <Image
          src="/logos/krw_shop_logo_symbol_transparent.png"
          alt="권리샵"
          width={40}
          height={40}
        />
        <span className="font-heading text-2xl font-bold text-navy">권리샵</span>
      </Link>
      <div className="w-full max-w-md">{children}</div>
    </div>
  );
}
