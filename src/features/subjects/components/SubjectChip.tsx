import React from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import { Chip } from '@/core/ui';

export type SubjectChipProps = {
  name: string;
  color: string;
  selected?: boolean;
  onPress?: () => void;
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
};

/**
 * Chip displaying a subject color dot and name, with selectable state and 44dp touch area.
 */
export function SubjectChip({
  name,
  color,
  selected = false,
  onPress,
  accessibilityLabel,
  style,
}: SubjectChipProps): React.JSX.Element {
  return (
    <Chip
      label={name}
      selected={selected}
      colorDot={color}
      onPress={onPress}
      accessibilityLabel={
        accessibilityLabel ?? `Subject ${name}${selected ? ', selected' : ''}`
      }
      style={style}
    />
  );
}
