import type { NormalizedPR } from "../types";
import { useRelativeTime } from "../hooks/useRelativeTime";
import { Avatar } from "./common/Avatar";
import {
  StatusIcon,
  ciStatusToType,
  reviewStatusToType,
  mergeStatusToType,
} from "./common/StatusIcon";

interface PRRowProps {
  pr: NormalizedPR;
}

export function PRRow({ pr }: PRRowProps) {
  const relativeTime = useRelativeTime(pr.updatedAt);

  return (
    <div className="lgtm-pr-row">
      {/* Unread indicator */}
      <span
        className={`lgtm-pr-row__unread${pr.isUnread ? " lgtm-pr-row__unread--active" : ""}`}
      />

      {/* Author avatar */}
      <div className="lgtm-pr-row__author">
        <Avatar
          login={pr.author.login}
          avatarUrl={pr.author.avatarUrl}
          size={24}
        />
      </div>

      {/* Title + subtitle */}
      <div className="lgtm-pr-row__info">
        <a
          className="lgtm-pr-row__title"
          href={pr.url}
          target="_blank"
          rel="noopener noreferrer"
          title={pr.title}
        >
          {pr.title}
          {pr.isDraft && <span className="lgtm-pr-row__draft-badge">Draft</span>}
        </a>
        <div className="lgtm-pr-row__subtitle">
          {pr.repo}#{pr.number}
        </div>
      </div>

      {/* CI status */}
      <div className="lgtm-pr-row__ci">
        <StatusIcon
          status={ciStatusToType(pr.ciState)}
          title={`CI: ${pr.ciState.toLowerCase()}`}
        />
      </div>

      {/* Review status + reviewer avatars */}
      <div className="lgtm-pr-row__reviews">
        <StatusIcon
          status={reviewStatusToType(pr.reviewDecision)}
          title={
            pr.reviewDecision
              ? `Review: ${pr.reviewDecision.toLowerCase().replace("_", " ")}`
              : "No reviews"
          }
        />
        {pr.reviewers.length > 0 && (
          <div className="lgtm-reviewer-stack">
            {pr.reviewers.slice(0, 3).map((reviewer) => (
              <span
                key={reviewer.login}
                className="lgtm-reviewer-stack__item"
              >
                <Avatar
                  login={reviewer.login}
                  avatarUrl={reviewer.avatarUrl}
                  size={18}
                />
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Merge status */}
      <div className="lgtm-pr-row__merge">
        <StatusIcon
          status={mergeStatusToType(pr.mergeable)}
          title={`Merge: ${pr.mergeable.toLowerCase()}`}
        />
      </div>

      {/* Lines changed */}
      <div className="lgtm-pr-row__lines">
        <span className="lgtm-pr-row__additions">+{pr.additions}</span>
        <span className="lgtm-pr-row__deletions">-{pr.deletions}</span>
      </div>

      {/* Relative time */}
      <div className="lgtm-pr-row__time">{relativeTime}</div>
    </div>
  );
}
