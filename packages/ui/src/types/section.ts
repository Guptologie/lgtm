export type SortField = "updated" | "created" | "lines" | "reviewState" | "ciState";

export interface SortConfig {
  field: SortField;
  direction: "asc" | "desc";
}

export interface SectionConfig {
  id: string;
  title: string;
  query: string;
  sort: SortConfig;
  collapsed: boolean;
  order: number;
}
