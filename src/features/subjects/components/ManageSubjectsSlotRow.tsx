import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { navigateToScreen } from '@/core/navigation';
import { useTheme } from '@/core/theme';
import { Text } from '@/core/ui';
import { ChevronIcon } from '@/core/ui/icons';

/**
 * Settings slot item row allowing navigation to the ManageSubjects screen.
 */
export function ManageSubjectsSlotRow(): React.JSX.Element {
  const { tokens } = useTheme();

  return (
    <Pressable
      onPress={() => navigateToScreen('ManageSubjects')}
      accessibilityRole="button"
      accessibilityLabel="Manage subjects"
      style={[
        styles.row,
        {
          backgroundColor: tokens.colors.surface,
          borderColor: tokens.colors.border,
          borderRadius: tokens.radii.md,
        },
      ]}
    >
      <Text variant="body" color="text" style={styles.label}>
        Manage subjects
      </Text>
      <View style={styles.trailing}>
        <ChevronIcon direction="right" size={20} color={tokens.colors.textMuted} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 52,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
  },
  label: {
    fontWeight: '500',
  },
  trailing: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});
