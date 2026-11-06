import type {
  BackupProvider,
  FeatureManifest,
  ScreenDef,
  SlotItem,
  SlotName,
  SubTabDef,
  TabDef,
} from './types';

const registeredFeatureIds = new Set<string>();
const tabs: TabDef[] = [];
const subTabs: SubTabDef[] = [];
const screens: ScreenDef[] = [];
const slotItems = new Map<SlotName, SlotItem[]>();
const backupProviders: BackupProvider[] = [];
const initFunctions: (() => void | Promise<void>)[] = [];

/**
 * Resets the registry state (primarily for tests).
 */
export function clearRegistry(): void {
  registeredFeatureIds.clear();
  tabs.length = 0;
  subTabs.length = 0;
  screens.length = 0;
  slotItems.clear();
  backupProviders.length = 0;
  initFunctions.length = 0;
}

/**
 * Registers feature manifests, validating uniqueness of IDs.
 */
export function registerFeatures(manifests: FeatureManifest[]): void {
  for (const manifest of manifests) {
    if (registeredFeatureIds.has(manifest.id)) {
      throw new Error(`Duplicate feature id: "${manifest.id}"`);
    }
    registeredFeatureIds.add(manifest.id);

    if (manifest.tabs) {
      for (const tab of manifest.tabs) {
        if (tabs.some(existing => existing.id === tab.id)) {
          throw new Error(`Duplicate tab id: "${tab.id}"`);
        }
        tabs.push(tab);
      }
    }

    if (manifest.subTabs) {
      for (const subTab of manifest.subTabs) {
        if (
          subTabs.some(
            existing =>
              existing.tabId === subTab.tabId && existing.id === subTab.id,
          )
        ) {
          throw new Error(
            `Duplicate sub-tab id in tab "${subTab.tabId}": "${subTab.id}"`,
          );
        }
        subTabs.push(subTab);
      }
    }

    if (manifest.screens) {
      screens.push(...manifest.screens);
    }

    if (manifest.slots) {
      for (const [slotKey, items] of Object.entries(manifest.slots) as [
        SlotName,
        SlotItem[] | undefined,
      ][]) {
        if (!items) {
          continue;
        }
        let list = slotItems.get(slotKey);
        if (!list) {
          list = [];
          slotItems.set(slotKey, list);
        }
        for (const item of items) {
          if (list.some(existing => existing.id === item.id)) {
            throw new Error(
              `Duplicate slot item id in slot "${slotKey}": "${item.id}"`,
            );
          }
          list.push(item);
        }
      }
    }

    if (manifest.backup) {
      backupProviders.push(manifest.backup);
    }

    if (manifest.init) {
      initFunctions.push(manifest.init);
    }
  }
}

/**
 * Returns all registered tabs sorted stably by order.
 */
export function getTabs(): TabDef[] {
  return [...tabs].sort((a, b) => a.order - b.order);
}

/**
 * Returns sub-tabs for a specific tabId sorted stably by order.
 */
export function getSubTabs(tabId: string): SubTabDef[] {
  return subTabs
    .filter(st => st.tabId === tabId)
    .sort((a, b) => a.order - b.order);
}

/**
 * Returns all registered screens.
 */
export function getScreens(): ScreenDef[] {
  return [...screens];
}

/**
 * Returns all registered slot items for a given slot name sorted stably by order.
 */
export function getSlotItems(name: SlotName): SlotItem[] {
  const items = slotItems.get(name);
  if (!items) {
    return [];
  }
  return [...items].sort((a, b) => a.order - b.order);
}

/**
 * Returns all registered backup providers sorted stably by order.
 */
export function getBackupProviders(): BackupProvider[] {
  return [...backupProviders].sort((a, b) => a.order - b.order);
}

/**
 * Runs feature initialization callbacks once.
 */
export async function runFeatureInits(): Promise<void> {
  for (const init of initFunctions) {
    await init();
  }
}

