import React from 'react';
import Svg, { Circle, Path } from 'react-native-svg';
import type { IconProps } from './types';

export function TimerIcon({
  color = '#FFFFFF',
  size = 24,
  strokeWidth = 2,
}: IconProps): React.JSX.Element {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle
        cx="12"
        cy="13"
        r="8"
        stroke={color}
        strokeWidth={strokeWidth}
      />
      <Path
        d="M12 9V13L15 15"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M10 3H14"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
      />
    </Svg>
  );
}

