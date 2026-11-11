import type { SubTabDef, TabDef } from '@/core/registry';

export type NavigationTabNode = {
  tab: TabDef;
  subTabs: SubTabDef[];
};

export type NavigationTree = {
  tabs: NavigationTabNode[];
};

/**
 * Builds and validates the navigation hierarchy from registered tabs and sub-tabs.
 * Throws a clear error if a sub-tab references an unregistered tabId.
 * Guarantees stable ordering by `order` field.
 */
export function buildNavigationTree(
  tabs: TabDef[],
  subTabs: SubTabDef[],
): NavigationTree {
  const sortedTabs = [...tabs].sort((a, b) => a.order - b.order);
  const tabIdSet = new Set(sortedTabs.map(t => t.id));

  // Validate that every sub-tab has a corresponding parent tab
  for (const subTab of subTabs) {
    if (!tabIdSet.has(subTab.tabId)) {
      throw new Error(
        `Sub-tab "${subTab.id}" refers to unknown tab "${subTab.tabId}".`,
      );
    }
  }

  const nodes: NavigationTabNode[] = sortedTabs.map(tab => {
    const matchingSubTabs = subTabs
      .filter(s => s.tabId === tab.id)
      .sort((a, b) => a.order - b.order);

    return {
      tab,
      subTabs: matchingSubTabs,
    };
  });

  return { tabs: nodes };
}
