import React from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { Modal, Portal, Text, Button } from 'react-native-paper';
import { Reminder } from '../types';
import ReminderItem from './ReminderItem';

type DayRemindersModalProps = {
  visible: boolean;
  onDismiss: () => void;
  reminders: Reminder[];
  date: string;
  onEdit: (reminder: Reminder) => void;
  onDelete: (id: string) => void;
  onShare: (reminder: Reminder) => void;
};

export default function DayRemindersModal({
  visible,
  onDismiss,
  reminders,
  date,
  onEdit,
  onDelete,
  onShare,
}: DayRemindersModalProps) {
  return (
    <Portal>
      <Modal visible={visible} onDismiss={onDismiss} contentContainerStyle={styles.modalContainer}>
        <Text style={styles.title}>Reminders for {date}</Text>
        <ScrollView style={styles.reminderList}>
          {reminders.map((reminder) => (
            <ReminderItem
              key={reminder.id}
              reminder={reminder}
              onEdit={onEdit}
              onDelete={onDelete}
              onShare={onShare}
            />
          ))}
        </ScrollView>
        <Button mode="outlined" onPress={onDismiss} style={styles.button}>
          Close
        </Button>
      </Modal>
    </Portal>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    backgroundColor: 'white',
    padding: 20,
    margin: 20,
    borderRadius: 8,
    maxHeight: '80%',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  reminderList: {
    marginBottom: 16,
  },
  button: {
    marginTop: 8,
  },
});

