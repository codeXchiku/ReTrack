import React, { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { type ThemeMode, useTheme } from '@/core/theme';
import {
  BoltIcon,
  BottomSheet,
  Button,
  Card,
  CardsIcon,
  CheckIcon,
  ChevronIcon,
  Chip,
  CloseIcon,
  confirm,
  EmptyState,
  FlameIcon,
  HomeIcon,
  PlusIcon,
  ProgressBar,
  ProgressRing,
  Screen,
  SegmentedControl,
  SettingsIcon,
  showToast,
  Text,
  TextField,
  TimerIcon,
  Toggle,
  UserIcon,
} from '@/core/ui';

/**
 * Dev-only gallery showcasing all design system components and live theme switching.
 */
export function UiGallery(): React.JSX.Element {
  const { tokens, isDark, mode, setMode } = useTheme();

  const [toggleVal, setToggleVal] = useState(false);
  const [selectedChip, setSelectedChip] = useState('react');
  const [segmentVal, setSegmentVal] = useState<'A' | 'B' | 'C'>('A');
  const [textInputVal, setTextInputVal] = useState('');
  const [sheetInputVal, setSheetInputVal] = useState('');
  const [sheetVisible, setSheetVisible] = useState(false);
  const [ringProgress, setRingProgress] = useState(0.7);

  const themeOptions: { id: ThemeMode; label: string }[] = [
    { id: 'dark', label: 'Dark' },
    { id: 'light', label: 'Light' },
    { id: 'system', label: 'System' },
  ];

  const handleTestConfirm = async () => {
    const result = await confirm({
      title: 'Reset All Progress?',
      message: 'This will reset your study streaks and timers for today. This action cannot be undone.',
      confirmLabel: 'Reset',
      destructive: true,
    });
    showToast(result ? 'Action confirmed' : 'Action cancelled', result ? 'error' : 'info');
  };

  return (
    <Screen style={styles.flex}>
      <ScrollView
        style={styles.flex}
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Header & Theme Switcher */}
      <View style={styles.header}>
        <Text variant="display">Study Dojo</Text>
        <Text variant="caption" color="textMuted">
          Design System & Shared UI Kit (Active: {isDark ? 'Dark' : 'Light'})
        </Text>
        <View style={styles.spacer} />
        <SegmentedControl<ThemeMode>
          options={themeOptions}
          selectedId={mode}
          onSelect={newMode => setMode(newMode)}
          accessibilityLabel="Theme selector"
        />
      </View>

      {/* Typography */}
      <Section title="Typography Scale">
        <Card style={styles.gap12}>
          <Text variant="display">Display 40</Text>
          <Text variant="title">Title 22 Bold</Text>
          <Text variant="heading">Heading 17 Semibold</Text>
          <Text variant="body">Body 15 Regular for general content</Text>
          <Text variant="caption" color="textMuted">
            Caption 12 Regular for annotations
          </Text>
          <Text variant="timer" color="focus">
            25:00
          </Text>
        </Card>
      </Section>

      {/* Buttons */}
      <Section title="Buttons & Sizes">
        <View style={styles.gap12}>
          <Button
            title="Primary Button (md)"
            variant="primary"
            onPress={() => showToast('Primary button pressed', 'info')}
          />
          <Button
            title="Secondary Button (lg)"
            variant="secondary"
            size="lg"
            onPress={() => showToast('Secondary button pressed', 'info')}
          />
          <Button
            title="Danger Button"
            variant="danger"
            onPress={() => showToast('Danger action triggered', 'error')}
          />
          <Button
            title="Ghost Button"
            variant="ghost"
            onPress={() => showToast('Ghost button pressed', 'info')}
          />
          <View style={styles.row}>
            <View style={styles.flex}>
              <Button
                title="Loading"
                loading
                variant="primary"
                onPress={() => {}}
              />
            </View>
            <View style={styles.flex}>
              <Button
                title="Disabled"
                disabled
                variant="secondary"
                onPress={() => {}}
              />
            </View>
          </View>
        </View>
      </Section>

      {/* Chips */}
      <Section title="Chips & Subject Colors">
        <View style={styles.chipRow}>
          {tokens.subjects.map(sub => (
            <Chip
              key={sub.id}
              label={sub.name}
              colorDot={sub.color}
              selected={selectedChip === sub.id}
              onPress={() => setSelectedChip(sub.id)}
            />
          ))}
        </View>
      </Section>

      {/* Toggle & SegmentedControl */}
      <Section title="Toggle & Controls">
        <Card style={styles.gap16}>
          <View style={styles.switchRow}>
            <Text variant="body">Do Not Disturb (Silence)</Text>
            <Toggle
              value={toggleVal}
              onValueChange={v => {
                setToggleVal(v);
                showToast(`Silence mode ${v ? 'enabled' : 'disabled'}`, 'info');
              }}
            />
          </View>
          <SegmentedControl<'A' | 'B' | 'C'>
            options={[
              { id: 'A', label: 'Simple' },
              { id: 'B', label: 'Pomodoro' },
              { id: 'C', label: 'Stopwatch' },
            ]}
            selectedId={segmentVal}
            onSelect={v => setSegmentVal(v)}
          />
        </Card>
      </Section>

      {/* Progress Indicators */}
      <Section title="Progress Indicators">
        <Card style={styles.centerCard}>
          <ProgressRing
            progress={ringProgress}
            size={130}
            strokeWidth={10}
            color={tokens.colors.primary}
          >
            <View style={styles.alignCenter}>
              <Text variant="heading">{Math.round(ringProgress * 100)}%</Text>
              <Text variant="caption" color="textMuted">
                Daily Goal
              </Text>
            </View>
          </ProgressRing>
          <View style={styles.spacer16} />
          <Button
            title={`Toggle Progress (${ringProgress === 0.7 ? '0%' : '70%'})`}
            variant="secondary"
            onPress={() => setRingProgress(prev => (prev === 0.7 ? 0 : 0.7))}
          />
          <View style={styles.spacer16} />
          <ProgressBar progress={ringProgress} />
        </Card>
      </Section>

      {/* Form Fields */}
      <Section title="Text Input">
        <Card>
          <TextField
            label="Subject Name"
            placeholder="e.g. Mathematics"
            value={textInputVal}
            onChangeText={setTextInputVal}
            maxLength={30}
          />
          <TextField
            label="Notes (Multiline with Error)"
            placeholder="Type notes here..."
            value="Exceeds maximum character limit"
            onChangeText={() => {}}
            multiline
            numberOfLines={3}
            error="Please shorten this description."
          />
        </Card>
      </Section>

      {/* Overlays: BottomSheet, Toast, ConfirmDialog */}
      <Section title="Overlays & Feedback">
        <View style={styles.gap12}>
          <Button
            title="Open BottomSheet"
            variant="secondary"
            onPress={() => setSheetVisible(true)}
          />
          <Button
            title="Trigger Success Toast"
            variant="secondary"
            onPress={() => showToast('Changes saved successfully!', 'success')}
          />
          <Button
            title="Show Confirm Dialog"
            variant="danger"
            onPress={handleTestConfirm}
          />
        </View>
      </Section>

      {/* SVG Icon Set */}
      <Section title="SVG Icon Set (24x24)">
        <Card style={styles.iconGrid}>
          <IconItem label="Home">
            <HomeIcon color={tokens.colors.primary} />
          </IconItem>
          <IconItem label="Timer">
            <TimerIcon color={tokens.colors.focus} />
          </IconItem>
          <IconItem label="Cards">
            <CardsIcon color={tokens.colors.accent} />
          </IconItem>
          <IconItem label="User">
            <UserIcon color={tokens.colors.text} />
          </IconItem>
          <IconItem label="Plus">
            <PlusIcon color={tokens.colors.success} />
          </IconItem>
          <IconItem label="Check">
            <CheckIcon color={tokens.colors.success} />
          </IconItem>
          <IconItem label="Close">
            <CloseIcon color={tokens.colors.danger} />
          </IconItem>
          <IconItem label="Chevron">
            <ChevronIcon color={tokens.colors.textMuted} />
          </IconItem>
          <IconItem label="Settings">
            <SettingsIcon color={tokens.colors.textMuted} />
          </IconItem>
          <IconItem label="Flame">
            <FlameIcon color="#FB923C" />
          </IconItem>
          <IconItem label="Bolt">
            <BoltIcon color={tokens.colors.primary} />
          </IconItem>
        </Card>
      </Section>

      {/* Empty State */}
      <Section title="Empty State">
        <Card>
          <EmptyState
            icon={<CardsIcon size={48} color={tokens.colors.textMuted} />}
            title="No Cards Due"
            message="You have reviewed all your flashcards for today. Great job keeping up the streak!"
            actionLabel="Add New Card"
            onAction={() => showToast('New card prompt opened', 'info')}
          />
        </Card>
      </Section>
    </ScrollView>

    {/* BottomSheet Component */}
      <BottomSheet
        visible={sheetVisible}
        onClose={() => setSheetVisible(false)}
      >
        <Text variant="title" style={styles.sheetTitle}>
          Edit Subject
        </Text>
        <Text variant="body" color="textMuted" style={styles.sheetSubtitle}>
          Drag down or tap backdrop to dismiss. Field stays visible above the keyboard.
        </Text>
        <TextField
          label="Subject Title"
          placeholder="Enter subject name..."
          value={sheetInputVal}
          onChangeText={setSheetInputVal}
          autoFocus
        />
        <View style={styles.spacer12} />
        <Button
          title="Done"
          variant="primary"
          onPress={() => {
            setSheetVisible(false);
            showToast('Subject updated', 'success');
          }}
        />
      </BottomSheet>
    </Screen>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.section}>
      <Text variant="heading" color="textMuted" style={styles.sectionHeader}>
        {title}
      </Text>
      {children}
    </View>
  );
}

function IconItem({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.iconCell}>
      {children}
      <Text variant="caption" color="textMuted" style={styles.iconLabel}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    paddingBottom: 48,
  },
  header: {
    marginBottom: 24,
  },
  spacer: {
    height: 16,
  },
  spacer12: {
    height: 12,
  },
  spacer16: {
    height: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  gap12: {
    gap: 12,
  },
  gap16: {
    gap: 16,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  flex: {
    flex: 1,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  centerCard: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  alignCenter: {
    alignItems: 'center',
  },
  iconGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 16,
    padding: 16,
  },
  iconCell: {
    width: '28%',
    alignItems: 'center',
    paddingVertical: 8,
  },
  iconLabel: {
    marginTop: 6,
    fontSize: 11,
  },
  sheetTitle: {
    marginTop: 8,
    marginBottom: 4,
  },
  sheetSubtitle: {
    marginBottom: 16,
  },
});

