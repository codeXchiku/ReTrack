import React from 'react';
import { Text } from 'react-native';
import ReactTestRenderer from 'react-test-renderer';
import { clearRegistry, registerFeatures } from '@/core/registry/featureRegistry';
import { Slot } from '@/core/registry/Slot';

describe('Slot component & SlotErrorBoundary', () => {
  beforeEach(() => {
    clearRegistry();
  });

  it('a throwing slot item does not prevent siblings from rendering', async () => {
    const GoodWidget1 = () => <Text>Widget 1</Text>;
    const BrokenWidget = () => {
      throw new Error('Faulty widget failed to render');
    };
    const GoodWidget3 = () => <Text>Widget 3</Text>;

    registerFeatures([
      {
        id: 'test-feature',
        slots: {
          'home.dashboard': [
            { id: 'w1', order: 1, component: GoodWidget1 },
            { id: 'w2', order: 2, component: BrokenWidget },
            { id: 'w3', order: 3, component: GoodWidget3 },
          ],
        },
      },
    ]);

    // Suppress console.error in this test because ErrorBoundary logs the caught error
    const spy = jest.spyOn(console, 'error').mockImplementation(() => {});

    let renderer: ReactTestRenderer.ReactTestRenderer | undefined;
    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(<Slot name="home.dashboard" />);
    });

    const output = JSON.stringify(renderer?.toJSON());

    expect(output).toContain('Widget 1');
    expect(output).toContain('Widget 3');
    expect(output).not.toContain('Faulty widget');

    spy.mockRestore();
  });

  it('forwards props to slot item components', async () => {
    type WidgetProps = { label?: unknown };
    const ParamWidget = (props: WidgetProps) => (
      <Text>Received: {String(props.label)}</Text>
    );

    registerFeatures([
      {
        id: 'prop-feature',
        slots: {
          'settings.sections': [
            { id: 'pw', order: 1, component: ParamWidget as React.ComponentType<Record<string, unknown>> },
          ],
        },
      },
    ]);

    let renderer: ReactTestRenderer.ReactTestRenderer | undefined;
    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(
        <Slot name="settings.sections" props={{ label: 'CustomLabel' }} />,
      );
    });

    const output = JSON.stringify(renderer?.toJSON());
    expect(output).toContain('CustomLabel');
  });
});

