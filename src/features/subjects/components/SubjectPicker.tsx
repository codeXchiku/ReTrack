import React, { useState } from 'react';
import {
  Pressable,
  ScrollView,
  type StyleProp,
  StyleSheet,
  View,
  type ViewStyle,
} from 'react-native';
import { useTheme } from '@/core/theme';
import { BottomSheet, Chip, Text } from '@/core/ui';
import { CheckIcon, PlusIcon } from '@/core/ui/icons';
import { useSubject, useSubjects, useSubjectsStore } from '../store/subjectsStore';
import { SubjectFormSheet } from './SubjectFormSheet';

export const NO_SUBJECT_LABEL = 'No subject';

export type SubjectPickerProps = {
  value: string | null;
  onChange: (id: string | null) => void;
  allowNone?: boolean;
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
};

/**
 * Chip-like button that opens a bottom sheet allowing subject selection,
 * 'No subject' selection, or on-the-fly creation of a new subject.
 */
export function SubjectPicker({
  value,
  onChange,
  allowNone = true,
  accessibilityLabel,
  style,
}: SubjectPickerProps): React.JSX.Element {
  const { tokens } = useTheme();
  const subjects = useSubjects();
  const addSubject = useSubjectsStore(state => state.add);
  const currentSubject = useSubject(value);

  const [isPickerVisible, setIsPickerVisible] = useState(false);
  const [isFormVisible, setIsFormVisible] = useState(false);

  const handleSelect = (id: string | null) => {
    onChange(id);
    setIsPickerVisible(false);
  };

  const handleOpenForm = () => {
    setIsPickerVisible(false);
    setIsFormVisible(true);
  };

  const handleCreateSubject = async (formValues: {
    name: string;
    color: string;
  }): Promise<boolean> => {
    const result = await addSubject(formValues);
    if (result.ok) {
      onChange(result.value.id);
      return true;
    }
    return false;
  };

  const chipLabel = currentSubject ? currentSubject.name : NO_SUBJECT_LABEL;
  const chipColorDot = currentSubject ? currentSubject.color : undefined;

  const dynamicRowStyle = {
    borderBottomColor: tokens.colors.border,
    borderRadius: tokens.radii.sm,
  };
  const activeBgStyle = { backgroundColor: tokens.colors.surfaceAlt };

  return (
    <View style={style}>
      {/* Trigger Chip */}
      <Chip
        label={chipLabel}
        colorDot={chipColorDot}
        onPress={() => setIsPickerVisible(true)}
        accessibilityLabel={
          accessibilityLabel ?? `Subject: ${chipLabel}. Tap to change.`
        }
      />

      {/* Picker Bottom Sheet */}
      <BottomSheet
        visible={isPickerVisible}
        onClose={() => setIsPickerVisible(false)}
        accessibilityLabel="Subject picker list"
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          bounces={false}
          contentContainerStyle={styles.sheetContent}
        >
          <Text variant="title" color="text" style={styles.sheetTitle}>
            Choose Subject
          </Text>

          {/* Option: No subject */}
          {allowNone && (
            <Pressable
              onPress={() => handleSelect(null)}
              accessibilityRole="button"
              accessibilityLabel={`${NO_SUBJECT_LABEL}${value === null ? ', selected' : ''}`}
              accessibilityState={{ selected: value === null }}
              style={[
                styles.optionRow,
                dynamicRowStyle,
                value === null ? activeBgStyle : styles.transparentBg,
              ]}
            >
              <View style={styles.optionLeft}>
                <View
                  style={[
                    styles.noSubjectDot,
                    { borderColor: tokens.colors.textMuted },
                  ]}
                />
                <Text
                  variant="body"
                  color={value === null ? 'primary' : 'text'}
                  style={styles.optionText}
                >
                  {NO_SUBJECT_LABEL}
                </Text>
              </View>
              {value === null && (
                <CheckIcon size={20} color={tokens.colors.primary} />
              )}
            </Pressable>
          )}

          {/* Option list: Subjects */}
          {subjects.map(subject => {
            const isSelected = value === subject.id;
            return (
              <Pressable
                key={subject.id}
                onPress={() => handleSelect(subject.id)}
                accessibilityRole="button"
                accessibilityLabel={`${subject.name}${isSelected ? ', selected' : ''}`}
                accessibilityState={{ selected: isSelected }}
                style={[
                  styles.optionRow,
                  dynamicRowStyle,
                  isSelected ? activeBgStyle : styles.transparentBg,
                ]}
              >
                <View style={styles.optionLeft}>
                  <View
                    style={[
                      styles.colorDot,
                      { backgroundColor: subject.color },
                    ]}
                  />
                  <Text
                    variant="body"
                    color={isSelected ? 'primary' : 'text'}
                    style={styles.optionText}
                  >
                    {subject.name}
                  </Text>
                </View>
                {isSelected && (
                  <CheckIcon size={20} color={tokens.colors.primary} />
                )}
              </Pressable>
            );
          })}

          {/* Option: + New Subject */}
          <Pressable
            onPress={handleOpenForm}
            accessibilityRole="button"
            accessibilityLabel="Create new subject"
            style={[
              styles.optionRow,
              styles.newSubjectRow,
              {
                borderTopColor: tokens.colors.border,
                borderRadius: tokens.radii.sm,
              },
            ]}
          >
            <View style={styles.optionLeft}>
              <PlusIcon size={20} color={tokens.colors.primary} />
              <Text
                variant="body"
                color="primary"
                style={[styles.optionText, styles.newSubjectText]}
              >
                New Subject
              </Text>
            </View>
          </Pressable>
        </ScrollView>
      </BottomSheet>

      {/* Creation form opened from picker */}
      <SubjectFormSheet
        visible={isFormVisible}
        onClose={() => setIsFormVisible(false)}
        onSave={handleCreateSubject}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  sheetContent: {
    paddingTop: 8,
    paddingBottom: 20,
  },
  sheetTitle: {
    marginBottom: 16,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 48,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginVertical: 2,
  },
  transparentBg: {
    backgroundColor: 'transparent',
  },
  optionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  colorDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    marginRight: 12,
  },
  noSubjectDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    marginRight: 12,
  },
  optionText: {
    fontWeight: '500',
    flex: 1,
  },
  newSubjectRow: {
    marginTop: 8,
    borderTopWidth: 1,
    paddingTop: 14,
  },
  newSubjectText: {
    fontWeight: '700',
    marginLeft: 8,
  },
});
