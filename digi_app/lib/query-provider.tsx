"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { useEffect, useState, type ReactNode } from "react";

// Global fetch interceptor to automatically route /api calls to /digimoney/api
if (typeof window !== "undefined") {
  const originalFetch = window.fetch;
  window.fetch = function (input: RequestInfo | URL, init?: RequestInit) {
    if (typeof input === "string") {
      if (input.startsWith("/api/") || input === "/api") {
        input = `/digimoney${input}`;
      }
    } else if (input instanceof URL) {
      if (input.pathname.startsWith("/api/") || input.pathname === "/api") {
        input = new URL(`/digimoney${input.pathname}${input.search}`, input.origin);
      }
    } else if (input instanceof Request) {
      const url = new URL(input.url);
      if (url.pathname.startsWith("/api/") || url.pathname === "/api") {
        const newUrl = `${url.origin}/digimoney${url.pathname}${url.search}`;
        input = new Request(newUrl, input);
      }
    }
    return originalFetch.call(this, input, init);
  };
}

export default function QueryProvider({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30 * 1000,
            gcTime: 5 * 60 * 1000,
            refetchOnWindowFocus: false,
            retry: 1,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}
