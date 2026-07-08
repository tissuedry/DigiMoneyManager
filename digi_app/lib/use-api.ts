"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";

async function fetcher<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText);
    throw new Error(`GET ${url} ${res.status}: ${text}`);
  }
  return res.json();
}

export function useApi<T = any>(
  url: string | null,
  options?: { enabled?: boolean }
) {
  return useQuery<T>({
    queryKey: [url],
    queryFn: () => fetcher<T>(url!),
    enabled: !!url,
    ...options,
  });
}

export function useInvalidate() {
  const qc = useQueryClient();
  return useCallback(
    (...keys: string[]) => {
      for (const key of keys) {
        qc.invalidateQueries({ queryKey: [key] });
      }
    },
    [qc]
  );
}

export function useMutate<TData = any, TArgs = any>(
  url: string,
  method: "POST" | "PUT" | "DELETE" = "POST",
  invalidateKeys?: string[]
) {
  const invalidate = useInvalidate();
  return useMutation<TData, Error, TArgs>({
    mutationFn: async (body) => {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: body ? JSON.stringify(body) : undefined,
      });
      if (!res.ok) {
        const text = await res.text().catch(() => res.statusText);
        throw new Error(`${method} ${url} ${res.status}: ${text}`);
      }
      return res.json();
    },
    onSuccess: () => {
      if (invalidateKeys) invalidate(...invalidateKeys);
    },
  });
}
