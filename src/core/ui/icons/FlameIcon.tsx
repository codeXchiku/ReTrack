import React from 'react';
import Svg, { Path } from 'react-native-svg';
import type { IconProps } from './types';

export function FlameIcon({
  color = '#FFFFFF',
  size = 24,
  strokeWidth = 2,
}: IconProps): React.JSX.Element {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 2C12 2 16 6 16 11C16 13.5 14.5 15.5 13 16.5C12 17.2 11.5 18 11.5 19C11.5 20.1 12.4 21 13.5 21C16.5 21 20 18 20 12C20 6.5 16 3 16 3C16 3 15 5.5 13.5 6.5C12 7.5 10 9 10 12C10 12.5 10.1 13 10.3 13.5C9.5 13 8 11.8 8 10C8 7 12 2 12 2Z"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

