import React from 'react';
import Svg, { Path, Rect } from 'react-native-svg';
import type { IconProps } from './types';

export function CardsIcon({
  color = '#FFFFFF',
  size = 24,
  strokeWidth = 2,
}: IconProps): React.JSX.Element {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect
        x="3"
        y="5"
        width="14"
        height="16"
        rx="2"
        stroke={color}
        strokeWidth={strokeWidth}
      />
      <Path
        d="M7 3H19C20.1046 3 21 3.89543 21 5V17"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
      />
    </Svg>
  );
}

