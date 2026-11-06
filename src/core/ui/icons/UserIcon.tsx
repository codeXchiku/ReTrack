import React from 'react';
import Svg, { Circle, Path } from 'react-native-svg';
import type { IconProps } from './types';

export function UserIcon({
  color = '#FFFFFF',
  size = 24,
  strokeWidth = 2,
}: IconProps): React.JSX.Element {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle
        cx="12"
        cy="7"
        r="4"
        stroke={color}
        strokeWidth={strokeWidth}
      />
      <Path
        d="M5 21C5 17.134 8.13401 14 12 14C15.866 14 19 17.134 19 21"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
      />
    </Svg>
  );
}

