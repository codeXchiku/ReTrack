import React from 'react';
import Svg, { Path } from 'react-native-svg';
import type { IconProps } from './types';

export function CheckIcon({
  color = '#FFFFFF',
  size = 24,
  strokeWidth = 2,
}: IconProps): React.JSX.Element {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M20 6L9 17L4 12"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

