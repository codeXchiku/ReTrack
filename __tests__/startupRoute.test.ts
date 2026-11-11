import {
  clearRegistry,
  getStartupRoute,
  registerFeatures,
} from '@/core/registry';

describe('core/registry/startupRoute', () => {
  beforeEach(() => {
    clearRegistry();
  });

  afterEach(() => {
    clearRegistry();
  });

  it('returns null when no startup routes registered', () => {
    expect(getStartupRoute()).toBeNull();
  });

  it('returns null when all resolvers return null', () => {
    registerFeatures([
      {
        id: 'feat1',
        startupRoute: {
          order: 10,
          resolve: () => null,
        },
      },
      {
        id: 'feat2',
        startupRoute: {
          order: 20,
          resolve: () => null,
        },
      },
    ]);

    expect(getStartupRoute()).toBeNull();
  });

  it('returns the first non-null route in order', () => {
    registerFeatures([
      {
        id: 'featB',
        startupRoute: {
          order: 20,
          resolve: () => 'SecondRoute',
        },
      },
      {
        id: 'featA',
        startupRoute: {
          order: 10,
          resolve: () => 'FirstRoute',
        },
      },
    ]);

    // Order 10 should win over order 20
    expect(getStartupRoute()).toBe('FirstRoute');
  });

  it('skips null resolvers and picks next lowest order with valid route', () => {
    registerFeatures([
      {
        id: 'featA',
        startupRoute: {
          order: 10,
          resolve: () => null,
        },
      },
      {
        id: 'featB',
        startupRoute: {
          order: 20,
          resolve: () => 'ActiveRoute',
        },
      },
      {
        id: 'featC',
        startupRoute: {
          order: 30,
          resolve: () => 'LaterRoute',
        },
      },
    ]);

    expect(getStartupRoute()).toBe('ActiveRoute');
  });
});
