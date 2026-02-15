import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
  type ReactNode,
} from "react";
import { useAuthContext } from "./AuthProvider";

interface UnreadContextValue {
  unreadUrls: Set<string>;
  refresh: () => void;
}

const UnreadContext = createContext<UnreadContextValue | null>(null);

const POLL_INTERVAL_MS = 60_000;

interface UnreadProviderProps {
  children: ReactNode;
}

export function UnreadProvider({ children }: UnreadProviderProps) {
  const { token } = useAuthContext();
  const [unreadUrls, setUnreadUrls] = useState<Set<string>>(new Set());
  const intervalRef = useRef<ReturnType<typeof setInterval>>();

  const fetchUnread = useCallback(async () => {
    if (!token) {
      setUnreadUrls(new Set());
      return;
    }

    try {
      const response = await fetch(
        "https://api.github.com/notifications?participating=true&all=false",
        {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/vnd.github+json",
            "User-Agent": "lgtm-dashboard",
          },
        }
      );

      if (!response.ok) return;

      const notifications: Array<{
        subject: { type: string; url: string };
        unread: boolean;
      }> = await response.json();

      const urls = new Set<string>();
      for (const notification of notifications) {
        if (
          notification.unread &&
          notification.subject.type === "PullRequest"
        ) {
          // Convert API URL to HTML URL
          // API: https://api.github.com/repos/owner/repo/pulls/123
          // HTML: https://github.com/owner/repo/pull/123
          const htmlUrl = notification.subject.url
            .replace("https://api.github.com/repos/", "https://github.com/")
            .replace("/pulls/", "/pull/");
          urls.add(htmlUrl);
        }
      }

      setUnreadUrls(urls);
    } catch {
      // Silently fail - unread status is non-critical
    }
  }, [token]);

  const refresh = useCallback(() => {
    fetchUnread();
  }, [fetchUnread]);

  useEffect(() => {
    fetchUnread();

    intervalRef.current = setInterval(fetchUnread, POLL_INTERVAL_MS);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [fetchUnread]);

  return (
    <UnreadContext.Provider value={{ unreadUrls, refresh }}>
      {children}
    </UnreadContext.Provider>
  );
}

export function useUnreadContext(): UnreadContextValue {
  const context = useContext(UnreadContext);
  if (!context) {
    throw new Error("useUnreadContext must be used within an UnreadProvider");
  }
  return context;
}
