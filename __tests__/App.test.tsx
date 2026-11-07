import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import { App } from '@/app/App';

describe('App', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    ReactTestRenderer.act(() => {
      jest.runOnlyPendingTimers();
    });
    jest.useRealTimers();
  });

  it('renders correctly via "@/..." alias', async () => {
    let renderer: ReactTestRenderer.ReactTestRenderer | undefined;
    await ReactTestRenderer.act(async () => {
      renderer = ReactTestRenderer.create(<App />);
      jest.runAllTimers();
    });
    expect(renderer).toBeDefined();
    const tree = renderer?.toJSON();
    const treeStr = JSON.stringify(tree);
    expect(treeStr.includes('Home') || treeStr.includes('Study Dojo')).toBe(true);

    ReactTestRenderer.act(() => {
      renderer?.unmount();
    });
  });
});
