import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import { App } from '@/app/App';

describe('App', () => {
  it('renders correctly via "@/..." alias', async () => {
    let renderer: ReactTestRenderer.ReactTestRenderer | undefined;
    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(<App />);
    });
    expect(renderer).toBeDefined();
    const tree = renderer?.toJSON();
    expect(JSON.stringify(tree)).toContain('Study Dojo');
  });
});
