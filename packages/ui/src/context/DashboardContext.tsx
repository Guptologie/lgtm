import {
  createContext,
  useContext,
  useReducer,
  useEffect,
  useRef,
  type ReactNode,
  type Dispatch,
} from "react";
import { useAdapters } from "./AdapterContext";
import type { SectionConfig, DashboardSettings } from "../types";
import { defaultSections } from "../defaults/default-sections";

interface DashboardState {
  sections: SectionConfig[];
  settings: DashboardSettings;
}

export type DashboardAction =
  | { type: "ADD_SECTION"; payload: SectionConfig }
  | { type: "UPDATE_SECTION"; payload: { id: string; updates: Partial<SectionConfig> } }
  | { type: "DELETE_SECTION"; payload: { id: string } }
  | { type: "REORDER_SECTIONS"; payload: { sectionIds: string[] } }
  | { type: "UPDATE_SETTINGS"; payload: Partial<DashboardSettings> }
  | { type: "LOAD"; payload: DashboardState };

const defaultSettings: DashboardSettings = {
  theme: "auto",
};

function dashboardReducer(
  state: DashboardState,
  action: DashboardAction
): DashboardState {
  switch (action.type) {
    case "ADD_SECTION":
      return {
        ...state,
        sections: [...state.sections, action.payload],
      };

    case "UPDATE_SECTION":
      return {
        ...state,
        sections: state.sections.map((s) =>
          s.id === action.payload.id ? { ...s, ...action.payload.updates } : s
        ),
      };

    case "DELETE_SECTION":
      return {
        ...state,
        sections: state.sections.filter((s) => s.id !== action.payload.id),
      };

    case "REORDER_SECTIONS": {
      const orderMap = new Map(
        action.payload.sectionIds.map((id, index) => [id, index])
      );
      return {
        ...state,
        sections: state.sections
          .map((s) => ({
            ...s,
            order: orderMap.get(s.id) ?? s.order,
          }))
          .sort((a, b) => a.order - b.order),
      };
    }

    case "UPDATE_SETTINGS":
      return {
        ...state,
        settings: { ...state.settings, ...action.payload },
      };

    case "LOAD":
      return action.payload;

    default:
      return state;
  }
}

interface DashboardContextValue {
  sections: SectionConfig[];
  settings: DashboardSettings;
  dispatch: Dispatch<DashboardAction>;
}

const DashboardContext = createContext<DashboardContextValue | null>(null);

interface DashboardProviderProps {
  children: ReactNode;
}

export function DashboardProvider({ children }: DashboardProviderProps) {
  const { storage } = useAdapters();
  const [state, dispatch] = useReducer(dashboardReducer, {
    sections: [],
    settings: defaultSettings,
  });
  const initialLoadDone = useRef(false);
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout>>();

  // Load initial state from storage
  useEffect(() => {
    storage.load().then((saved) => {
      if (saved) {
        dispatch({
          type: "LOAD",
          payload: {
            sections: saved.sections,
            settings: saved.settings,
          },
        });
      } else {
        dispatch({
          type: "LOAD",
          payload: {
            sections: defaultSections,
            settings: defaultSettings,
          },
        });
      }
      initialLoadDone.current = true;
    });

    const unsubscribe = storage.onChange((dashboard) => {
      dispatch({
        type: "LOAD",
        payload: {
          sections: dashboard.sections,
          settings: dashboard.settings,
        },
      });
    });

    return () => {
      unsubscribe();
    };
  }, [storage]);

  // Debounced save after state changes
  useEffect(() => {
    if (!initialLoadDone.current) return;

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(() => {
      storage.save({
        version: 1,
        sections: state.sections,
        settings: state.settings,
      });
    }, 500);

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [state, storage]);

  return (
    <DashboardContext.Provider
      value={{
        sections: state.sections,
        settings: state.settings,
        dispatch,
      }}
    >
      {children}
    </DashboardContext.Provider>
  );
}

export function useDashboardContext(): DashboardContextValue {
  const context = useContext(DashboardContext);
  if (!context) {
    throw new Error(
      "useDashboardContext must be used within a DashboardProvider"
    );
  }
  return context;
}
