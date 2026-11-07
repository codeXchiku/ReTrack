import React from 'react';
import { View } from 'react-native';
import { buildNavigationTree } from '@/core/navigation/tree';
import type { SubTabDef, TabDef } from '@/core/registry';

const DummyComponent = () => null;
const DummyIcon = () => <View />;

describe('buildNavigationTree', () => {
  it('builds ordered navigation tree from tabs and subTabs', () => {
    const tabs: TabDef[] = [
      { id: 'me', title: 'Me', order: 40, icon: DummyIcon },
      { id: 'home', title: 'Home', order: 10, icon: DummyIcon, component: DummyComponent },
      { id: 'focus', title: 'Focus', order: 20, icon: DummyIcon },
      { id: 'cards', title: 'Cards', order: 30, icon: DummyIcon },
    ];

    const subTabs: SubTabDef[] = [
      { tabId: 'focus', id: 'pomodoro', title: 'Pomodoro', order: 20, component: DummyComponent },
      { tabId: 'cards', id: 'library', title: 'Library', order: 20, component: DummyComponent },
      { tabId: 'focus', id: 'simple', title: 'Simple', order: 10, component: DummyComponent },
      { tabId: 'me', id: 'settings', title: 'Settings', order: 20, component: DummyComponent },
      { tabId: 'cards', id: 'review', title: 'Review', order: 10, component: DummyComponent },
      { tabId: 'me', id: 'stats', title: 'Stats', order: 10, component: DummyComponent },
    ];

    const tree = buildNavigationTree(tabs, subTabs);

    // Tabs must be ordered by `order` ascending: home (10), focus (20), cards (30), me (40)
    expect(tree.tabs.map(n => n.tab.id)).toEqual(['home', 'focus', 'cards', 'me']);

    // Home has no subTabs
    expect(tree.tabs[0]?.subTabs).toEqual([]);

    // Focus subTabs ordered by order: simple (10), pomodoro (20)
    expect(tree.tabs[1]?.subTabs.map(s => s.id)).toEqual(['simple', 'pomodoro']);

    // Cards subTabs ordered by order: review (10), library (20)
    expect(tree.tabs[2]?.subTabs.map(s => s.id)).toEqual(['review', 'library']);

    // Me subTabs ordered by order: stats (10), settings (20)
    expect(tree.tabs[3]?.subTabs.map(s => s.id)).toEqual(['stats', 'settings']);
  });

  it('throws a clear error if a subTab references a missing tabId', () => {
    const tabs: TabDef[] = [
      { id: 'home', title: 'Home', order: 10, icon: DummyIcon },
    ];

    const subTabs: SubTabDef[] = [
      { tabId: 'unknown_tab', id: 'orphan', title: 'Orphan', order: 10, component: DummyComponent },
    ];

    expect(() => buildNavigationTree(tabs, subTabs)).toThrow(
      'Sub-tab "orphan" refers to unknown tab "unknown_tab".',
    );
  });
});
