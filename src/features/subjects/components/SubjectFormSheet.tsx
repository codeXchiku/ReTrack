import React, { useEffect, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { subjectColors, useTheme } from '@/core/theme';
import { BottomSheet, Button, Text, TextField } from '@/core/ui';
import { validateSubject } from '../logic/validateSubject';
import { useSubjects } from '../store/subjectsStore';

export type SubjectFormValues = {
  name: string;
  color: string;
};

export type SubjectFormSheetProps = {
  visible: boolean;
  onClose: () => void;
  onSave: (values: SubjectFormValues) => Promise<boolean> | boolean;
  initialValues?: {
    id?: string;
    name: string;
    color: string;
  };
};

const ERROR_MESSAGES: Record<string, string> = {
  empty: 'Name cannot be empty.',
  too_long: 'Name must be 30 characters or fewer.',
  duplicate: 'A subject with this name already exists.',
  bad_color: 'Please choose a color.',
};

/**
 * BottomSheet form to create or edit a subject.
 */
export function SubjectFormSheet({
  visible,
  onClose,
  onSave,
  initialValues,
}: SubjectFormSheetProps): React.JSX.Element {
  const { tokens } = useTheme();
  const subjects = useSubjects();

  const defaultColor = subjectColors[0]?.color ?? '#3B82F6';
  const [name, setName] = useState(initialValues?.name ?? '');
  const [selectedColor, setSelectedColor] = useState(
    initialValues?.color ?? defaultColor,
  );
  const [errorText, setErrorText] = useState<string | undefined>(undefined);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Sync state when initialValues or visibility changes
  useEffect(() => {
    if (visible) {
      setName(initialValues?.name ?? '');
      setSelectedColor(initialValues?.color ?? defaultColor);
      setErrorText(undefined);
      setIsSubmitting(false);
    }
  }, [visible, initialValues, defaultColor]);

  const existingNames = subjects.map(s => s.name);

  const handleNameChange = (text: string) => {
    setName(text);
    if (errorText) {
      setErrorText(undefined);
    }
  };

  const handleSave = async () => {
    const validation = validateSubject(
      { name, color: selectedColor },
      {
        existingNames,
        currentName: initialValues?.name,
      },
    );

    if (!validation.ok) {
      setErrorText(ERROR_MESSAGES[validation.error] ?? 'Invalid subject.');
      return;
    }

    try {
      setIsSubmitting(true);
      const success = await onSave({
        name: validation.value.name,
        color: validation.value.color,
      });
      if (success) {
        onClose();
      } else {
        setErrorText('Could not save subject.');
      }
    } catch {
      setErrorText('Could not save subject.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const isEditing = Boolean(initialValues?.id);

  return (
    <BottomSheet
      visible={visible}
      onClose={onClose}
      accessibilityLabel={isEditing ? 'Edit subject form' : 'New subject form'}
    >
      <ScrollView
        keyboardShouldPersistTaps="handled"
        bounces={false}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <Text variant="title" color="text" style={styles.title}>
          {isEditing ? 'Edit Subject' : 'New Subject'}
        </Text>

        <TextField
          label="Subject Name"
          placeholder="e.g. Physics, World History"
          value={name}
          onChangeText={handleNameChange}
          maxLength={30}
          error={errorText}
          autoFocus={visible}
          accessibilityLabel="Subject name input"
        />

        <Text
          variant="caption"
          color="textMuted"
          style={styles.colorSectionLabel}
        >
          COLOR
        </Text>

        <View
          style={styles.swatchesRow}
          accessibilityLabel="Subject color options"
        >
          {subjectColors.map(c => {
            const isSelected =
              selectedColor.toLowerCase() === c.color.toLowerCase();
            return (
              <Pressable
                key={c.id}
                onPress={() => setSelectedColor(c.color)}
                accessibilityRole="button"
                accessibilityLabel={`${c.name} color${isSelected ? ', selected' : ''}`}
                accessibilityState={{ selected: isSelected }}
                hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
                style={styles.swatchTouchArea}
              >
                <View
                  style={[
                    styles.swatchCircle,
                    { backgroundColor: c.color },
                    isSelected && [
                      styles.selectedSwatchCircle,
                      { borderColor: tokens.colors.text },
                    ],
                  ]}
                />
              </Pressable>
            );
          })}
        </View>

        <View style={styles.actions}>
          <Button
            title={isEditing ? 'Save Changes' : 'Create Subject'}
            variant="primary"
            onPress={handleSave}
            loading={isSubmitting}
            accessibilityLabel={
              isEditing ? 'Save subject changes' : 'Create subject'
            }
          />
          <View style={styles.actionSpacer} />
          <Button
            title="Cancel"
            variant="ghost"
            onPress={onClose}
            disabled={isSubmitting}
            accessibilityLabel="Cancel subject form"
          />
        </View>
      </ScrollView>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingTop: 8,
    paddingBottom: 16,
  },
  title: {
    marginBottom: 16,
  },
  colorSectionLabel: {
    marginTop: 8,
    marginBottom: 12,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  swatchesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  swatchTouchArea: {
    minWidth: 44,
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  swatchCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  selectedSwatchCircle: {
    borderWidth: 3,
    transform: [{ scale: 1.15 }],
  },
  actions: {
    marginTop: 8,
  },
  actionSpacer: {
    height: 8,
  },
});
