
type StatusType = "success" | "failure" | "pending" | "none";

interface StatusIconProps {
  status: StatusType;
  title?: string;
}

const iconMap: Record<StatusType, string> = {
  success: "\u2713",
  failure: "\u2717",
  pending: "\u25CF",
  none: "\u2014",
};

export function StatusIcon({ status, title }: StatusIconProps) {
  return (
    <span
      className={`lgtm-status-icon lgtm-status-icon--${status}`}
      title={title}
      role="img"
      aria-label={title ?? status}
    >
      {iconMap[status]}
    </span>
  );
}

/** Map CIState to StatusType */
export function ciStatusToType(
  ciState: "SUCCESS" | "FAILURE" | "PENDING" | "NONE"
): StatusType {
  switch (ciState) {
    case "SUCCESS":
      return "success";
    case "FAILURE":
      return "failure";
    case "PENDING":
      return "pending";
    default:
      return "none";
  }
}

/** Map ReviewDecision to StatusType */
export function reviewStatusToType(
  decision: "APPROVED" | "CHANGES_REQUESTED" | "REVIEW_REQUIRED" | null
): StatusType {
  switch (decision) {
    case "APPROVED":
      return "success";
    case "CHANGES_REQUESTED":
      return "failure";
    case "REVIEW_REQUIRED":
      return "pending";
    default:
      return "none";
  }
}

/** Map MergeableState to StatusType */
export function mergeStatusToType(
  mergeable: "MERGEABLE" | "CONFLICTING" | "UNKNOWN"
): StatusType {
  switch (mergeable) {
    case "MERGEABLE":
      return "success";
    case "CONFLICTING":
      return "failure";
    default:
      return "none";
  }
}
