import type { SortField, SortConfig } from "../../types";

interface ColumnHeadersProps {
  sort: SortConfig;
  onSortChange: (field: SortField) => void;
}

interface Column {
  label: string;
  field: SortField | null;
}

const columns: Column[] = [
  { label: "", field: null }, // unread dot spacer
  { label: "", field: null }, // avatar spacer
  { label: "Title", field: null },
  { label: "CI", field: "ciState" },
  { label: "Reviews", field: "reviewState" },
  { label: "Merge", field: null },
  { label: "Lines", field: "lines" },
  { label: "Updated", field: "updated" },
];

export function ColumnHeaders({ sort, onSortChange }: ColumnHeadersProps) {
  return (
    <div className="lgtm-column-headers">
      {columns.map((col, i) => {
        const isActive = col.field !== null && sort.field === col.field;
        const isSortable = col.field !== null;
        const cellClass = [
          "lgtm-column-headers__cell",
          isActive ? "lgtm-column-headers__cell--active" : "",
          !isSortable ? "lgtm-column-headers__cell--spacer" : "",
        ]
          .filter(Boolean)
          .join(" ");

        return (
          <div
            key={i}
            className={cellClass}
            onClick={
              isSortable ? () => onSortChange(col.field!) : undefined
            }
          >
            {col.label}
            {isActive && (
              <span className="lgtm-column-headers__sort-arrow">
                {sort.direction === "asc" ? "\u25B2" : "\u25BC"}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}
