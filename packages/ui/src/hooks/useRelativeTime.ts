import { useState, useEffect } from "react";

const SECOND = 1_000;
const MINUTE = 60 * SECOND;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

function formatRelativeTime(timestamp: string): string {
  const diff = Date.now() - new Date(timestamp).getTime();

  if (diff < MINUTE) return "just now";
  if (diff < HOUR) return `${Math.floor(diff / MINUTE)}m ago`;
  if (diff < DAY) return `${Math.floor(diff / HOUR)}h ago`;
  if (diff < 30 * DAY) return `${Math.floor(diff / DAY)}d ago`;

  return new Date(timestamp).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function useRelativeTime(timestamp: string): string {
  const [formatted, setFormatted] = useState(() =>
    formatRelativeTime(timestamp)
  );

  useEffect(() => {
    setFormatted(formatRelativeTime(timestamp));

    const interval = setInterval(() => {
      setFormatted(formatRelativeTime(timestamp));
    }, 60_000);

    return () => clearInterval(interval);
  }, [timestamp]);

  return formatted;
}
