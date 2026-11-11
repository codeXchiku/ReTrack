import React, { useState } from 'react';
import {
  Platform,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import DateTimePicker, {
  type DateTimePickerChangeEvent,
} from '@react-native-community/datetimepicker';
import { formatDuration, today, toDay } from '@/core/time';
import { useTheme } from '@/core/theme';
import { Button, Text, TextField } from '@/core/ui';
import {
  OnboardingStepLayout,
  type OnboardingStepProps,
} from '@/features/onboarding';
import { clampGoal, getDaysLeft } from '../logic/exam';
import { setDailyGoalMin, setExam } from '../index';

/**
 * Onboarding step for setting daily goal and optional upcoming exam.
 */
export function GoalExamStep({
  onContinue,
  onSkip,
  isLast,
}: OnboardingStepProps): React.JSX.Element {
  const { tokens } = useTheme();

  const [goalMin, setGoalMin] = useState(120);
  const [examName, setExamName] = useState('');
  const [examDate, setExamDate] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [dateError, setDateError] = useState<string | null>(null);

  const handleDecreaseGoal = () => {
    setGoalMin(prev => clampGoal(prev - 15));
  };

  const handleIncreaseGoal = () => {
    setGoalMin(prev => clampGoal(prev + 15));
  };

  const handleDateValueChange = (
    _event: DateTimePickerChangeEvent,
    selectedDate: Date,
  ) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (selectedDate) {
      const selectedDayStr = toDay(selectedDate.getTime());
      const todayStr = today();
      const daysLeft = getDaysLeft(selectedDayStr, todayStr);

      if (daysLeft === null) {
        setDateError('Exam date cannot be in the past');
      } else {
        setDateError(null);
        setExamDate(selectedDayStr);
      }
    }
  };

  const handleDateDismiss = () => {
    setShowDatePicker(false);
  };

  const handleClearDate = () => {
    setExamDate('');
    setDateError(null);
  };

  const handleContinue = () => {
    setDailyGoalMin(goalMin);
    if (examName.trim() || examDate) {
      setExam({
        name: examName.trim(),
        date: examDate,
      });
    }
    onContinue();
  };

  const todayStr = today();
  const daysRemaining = examDate ? getDaysLeft(examDate, todayStr) : null;

  return (
    <OnboardingStepLayout
      title="Set your goal"
      body="Decide how much time you want to study each day, and optionally set a target exam date."
      primaryLabel={isLast ? 'Finish' : 'Continue'}
      onPrimary={handleContinue}
      secondaryLabel="Skip"
      onSecondary={onSkip}
      accessibilityLabel="Onboarding Goal and Exam Step"
    >
      <View style={[styles.container, { gap: tokens.spacing.xl }]}>
        {/* Daily Goal Stepper */}
        <View style={styles.section}>
          <Text variant="heading" color="text" style={styles.sectionTitle}>
            Daily Study Goal
          </Text>
          <View style={[styles.stepperContainer, { marginTop: tokens.spacing.sm }]}>
            <Pressable
              onPress={handleDecreaseGoal}
              disabled={goalMin <= 15}
              accessibilityRole="button"
              accessibilityLabel="Decrease daily goal by 15 minutes"
              style={[
                styles.stepperButton,
                {
                  backgroundColor: tokens.colors.surface,
                  borderColor: tokens.colors.border,
                  borderRadius: tokens.radii.md,
                },
                goalMin <= 15 && styles.disabledButton,
              ]}
            >
              <Text variant="title" color="text">
                -
              </Text>
            </Pressable>

            <View style={styles.goalDisplay}>
              <Text variant="display" color="primary">
                {formatDuration(goalMin * 60)}
              </Text>
              <Text variant="caption" color="textMuted">
                {goalMin} minutes / day
              </Text>
            </View>

            <Pressable
              onPress={handleIncreaseGoal}
              disabled={goalMin >= 720}
              accessibilityRole="button"
              accessibilityLabel="Increase daily goal by 15 minutes"
              style={[
                styles.stepperButton,
                {
                  backgroundColor: tokens.colors.surface,
                  borderColor: tokens.colors.border,
                  borderRadius: tokens.radii.md,
                },
                goalMin >= 720 && styles.disabledButton,
              ]}
            >
              <Text variant="title" color="text">
                +
              </Text>
            </Pressable>
          </View>
        </View>

        {/* Optional Exam Target */}
        <View style={styles.section}>
          <Text variant="heading" color="text" style={styles.sectionTitle}>
            Upcoming Exam (Optional)
          </Text>

          <View style={{ marginTop: tokens.spacing.sm }}>
            <TextField
              value={examName}
              onChangeText={setExamName}
              placeholder="Exam name (e.g. UPSC, MCAT, Finals)"
              accessibilityLabel="Exam name input"
            />
          </View>

          <View
            style={[
              styles.datePickerRow,
              { marginTop: tokens.spacing.sm, gap: tokens.spacing.sm },
            ]}
          >
            <Button
              title={examDate ? `Exam: ${examDate}` : 'Pick exam date'}
              variant="secondary"
              onPress={() => setShowDatePicker(true)}
              accessibilityLabel="Pick exam date button"
              style={styles.dateButton}
            />
            {examDate ? (
              <Button
                title="Clear"
                variant="ghost"
                onPress={handleClearDate}
                accessibilityLabel="Clear exam date"
              />
            ) : null}
          </View>

          {dateError ? (
            <Text
              variant="caption"
              color="danger"
              style={{ marginTop: tokens.spacing.xs }}
            >
              {dateError}
            </Text>
          ) : daysRemaining !== null ? (
            <Text
              variant="caption"
              color="textMuted"
              style={{ marginTop: tokens.spacing.xs }}
            >
              {daysRemaining === 0
                ? 'Exam is today!'
                : `${daysRemaining} days remaining`}
            </Text>
          ) : null}

          {showDatePicker && (
            <DateTimePicker
              value={examDate ? new Date(`${examDate}T00:00:00`) : new Date()}
              mode="date"
              display="default"
              minimumDate={new Date()}
              onValueChange={handleDateValueChange}
              onDismiss={handleDateDismiss}
            />
          )}
        </View>
      </View>
    </OnboardingStepLayout>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  section: {
    width: '100%',
  },
  sectionTitle: {
    fontWeight: '600',
  },
  stepperContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  stepperButton: {
    width: 56,
    height: 56,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabledButton: {
    opacity: 0.4,
  },
  goalDisplay: {
    alignItems: 'center',
  },
  datePickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateButton: {
    flex: 1,
  },
});
