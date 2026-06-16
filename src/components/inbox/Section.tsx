import { useEffect, useRef, type CSSProperties } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { SectionConfig } from '../../query/model';
import { useLgtmStore } from '../../app/context';
import { GripIcon } from '../icons';
import { SectionHeader } from './SectionHeader';
import { PullRequestCard } from './PullRequestCard';
import { SectionEmpty, SectionError, SectionLoading } from './SectionStates';

const handleStyle: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: 24,
  height: 24,
  padding: 0,
  border: 0,
  borderRadius: 6,
  background: 'transparent',
  color: 'var(--fgColor-muted, #656d76)',
  cursor: 'grab',
  touchAction: 'none',
};

export function Section({ section }: { section: SectionConfig }) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } =
    useSortable({ id: section.id });
  const cards = useLgtmStore((s) => s.cards[section.id]);
  const refreshCards = useLgtmStore((s) => s.refreshCards);
  const focused = useLgtmStore((s) => s.ui.focusedSectionId === section.id);

  const nodeRef = useRef<HTMLElement | null>(null);
  const setRefs = (el: HTMLElement | null) => {
    setNodeRef(el);
    nodeRef.current = el;
  };

  // Scroll into view when focused from the sidebar (cross-surface via the store).
  useEffect(() => {
    if (focused) nodeRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [focused]);

  const style: CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
    marginBottom: 12,
    border: '1px solid var(--borderColor-default, #d0d7de)',
    borderRadius: 6,
    background: 'var(--bgColor-default, #ffffff)',
  };

  const handle = (
    <button ref={setActivatorNodeRef} {...attributes} {...listeners} aria-label="Reorder section" style={handleStyle}>
      <GripIcon />
    </button>
  );

  return (
    <section ref={setRefs} style={style}>
      <SectionHeader section={section} handle={handle} />
      {!section.collapsed && (
        <div>
          {(!cards || cards.status === 'idle' || cards.status === 'loading') && <SectionLoading />}
          {cards?.status === 'error' && (
            <SectionError message={cards.error ?? 'Unknown error'} onRetry={() => refreshCards(section.id)} />
          )}
          {cards?.status === 'ready' &&
            (cards.nodes.length === 0 ? (
              <SectionEmpty />
            ) : (
              cards.nodes.map((pr) => <PullRequestCard key={pr.id} pr={pr} />)
            ))}
        </div>
      )}
    </section>
  );
}
