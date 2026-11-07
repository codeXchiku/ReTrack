import React, { useState } from 'react';
import {
  FlatList,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '@/core/theme';
import {
  Button,
  EmptyState,
  Screen,
  Text,
  confirm,
} from '@/core/ui';
import { ChevronIcon, PlusIcon } from '@/core/ui/icons';
import {
  SubjectFormSheet,
  type SubjectFormValues,
} from '../components/SubjectFormSheet';
import type { Subject } from '../data/subjectsRepo';
import { useSubjects, useSubjectsStore } from '../store/subjectsStore';

/**
 * Screen for viewing, creating, editing, and deleting subjects.
 */
export function ManageSubjectsScreen(): React.JSX.Element {
  const { tokens } = useTheme();
  const navigation = useNavigation();
  const subjects = useSubjects();
  const addSubject = useSubjectsStore(state => state.add);
  const updateSubject = useSubjectsStore(state => state.update);
  const removeSubject = useSubjectsStore(state => state.remove);

  const [formVisible, setFormVisible] = useState(false);
  const [editingSubject, setEditingSubject] = useState<Subject | undefined>(
    undefined,
  );

  React.useEffect(() => {
    if (useSubjectsStore.getState().status === 'idle') {
      useSubjectsStore
        .getState()
        .load()
        .catch(() => {});
    }
  }, []);

  const handleOpenCreate = () => {
    setEditingSubject(undefined);
    setFormVisible(true);
  };

  const handleOpenEdit = (subject: Subject) => {
    setEditingSubject(subject);
    setFormVisible(true);
  };

  const handleDelete = async (subject: Subject) => {
    const confirmed = await confirm({
      title: 'Delete subject',
      message: `Delete ${subject.name}? This also deletes all its flashcards. Your study history is kept.`,
      confirmLabel: 'Delete',
      cancelLabel: 'Cancel',
      destructive: true,
    });

    if (confirmed) {
      await removeSubject(subject.id);
    }
  };

  const handleSave = async (values: SubjectFormValues): Promise<boolean> => {
    if (editingSubject) {
      const result = await updateSubject(editingSubject.id, values);
      return result.ok;
    }
    const result = await addSubject(values);
    return result.ok;
  };

  const renderSubjectItem = ({ item }: { item: Subject }) => (
    <View
      style={[
        styles.subjectRow,
        {
          backgroundColor: tokens.colors.surface,
          borderColor: tokens.colors.border,
          borderRadius: tokens.radii.md,
        },
      ]}
    >
      <Pressable
        onPress={() => handleOpenEdit(item)}
        accessibilityRole="button"
        accessibilityLabel={`Edit subject ${item.name}`}
        style={styles.subjectRowContent}
      >
        <View
          style={[styles.colorDot, { backgroundColor: item.color }]}
        />
        <Text variant="body" color="text" style={styles.subjectName}>
          {item.name}
        </Text>
      </Pressable>

      <Button
        title="Delete"
        variant="ghost"
        onPress={() => handleDelete(item)}
        accessibilityLabel={`Delete ${item.name}`}
        textStyle={{ color: tokens.colors.danger }}
        style={styles.deleteButton}
      />
    </View>
  );

  return (
    <Screen
      style={styles.screen}
      accessibilityLabel="Manage subjects screen"
    >
      {/* Header */}
      <View style={styles.header}>
        <Pressable
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          accessibilityRole="button"
          accessibilityLabel="Back"
          style={styles.backButton}
        >
          <ChevronIcon
            direction="left"
            size={24}
            color={tokens.colors.primary}
          />
        </Pressable>

        <Text variant="title" color="text" style={styles.headerTitle}>
          Subjects
        </Text>

        <Pressable
          onPress={handleOpenCreate}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          accessibilityRole="button"
          accessibilityLabel="Add new subject"
          style={styles.addButton}
        >
          <PlusIcon size={24} color={tokens.colors.primary} />
        </Pressable>
      </View>

      {/* Body */}
      {subjects.length === 0 ? (
        <View style={styles.emptyContainer}>
          <EmptyState
            title="No subjects yet"
            message="Add subjects to organize your study sessions and flashcards."
            actionLabel="Add your first subject"
            onAction={handleOpenCreate}
            accessibilityLabel="No subjects empty state"
          />
        </View>
      ) : (
        <FlatList
          data={subjects}
          keyExtractor={item => item.id}
          renderItem={renderSubjectItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Form Sheet */}
      <SubjectFormSheet
        visible={formVisible}
        onClose={() => setFormVisible(false)}
        onSave={handleSave}
        initialValues={editingSubject}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    minHeight: 56,
  },
  backButton: {
    minWidth: 44,
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
  },
  addButton: {
    minWidth: 44,
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'flex-end',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    padding: 16,
    paddingBottom: 32,
  },
  subjectRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
    borderWidth: 1,
    minHeight: 56,
  },
  subjectRowContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingLeft: 16,
    minHeight: 44,
  },
  colorDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    marginRight: 12,
  },
  subjectName: {
    fontWeight: '500',
    flex: 1,
  },
  deleteButton: {
    paddingHorizontal: 12,
    minHeight: 44,
  },
});
