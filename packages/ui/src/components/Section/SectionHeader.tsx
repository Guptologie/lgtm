import type { SortField, SortConfig } from "../../types";

interface SectionHeaderProps {
  title: string;
  count: number;
  collapsed: boolean;
  onToggleCollapse: () => void;
  sort: SortConfig;
  onSortChange: (field: SortField) => void;
  onRefresh: () => void;
  isLoading: boolean;
}

const sortOptions: { value: SortField; label: string }[] = [
  { value: "updated", label: "Updated" },
  { value: "created", label: "Created" },
  { value: "lines", label: "Lines" },
  { value: "reviewState", label: "Review" },
  { value: "ciState", label: "CI" },
];

export function SectionHeader({
  title,
  count,
  collapsed,
  onToggleCollapse,
  sort,
  onSortChange,
  onRefresh,
  isLoading,
}: SectionHeaderProps) {
  return (
    <div className="lgtm-section__header" onClick={onToggleCollapse}>
      <span
        className={`lgtm-section__chevron${collapsed ? " lgtm-section__chevron--collapsed" : ""}`}
      >
        &#9662;
      </span>
      <span className="lgtm-section__title">{title}</span>
      <span className="lgtm-section__count">{count}</span>
      <span className="lgtm-section__spacer" />
      <div
        className="lgtm-section__actions"
        onClick={(e) => e.stopPropagation()}
      >
        <select
          className="lgtm-section__sort-select"
          value={sort.field}
          onChange={(e) => onSortChange(e.target.value as SortField)}
          title="Sort by"
        >
          {sortOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <button
          className={`lgtm-section__refresh-btn${isLoading ? " lgtm-section__refresh-btn--loading" : ""}`}
          onClick={onRefresh}
          title="Refresh"
          disabled={isLoading}
        >
          &#8635;
        </button>
      </div>
    </div>
  );
}
