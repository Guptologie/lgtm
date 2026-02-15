import { useEffect, useState, type ReactNode } from "react";
import { useDashboardContext } from "../context/DashboardContext";

interface ThemeWrapperProps {
  children: ReactNode;
}

function useResolvedTheme(theme: "light" | "dark" | "auto"): "light" | "dark" {
  const [systemDark, setSystemDark] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  });

  useEffect(() => {
    if (typeof window === "undefined") return;

    const mql = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = (e: MediaQueryListEvent) => setSystemDark(e.matches);

    mql.addEventListener("change", handler);
    return () => mql.removeEventListener("change", handler);
  }, []);

  if (theme === "auto") {
    return systemDark ? "dark" : "light";
  }
  return theme;
}

export function ThemeWrapper({ children }: ThemeWrapperProps) {
  const { settings } = useDashboardContext();
  const resolvedTheme = useResolvedTheme(settings.theme);

  return (
    <div className="lgtm-dashboard" data-theme={resolvedTheme}>
      {children}
    </div>
  );
}
