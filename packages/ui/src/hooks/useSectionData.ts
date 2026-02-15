import { useState, useEffect, useCallback, useRef } from "react";
import type { SectionConfig, NormalizedPR } from "../types";
import { useAuthContext } from "../context/AuthProvider";
import { useUnreadContext } from "../context/UnreadContext";
import { executeQuery } from "../api/graphql-client";
import { transformResponse } from "../api/transforms";
import { RateLimiter } from "../api/rate-limiter";
import { preprocessQuery } from "../utils/query-preprocessor";

const rateLimiter = new RateLimiter(3, 200);

interface UseSectionDataResult {
  prs: NormalizedPR[];
  totalCount: number;
  isLoading: boolean;
  error: Error | null;
  refresh: () => Promise<void>;
}

export function useSectionData(
  config: SectionConfig,
  currentUser: string
): UseSectionDataResult {
  const { token } = useAuthContext();
  const { unreadUrls } = useUnreadContext();
  const [prs, setPrs] = useState<NormalizedPR[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const abortControllerRef = useRef<AbortController>();

  const fetchData = useCallback(async () => {
    if (!token) {
      setIsLoading(false);
      return;
    }

    // Abort any in-flight request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    setIsLoading(true);
    setError(null);

    try {
      const processedQuery = preprocessQuery(config.query, currentUser);

      const data = await rateLimiter.enqueue(async () => {
        if (abortController.signal.aborted) {
          throw new DOMException("Aborted", "AbortError");
        }
        return executeQuery(processedQuery, token);
      });

      if (abortController.signal.aborted) return;

      const normalized = transformResponse(data);
      const withUnread = normalized.map((pr) => ({
        ...pr,
        isUnread: unreadUrls.has(pr.url),
      }));

      setPrs(withUnread);
      setTotalCount(data?.search?.issueCount ?? withUnread.length);
      setIsLoading(false);
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return;
      if (abortController.signal.aborted) return;

      setError(err instanceof Error ? err : new Error(String(err)));
      setIsLoading(false);
    }
  }, [token, config.query, currentUser, unreadUrls]);

  useEffect(() => {
    fetchData();

    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [fetchData]);

  const refresh = useCallback(async () => {
    await fetchData();
  }, [fetchData]);

  return { prs, totalCount, isLoading, error, refresh };
}
