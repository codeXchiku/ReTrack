import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { getDb } from '@/core/db';
import { navigateToScreen } from '@/core/navigation';
import { createSetting } from '@/core/storage';
import { spacing } from '@/core/theme';
import { Button, Card, Screen, Text } from '@/core/ui';
import { NO_SUBJECT_LABEL, SubjectPicker } from '@/features/subjects';
import { onboardingDone } from '@/features/onboarding';
import { UiGallery } from './UiGallery';

const testStorageSetting = createSetting<string>('settings.testKey', 'not_set');

export function DevMenu(): React.JSX.Element {
  const navigation = useNavigation();
  const [showGallery, setShowGallery] = useState(false);
  const currentTestSettingVal = testStorageSetting.useValue();
  const [selectedSubjectId, setSelectedSubjectId] = useState<string | null>(null);

  const [storageCheckResult, setStorageCheckResult] = useState<{
    settingValue: string;
    dbCreatedAt: string;
  } | null>(null);

  const [resetMessage, setResetMessage] = useState<string | null>(null);

  const handleStorageCheck = async () => {
    const testVal = `val_${Date.now()}`;
    testStorageSetting.set(testVal);
    const readVal = testStorageSetting.get();

    let dbVal = 'error';
    try {
      const db = getDb();
      const row = await db.queryOne<{ value: string }>(
        "SELECT value FROM app_meta WHERE key = 'db_created_at';",
      );
      dbVal = row?.value ?? 'null';
    } catch (e) {
      dbVal = e instanceof Error ? e.message : String(e);
    }

    setStorageCheckResult({
      settingValue: readVal,
      dbCreatedAt: dbVal,
    });
  };

  if (showGallery) {
    return (
      <Screen style={styles.flex}>
        <View style={styles.galleryHeader}>
          <Button
            title="← Back to Dev Menu"
            variant="ghost"
            onPress={() => setShowGallery(false)}
            accessibilityLabel="Back to Dev Menu"
          />
        </View>
        <UiGallery />
      </Screen>
    );
  }

  return (
    <Screen style={styles.container} accessibilityLabel="Developer Menu Screen">
      <View style={styles.header}>
        <Text variant="title" color="text">
          Developer Menu
        </Text>
        <Text variant="caption" color="textMuted">
          Internal tools & design verification
        </Text>
      </View>

      <Card style={styles.card}>
        <Button
          title="UI Gallery"
          variant="primary"
          onPress={() => setShowGallery(true)}
          accessibilityLabel="Open UI Gallery"
        />

        <View style={styles.spacer} />

        <Button
          title="Storage check"
          variant="secondary"
          onPress={handleStorageCheck}
          accessibilityLabel="Run Storage Check"
        />

        <View style={styles.spacer} />

        <Button
          title="Reset onboarding"
          variant="secondary"
          onPress={() => {
            onboardingDone.set(false);
            setResetMessage('Onboarding reset! (onboarding.done = false)');
          }}
          accessibilityLabel="Reset onboarding"
        />
        {resetMessage && (
          <Text variant="caption" color="primary" style={styles.resetMsg}>
            {resetMessage}
          </Text>
        )}

        <View style={styles.spacer} />

        <Text variant="body" color="text">
          Setting: {currentTestSettingVal}
        </Text>
        {storageCheckResult && (
          <View style={styles.resultBox}>
            <Text variant="caption" color="textMuted">
              Read back: {storageCheckResult.settingValue}
            </Text>
            <Text variant="caption" color="textMuted">
              db_created_at: {storageCheckResult.dbCreatedAt}
            </Text>
          </View>
        )}
      </Card>

      {/* Subjects playground */}
      <Card style={styles.card}>
        <Text variant="heading" color="text" style={styles.sectionTitle}>
          Subjects Playground
        </Text>
        <Text variant="caption" color="textMuted" style={styles.sectionSubtitle}>
          Subject picker & management link
        </Text>

        <View style={styles.pickerRow}>
          <SubjectPicker
            value={selectedSubjectId}
            onChange={setSelectedSubjectId}
          />
        </View>
        <Text variant="caption" color="textMuted">
          Current value: {selectedSubjectId ?? NO_SUBJECT_LABEL}
        </Text>

        <View style={styles.spacer} />

        <Button
          title="Manage Subjects Screen →"
          variant="secondary"
          onPress={() => navigateToScreen('ManageSubjects')}
          accessibilityLabel="Open Manage Subjects screen"
        />
      </Card>

      <View style={styles.footer}>
        <Button
          title="Close Dev Menu"
          variant="ghost"
          onPress={() => navigation.goBack()}
          accessibilityLabel="Close Dev Menu"
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  container: {
    flex: 1,
    padding: spacing.lg,
  },
  header: {
    marginBottom: spacing.xl,
  },
  card: {
    padding: spacing.lg,
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    marginBottom: 4,
  },
  sectionSubtitle: {
    marginBottom: spacing.md,
  },
  pickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  spacer: {
    height: spacing.md,
  },
  resultBox: {
    marginTop: spacing.xs,
    gap: spacing.xs,
  },
  resetMsg: {
    marginTop: spacing.xs,
  },
  footer: {
    marginTop: 'auto',
  },
  galleryHeader: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.xs,
  },
});
