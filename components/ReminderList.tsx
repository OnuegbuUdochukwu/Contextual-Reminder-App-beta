import React from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { Reminder } from '../types';
import ReminderItem from './ReminderItem';

type ReminderListProps = {
  reminders: Reminder[];
  onEdit: (reminder: Reminder) => void;
  onDelete: (id: string) => void;
  onShare: (reminder: Reminder) => void;
};

export default function ReminderList({ reminders, onEdit, onDelete, onShare }: ReminderListProps) {
  if (reminders.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text>No reminders yet. Add one above!</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={reminders}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => (
        <ReminderItem
          reminder={item}
          onEdit={onEdit}
          onDelete={onDelete}
          onShare={onShare}
        />
      )}
      style={styles.list}
    />
  );
}

const styles = StyleSheet.create({
  list: {
    flex: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

