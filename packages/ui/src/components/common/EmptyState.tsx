
interface EmptyStateProps {
  message?: string;
}

export function EmptyState({
  message = "No pull requests",
}: EmptyStateProps) {
  return <div className="lgtm-empty-state">{message}</div>;
}
