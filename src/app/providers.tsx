"use client";

import { useState } from "react";
import { SessionProvider } from "next-auth/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ToastProvider } from "@/components/ui/toast";
import { CompareProvider } from "@/lib/compare-context";
import { SentryProvider } from "@/components/sentry-provider";

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000,
            retry: 1,
          },
        },
      })
  );

  return (
    <SessionProvider>
      <QueryClientProvider client={queryClient}>
        <CompareProvider>
          <SentryProvider>
            <ToastProvider>{children}</ToastProvider>
          </SentryProvider>
        </CompareProvider>
      </QueryClientProvider>
    </SessionProvider>
  );
}
