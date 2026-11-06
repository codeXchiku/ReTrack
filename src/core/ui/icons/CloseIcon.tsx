import React from 'react';
import Svg, { Path } from 'react-native-svg';
import type { IconProps } from './types';

export function CloseIcon({
  color = '#FFFFFF',
  size = 24,
  strokeWidth = 2,
}: IconProps): React.JSX.Element {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M18 6L6 18M6 6L18 18"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

