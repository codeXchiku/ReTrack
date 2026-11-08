import React, { useState } from 'react';
import {
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import { useTheme, subjectColors } from '@/core/theme';
import { Button, Text, TextField } from '@/core/ui';
import {
  OnboardingStepLayout,
  type OnboardingStepProps,
} from '@/features/onboarding';
import { useSubjectsStore } from '../store/subjectsStore';

const PRESET_SUBJECTS = [
  'Physics',
  'Chemistry',
  'Biology',
  'Maths',
  'English',
  'History',
  'Geography',
  'Polity',
  'Economics',
  'Reasoning',
];

/**
 * Onboarding step for choosing initial subjects.
 */
export function SubjectsStep({
  onContinue,
  onSkip,
}: OnboardingStepProps): React.JSX.Element {
  const { tokens } = useTheme();
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [customName, setCustomName] = useState('');
  const [customList, setCustomList] = useState<string[]>([]);
  const addSubject = useSubjectsStore(state => state.add);

  const toggleSubject = (name: string) => {
    setSelectedSubjects(prev =>
      prev.includes(name) ? prev.filter(s => s !== name) : [...prev, name],
    );
  };

  const handleAddCustom = () => {
    const trimmed = customName.trim();
    if (!trimmed) {
      return;
    }
    if (trimmed.length > 30) {
      return;
    }
    const allPresetsLower = PRESET_SUBJECTS.map(s => s.toLowerCase());
    const allCustomLower = customList.map(s => s.toLowerCase());
    const lower = trimmed.toLowerCase();

    if (allPresetsLower.includes(lower)) {
      // Find preset with matching name
      const found = PRESET_SUBJECTS.find(s => s.toLowerCase() === lower);
      if (found && !selectedSubjects.includes(found)) {
        setSelectedSubjects(prev => [...prev, found]);
      }
    } else if (!allCustomLower.includes(lower)) {
      setCustomList(prev => [...prev, trimmed]);
      setSelectedSubjects(prev => [...prev, trimmed]);
    } else {
      // Already in custom, ensure selected
      const found = customList.find(s => s.toLowerCase() === lower);
      if (found && !selectedSubjects.includes(found)) {
        setSelectedSubjects(prev => [...prev, found]);
      }
    }
    setCustomName('');
  };

  const handleContinue = async () => {
    const existing = useSubjectsStore.getState().subjects;
    const existingLower = new Set(existing.map(s => s.name.toLowerCase()));

    let colorIndex = existing.length;
    for (const name of selectedSubjects) {
      if (!existingLower.has(name.toLowerCase())) {
        const color =
          subjectColors[colorIndex % subjectColors.length]?.color ?? '#3B82F6';
        await addSubject({ name, color });
        existingLower.add(name.toLowerCase());
        colorIndex++;
      }
    }
    onContinue();
  };

  const allDisplaySubjects = [...PRESET_SUBJECTS, ...customList];

  return (
    <OnboardingStepLayout
      title="What are you studying?"
      body="Choose your subjects or add custom ones. You can always change these later."
      primaryLabel="Continue"
      onPrimary={handleContinue}
      secondaryLabel="Skip"
      onSecondary={onSkip}
      accessibilityLabel="Onboarding Subjects Step"
    >
      <View style={styles.container}>
        {/* Preset & Custom Chips */}
        <View style={[styles.chipsContainer, { gap: tokens.spacing.sm }]}>
          {allDisplaySubjects.map(subject => {
            const isSelected = selectedSubjects.includes(subject);
            return (
              <Pressable
                key={subject}
                onPress={() => toggleSubject(subject)}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: isSelected }}
                accessibilityLabel={`${subject} subject chip`}
                style={[
                  styles.chip,
                  {
                    backgroundColor: isSelected
                      ? tokens.colors.primary
                      : tokens.colors.surface,
                    borderColor: isSelected
                      ? tokens.colors.primary
                      : tokens.colors.border,
                    borderRadius: tokens.radii.pill,
                  },
                ]}
              >
                <Text
                  variant="body"
                  color={isSelected ? 'onPrimary' : 'text'}
                  style={styles.chipText}
                >
                  {subject}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* Custom Subject Input */}
        <View style={[styles.customRow, { marginTop: tokens.spacing.md, gap: tokens.spacing.sm }]}>
          <View style={styles.customInputWrap}>
            <TextField
              value={customName}
              onChangeText={setCustomName}
              placeholder="Add your own..."
              maxLength={30}
              accessibilityLabel="Add custom subject input"
            />
          </View>
          <Button
            title="Add"
            variant="secondary"
            onPress={handleAddCustom}
            disabled={!customName.trim()}
            accessibilityLabel="Add custom subject button"
            style={styles.addButton}
          />
        </View>
      </View>
    </OnboardingStepLayout>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  chipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderWidth: 1,
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chipText: {
    fontWeight: '500',
  },
  customRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  customInputWrap: {
    flex: 1,
  },
  addButton: {
    height: 48,
    minWidth: 70,
  },
});
