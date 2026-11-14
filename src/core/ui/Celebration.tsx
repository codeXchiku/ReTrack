import React, { useEffect, useMemo, useState } from 'react';
import { AccessibilityInfo, StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';
import Svg, { Circle, Rect } from 'react-native-svg';
import { useTheme } from '@/core/theme';

export interface ParticleConfig {
  id: number;
  shape: 'circle' | 'rect';
  color: string;
  size: number;
  targetX: number;
  targetY: number;
  gravity: number;
  targetRotate: number;
}

interface ParticleProps {
  particle: ParticleConfig;
  progress: SharedValue<number>;
}

function Particle({ particle, progress }: ParticleProps): React.JSX.Element {
  const animatedStyle = useAnimatedStyle(() => {
    'worklet';
    const p = progress.value;
    const x = particle.targetX * p;
    const y = particle.targetY * p + particle.gravity * p * p;
    const opacity = p > 0.7 ? Math.max(0, 1 - (p - 0.7) / 0.3) : 1;
    const rotation = particle.targetRotate * p;

    return {
      transform: [
        { translateX: x },
        { translateY: y },
        { rotate: `${rotation}deg` },
      ],
      opacity,
    };
  });

  return (
    <Animated.View style={[styles.particleWrapper, animatedStyle]} pointerEvents="none">
      <Svg width={particle.size * 2} height={particle.size * 2} viewBox={`0 0 ${particle.size * 2} ${particle.size * 2}`}>
        {particle.shape === 'circle' ? (
          <Circle
            cx={particle.size}
            cy={particle.size}
            r={particle.size}
            fill={particle.color}
          />
        ) : (
          <Rect
            x={particle.size * 0.2}
            y={particle.size * 0.4}
            width={particle.size * 1.6}
            height={particle.size * 1.2}
            fill={particle.color}
            rx={1}
          />
        )}
      </Svg>
    </Animated.View>
  );
}

const TOTAL_PARTICLES = 24;

/**
 * Creates 24 deterministic confetti particle configurations using theme palette colors.
 */
function createParticles(colors: {
  primary: string;
  focus: string;
  accent: string;
  success: string;
  border: string;
}): ParticleConfig[] {
  const palette = [colors.primary, colors.focus, colors.accent, colors.success, colors.border];
  const list: ParticleConfig[] = [];

  for (let i = 0; i < TOTAL_PARTICLES; i++) {
    // Spread angles upwards and outwards: -165deg to -15deg
    const angleDeg = -165 + (i * 150) / (TOTAL_PARTICLES - 1);
    const angleRad = (angleDeg * Math.PI) / 180;
    // Vary velocity
    const speed = 120 + ((i * 37) % 130);
    const targetX = Math.cos(angleRad) * speed;
    const targetY = Math.sin(angleRad) * speed;
    const gravity = 220 + ((i * 29) % 120);
    const targetRotate = ((i * 53) % 720) - 360;
    const shape = i % 2 === 0 ? 'circle' : 'rect';
    const color = palette[i % palette.length] ?? colors.primary;
    const size = shape === 'circle' ? 4 + (i % 3) : 5 + (i % 4);

    list.push({
      id: i,
      shape,
      color,
      size,
      targetX,
      targetY,
      gravity,
      targetRotate,
    });
  }

  return list;
}

export interface CelebrationProps {
  /** Optional unique identifier to ensure the celebration fires once per session */
  runKey?: string;
}

/** Set of keys for celebrations that have already executed */
const executedKeys = new Set<string>();

/**
 * One-shot confetti burst of 24 SVG particles animated on the UI thread with Reanimated in 1.2s.
 * Plays once on mount, never loops, and is skipped when reduced motion is enabled.
 */
export function Celebration({ runKey }: CelebrationProps): React.JSX.Element | null {
  const { tokens } = useTheme();
  const colors = tokens.colors;
  const isReducedMotion = useReducedMotion();
  const [reducedMotionActive, setReducedMotionActive] = useState<boolean>(isReducedMotion);
  const progress = useSharedValue(0);

  // Check accessibility reduced motion state dynamically
  useEffect(() => {
    let mounted = true;
    AccessibilityInfo.isReduceMotionEnabled()
      .then(enabled => {
        if (mounted && enabled) {
          setReducedMotionActive(true);
        }
      })
      .catch(() => {});

    return () => {
      mounted = false;
    };
  }, []);

  const shouldRun = useMemo(() => {
    if (isReducedMotion || reducedMotionActive) {
      return false;
    }
    if (runKey) {
      if (executedKeys.has(runKey)) {
        return false;
      }
      executedKeys.add(runKey);
    }
    return true;
  }, [isReducedMotion, reducedMotionActive, runKey]);

  useEffect(() => {
    if (shouldRun) {
      progress.value = withTiming(1, {
        duration: 1200,
        easing: Easing.out(Easing.quad),
      });
    }
  }, [shouldRun, progress]);

  const particles = useMemo(() => createParticles(colors), [colors]);

  if (!shouldRun) {
    return null;
  }

  return (
    <View style={styles.container} pointerEvents="none" accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <View style={styles.origin}>
        {particles.map(p => (
          <Particle key={p.id} particle={p} progress={progress} />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFill,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 99,
  },
  origin: {
    position: 'absolute',
    top: '40%',
    left: '50%',
    width: 0,
    height: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  particleWrapper: {
    position: 'absolute',
  },
});
