import { Avatar, AvatarStack, Label } from '@primer/react';
import type { CheckState, PrCardData, ReviewDecision } from '../../data/gql';
import { CheckIcon, DotIcon, XIcon } from '../icons';
import { formatRelative } from '../../util/relative-time';

type LabelVariant = 'success' | 'danger' | 'attention' | 'secondary';

const REVIEW_META: Record<NonNullable<ReviewDecision>, { text: string; variant: LabelVariant }> = {
  APPROVED: { text: 'Approved', variant: 'success' },
  CHANGES_REQUESTED: { text: 'Changes requested', variant: 'danger' },
  REVIEW_REQUIRED: { text: 'Review required', variant: 'attention' },
};

function Checks({ state }: { state: CheckState }) {
  if (!state) return null;
  if (state === 'SUCCESS')
    return (
      <span style={{ color: 'var(--fgColor-success, #1a7f37)', display: 'inline-flex' }} title="Checks passing">
        <CheckIcon />
      </span>
    );
  if (state === 'FAILURE' || state === 'ERROR')
    return (
      <span style={{ color: 'var(--fgColor-danger, #cf222e)', display: 'inline-flex' }} title="Checks failing">
        <XIcon />
      </span>
    );
  return (
    <span style={{ color: 'var(--fgColor-attention, #9a6700)', display: 'inline-flex' }} title="Checks pending">
      <DotIcon width={10} height={10} />
    </span>
  );
}

export function PullRequestCard({ pr }: { pr: PrCardData }) {
  const review = pr.reviewDecision ? REVIEW_META[pr.reviewDecision] : null;

  return (
    <article
      style={{
        display: 'flex',
        gap: 8,
        padding: '8px 12px',
        borderTop: '1px solid var(--borderColor-muted, #d8dee4)',
      }}
    >
      {pr.author && <Avatar src={pr.author.avatarUrl} size={20} />}

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <a
            href={pr.url}
            target="_blank"
            rel="noreferrer"
            style={{
              color: 'var(--fgColor-default, #1f2328)',
              fontWeight: 600,
              fontSize: 14,
              textDecoration: 'none',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {pr.title}
          </a>
          {pr.isDraft && <Label variant="secondary">Draft</Label>}
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            flexWrap: 'wrap',
            marginTop: 2,
            fontSize: 12,
            color: 'var(--fgColor-muted, #656d76)',
          }}
        >
          <span>
            {pr.repository.nameWithOwner} #{pr.number}
          </span>
          <span aria-hidden>·</span>
          <span>{formatRelative(pr.updatedAt)}</span>
          {(pr.additions > 0 || pr.deletions > 0) && (
            <span>
              <span style={{ color: 'var(--fgColor-success, #1a7f37)' }}>+{pr.additions}</span>{' '}
              <span style={{ color: 'var(--fgColor-danger, #cf222e)' }}>−{pr.deletions}</span>
            </span>
          )}
          {pr.labels.map((l) => (
            <span
              key={l.name}
              style={{
                fontSize: 11,
                padding: '0 6px',
                lineHeight: '18px',
                borderRadius: 999,
                border: `1px solid #${l.color || 'd0d7de'}`,
                color: 'var(--fgColor-muted, #656d76)',
              }}
            >
              {l.name}
            </span>
          ))}
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
        <Checks state={pr.checks} />
        {review && <Label variant={review.variant}>{review.text}</Label>}
        {pr.reviewers.length > 0 && (
          <AvatarStack>
            {pr.reviewers.map((r) => (
              <Avatar key={r.login} src={r.avatarUrl} size={20} alt={r.login} />
            ))}
          </AvatarStack>
        )}
      </div>
    </article>
  );
}
