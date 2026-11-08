import type { ComponentType, ReactElement } from 'react';

export type IconProps = { color: string; size: number };

export type TabDef = {
  id: string;
  title: string;
  order: number;
  icon: (p: IconProps) => ReactElement;
  component?: ComponentType;
};

export type SubTabDef = {
  tabId: string;
  id: string;
  title: string;
  order: number;
  component: ComponentType;
};

export type ScreenDef = {
  name: string;
  component: ComponentType<Record<string, unknown>>;
  options?: Record<string, unknown>;
};

export type SlotName =
  | 'home.dashboard'
  | 'focus.setupHints'
  | 'focus.breakPanel'
  | 'onboarding.steps'
  | 'settings.sections';

export type SlotItem = {
  id: string;
  order: number;
  component: ComponentType<Record<string, unknown>>;
};

export type BackupProvider = {
  id: string;
  order: number;
  export: () => Promise<unknown>;
  clear: () => Promise<void>;
  import: (data: unknown) => Promise<void>;
};

export type FeatureManifest = {
  id: string;
  tabs?: TabDef[];
  subTabs?: SubTabDef[];
  screens?: ScreenDef[];
  slots?: Partial<Record<SlotName, SlotItem[]>>;
  backup?: BackupProvider;
  init?: () => void | Promise<void>; // runs once after the database is ready
  startupRoute?: {
    order: number;
    resolve: () => string | null;
  };
};

