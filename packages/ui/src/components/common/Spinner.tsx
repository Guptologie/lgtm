
interface SpinnerProps {
  size?: "sm" | "md" | "lg";
}

export function Spinner({ size = "md" }: SpinnerProps) {
  const className =
    size === "sm"
      ? "lgtm-spinner lgtm-spinner--sm"
      : size === "lg"
        ? "lgtm-spinner lgtm-spinner--lg"
        : "lgtm-spinner";

  return <span className={className} role="status" aria-label="Loading" />;
}
