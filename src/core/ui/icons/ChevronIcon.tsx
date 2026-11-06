import React from 'react';
import Svg, { Path } from 'react-native-svg';
import type { IconProps } from './types';

export type ChevronDirection = 'up' | 'down' | 'left' | 'right';

export type ChevronIconProps = IconProps & {
  direction?: ChevronDirection;
};

export function ChevronIcon({
  color = '#FFFFFF',
  size = 24,
  strokeWidth = 2,
  direction = 'right',
}: ChevronIconProps): React.JSX.Element {
  const getPath = () => {
    switch (direction) {
      case 'up':
        return 'M18 15L12 9L6 15';
      case 'down':
        return 'M6 9L12 15L18 9';
      case 'left':
        return 'M15 18L9 12L15 6';
      case 'right':
      default:
        return 'M9 18L15 12L9 6';
    }
  };

  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d={getPath()}
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

