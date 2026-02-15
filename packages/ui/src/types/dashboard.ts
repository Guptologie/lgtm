import type { SectionConfig } from "./section";

export interface SerializedDashboard {
  version: number;
  sections: SectionConfig[];
  settings: DashboardSettings;
}

export interface DashboardSettings {
  theme: "light" | "dark" | "auto";
}
