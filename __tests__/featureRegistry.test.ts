import {
  clearRegistry,
  getBackupProviders,
  getScreens,
  getSlotItems,
  getSubTabs,
  getTabs,
  registerFeatures,
  runFeatureInits,
} from '@/core/registry/featureRegistry';
import type { FeatureManifest } from '@/core/registry/types';

describe('FeatureRegistry', () => {
  beforeEach(() => {
    clearRegistry();
  });

  it('registers features and sorts tabs by order stably', () => {
    const dummyIcon = () => null as never;
    const manifests: FeatureManifest[] = [
      {
        id: 'f1',
        tabs: [
          { id: 'tabB', title: 'B', order: 20, icon: dummyIcon },
          { id: 'tabA', title: 'A', order: 10, icon: dummyIcon },
          { id: 'tabC', title: 'C', order: 10, icon: dummyIcon },
        ],
      },
    ];

    registerFeatures(manifests);
    const tabs = getTabs();

    expect(tabs.map(t => t.id)).toEqual(['tabA', 'tabC', 'tabB']);
  });

  it('throws on duplicate feature id', () => {
    registerFeatures([{ id: 'feature-one' }]);

    expect(() => {
      registerFeatures([{ id: 'feature-one' }]);
    }).toThrow('Duplicate feature id: "feature-one"');
  });

  it('throws on duplicate tab id', () => {
    const dummyIcon = () => null as never;
    const manifests: FeatureManifest[] = [
      {
        id: 'f1',
        tabs: [{ id: 'tab1', title: 'Tab 1', order: 1, icon: dummyIcon }],
      },
      {
        id: 'f2',
        tabs: [{ id: 'tab1', title: 'Duplicate Tab 1', order: 2, icon: dummyIcon }],
      },
    ];

    expect(() => {
      registerFeatures(manifests);
    }).toThrow('Duplicate tab id: "tab1"');
  });

  it('filters sub-tabs by tabId and sorts by order', () => {
    const dummyComponent = () => null;
    const manifests: FeatureManifest[] = [
      {
        id: 'f1',
        subTabs: [
          { tabId: 'tab1', id: 'sub2', title: 'Sub 2', order: 2, component: dummyComponent },
          { tabId: 'tab1', id: 'sub1', title: 'Sub 1', order: 1, component: dummyComponent },
          { tabId: 'tab2', id: 'sub3', title: 'Sub 3', order: 1, component: dummyComponent },
        ],
      },
    ];

    registerFeatures(manifests);
    const tab1SubTabs = getSubTabs('tab1');
    const tab2SubTabs = getSubTabs('tab2');

    expect(tab1SubTabs.map(s => s.id)).toEqual(['sub1', 'sub2']);
    expect(tab2SubTabs.map(s => s.id)).toEqual(['sub3']);
  });

  it('throws on duplicate sub-tab id within the same tab', () => {
    const dummyComponent = () => null;
    const manifests: FeatureManifest[] = [
      {
        id: 'f1',
        subTabs: [
          { tabId: 'tab1', id: 'sub1', title: 'Sub 1', order: 1, component: dummyComponent },
          { tabId: 'tab1', id: 'sub1', title: 'Duplicate Sub 1', order: 2, component: dummyComponent },
        ],
      },
    ];

    expect(() => {
      registerFeatures(manifests);
    }).toThrow('Duplicate sub-tab id in tab "tab1": "sub1"');
  });

  it('allows same sub-tab id across different tabs', () => {
    const dummyComponent = () => null;
    const manifests: FeatureManifest[] = [
      {
        id: 'f1',
        subTabs: [
          { tabId: 'tab1', id: 'overview', title: 'Overview 1', order: 1, component: dummyComponent },
          { tabId: 'tab2', id: 'overview', title: 'Overview 2', order: 1, component: dummyComponent },
        ],
      },
    ];

    expect(() => {
      registerFeatures(manifests);
    }).not.toThrow();
  });

  it('sorts slot items by order and returns empty array for unknown or empty slot', () => {
    const dummyComponent = () => null;
    const manifests: FeatureManifest[] = [
      {
        id: 'f1',
        slots: {
          'home.dashboard': [
            { id: 'w2', order: 20, component: dummyComponent },
            { id: 'w1', order: 10, component: dummyComponent },
          ],
        },
      },
    ];

    registerFeatures(manifests);

    const dashboardItems = getSlotItems('home.dashboard');
    expect(dashboardItems.map(i => i.id)).toEqual(['w1', 'w2']);

    const emptyItems = getSlotItems('focus.setupHints');
    expect(emptyItems).toEqual([]);
  });

  it('throws on duplicate slot item id within the same slot', () => {
    const dummyComponent = () => null;
    const manifests: FeatureManifest[] = [
      {
        id: 'f1',
        slots: {
          'home.dashboard': [
            { id: 'w1', order: 1, component: dummyComponent },
            { id: 'w1', order: 2, component: dummyComponent },
          ],
        },
      },
    ];

    expect(() => {
      registerFeatures(manifests);
    }).toThrow('Duplicate slot item id in slot "home.dashboard": "w1"');
  });

  it('collects screens, backup providers, and runs inits', async () => {
    let init1Ran = false;
    let init2Ran = false;

    const manifests: FeatureManifest[] = [
      {
        id: 'f1',
        screens: [{ name: 'Screen1', component: () => null }],
        backup: {
          id: 'b2',
          order: 2,
          export: async () => ({}),
          clear: async () => {},
          import: async () => {},
        },
        init: () => {
          init1Ran = true;
        },
      },
      {
        id: 'f2',
        screens: [{ name: 'Screen2', component: () => null }],
        backup: {
          id: 'b1',
          order: 1,
          export: async () => ({}),
          clear: async () => {},
          import: async () => {},
        },
        init: async () => {
          init2Ran = true;
        },
      },
    ];

    registerFeatures(manifests);

    expect(getScreens().map(s => s.name)).toEqual(['Screen1', 'Screen2']);
    expect(getBackupProviders().map(b => b.id)).toEqual(['b1', 'b2']);

    await runFeatureInits();
    expect(init1Ran).toBe(true);
    expect(init2Ran).toBe(true);
  });
});

