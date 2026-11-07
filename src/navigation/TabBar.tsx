import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { navigateToScreen } from '@/core/navigation';
import { getTabs, type TabDef } from '@/core/registry';
import { useTheme } from '@/core/theme';

export function TabBar({
  state,
  navigation,
}: BottomTabBarProps): React.JSX.Element {
  const insets = useSafeAreaInsets();
  const { tokens } = useTheme();
  const tabs = getTabs();
  const tabMap = new Map<string, TabDef>(tabs.map(t => [t.id, t]));

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: tokens.colors.surface,
          borderTopColor: tokens.colors.border,
          paddingBottom: Math.max(insets.bottom, 8),
        },
      ]}
      accessibilityRole="tablist"
    >
      {state.routes.map((route, index) => {
        const isFocused = state.index === index;
        const tab = tabMap.get(route.name);
        const title = tab?.title ?? route.name;
        const activeColor = tokens.colors.primary;
        const inactiveColor = tokens.colors.textMuted;
        const color = isFocused ? activeColor : inactiveColor;

        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });

          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        };

        const onLongPress = () => {
          navigation.emit({
            type: 'tabLongPress',
            target: route.key,
          });

          // Long press on 'me' tab in dev builds opens DevMenu
          if (typeof __DEV__ !== 'undefined' && __DEV__ && route.name === 'me') {
            navigateToScreen('DevMenu');
          }
        };

        return (
          <Pressable
            key={route.key}
            onPress={onPress}
            onLongPress={onLongPress}
            style={styles.tabButton}
            accessibilityRole="tab"
            accessibilityState={{ selected: isFocused }}
            accessibilityLabel={`${title} Tab`}
            hitSlop={4}
          >
            {tab?.icon && (
              <View style={styles.iconContainer}>
                {tab.icon({ color, size: 24 })}
              </View>
            )}
            <Text
              style={[
                styles.label,
                isFocused ? styles.labelFocused : styles.labelUnfocused,
                { color },
              ]}
              maxFontSizeMultiplier={1.3}
              numberOfLines={1}
            >
              {title}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    height: 64,
    borderTopWidth: 1,
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  tabButton: {
    flex: 1,
    height: 48,
    minHeight: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconContainer: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  label: {
    fontSize: 11,
    textAlign: 'center',
  },
  labelFocused: {
    fontWeight: '600',
  },
  labelUnfocused: {
    fontWeight: '400',
  },
});
