import { useState } from 'react';
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { restrictToParentElement, restrictToVerticalAxis } from '@dnd-kit/modifiers';
import { useLgtmStore } from '../../app/context';
import { Section } from './Section';

export function SectionList() {
  const sections = useLgtmStore((s) => s.sections);
  const reorder = useLgtmStore((s) => s.reorder);
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const ids = sections.map((s) => s.id);
  const active = sections.find((s) => s.id === activeId) ?? null;

  const onDragEnd = (event: DragEndEvent) => {
    setActiveId(null);
    const { active: a, over } = event;
    if (!over || a.id === over.id) return;
    const from = ids.indexOf(String(a.id));
    const to = ids.indexOf(String(over.id));
    if (from >= 0 && to >= 0) reorder(from, to);
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      modifiers={[restrictToVerticalAxis, restrictToParentElement]}
      onDragStart={(e: DragStartEvent) => setActiveId(String(e.active.id))}
      onDragEnd={onDragEnd}
      onDragCancel={() => setActiveId(null)}
    >
      <SortableContext items={ids} strategy={verticalListSortingStrategy}>
        {sections.map((s) => (
          <Section key={s.id} section={s} />
        ))}
      </SortableContext>
      <DragOverlay>
        {active ? (
          <div
            style={{
              border: '1px solid var(--borderColor-default, #d0d7de)',
              borderRadius: 6,
              background: 'var(--bgColor-default, #ffffff)',
              padding: '10px 12px',
              boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
              fontSize: 14,
              fontWeight: 600,
              color: 'var(--fgColor-default, #1f2328)',
            }}
          >
            {active.name}
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
