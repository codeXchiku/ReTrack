import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { MaterialTopTabBarProps } from '@react-navigation/material-top-tabs';
import { useTheme } from '@/core/theme';

export function SubTabBar({
  state,
  descriptors,
  navigation,
}: MaterialTopTabBarProps): React.JSX.Element {
  const { tokens } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: tokens.colors.background,
          borderBottomColor: tokens.colors.border,
          paddingTop: insets.top,
          height: 48 + insets.top,
        },
      ]}
      accessibilityRole="tablist"
    >
      {state.routes.map((route, index) => {
        const isFocused = state.index === index;
        const descriptor = descriptors[route.key];
        const title = descriptor?.options.title ?? route.name;
        const color = isFocused ? tokens.colors.text : tokens.colors.textMuted;

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

        return (
          <Pressable
            key={route.key}
            onPress={onPress}
            style={styles.tabButton}
            accessibilityRole="tab"
            accessibilityState={{ selected: isFocused }}
            accessibilityLabel={`${title} SubTab`}
          >
            <Text
              style={[
                styles.label,
                isFocused ? styles.labelFocused : styles.labelUnfocused,
                { color },
              ]}
              maxFontSizeMultiplier={1.3}
            >
              {title}
            </Text>
            {isFocused ? (
              <View
                style={[
                  styles.activeIndicator,
                  { backgroundColor: tokens.colors.primary },
                ]}
              />
            ) : (
              <View style={styles.inactiveIndicator} />
            )}
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    minHeight: 48,
    borderBottomWidth: 1,
  },
  tabButton: {
    flex: 1,
    height: 48,
    minHeight: 48,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  label: {
    fontSize: 15,
    textAlign: 'center',
  },
  labelFocused: {
    fontWeight: '700',
  },
  labelUnfocused: {
    fontWeight: '500',
  },
  activeIndicator: {
    position: 'absolute',
    bottom: 0,
    width: 36,
    height: 2,
    borderRadius: 1,
  },
  inactiveIndicator: {
    position: 'absolute',
    bottom: 0,
    width: 36,
    height: 2,
    backgroundColor: 'transparent',
  },
});
