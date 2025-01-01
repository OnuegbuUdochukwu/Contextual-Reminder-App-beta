import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Card, Title, Paragraph, IconButton } from 'react-native-paper';
import { Reminder } from '../types';

type ReminderItemProps = {
  reminder: Reminder;
  onEdit: (reminder: Reminder) => void;
  onDelete: (id: string) => void;
  onShare: (reminder: Reminder) => void;
};

export default function ReminderItem({ reminder, onEdit, onDelete, onShare }: ReminderItemProps) {
  return (
    <Card style={styles.card}>
      <Card.Content>
        <Title>{reminder.title}</Title>
        <Paragraph>Type: {reminder.triggerType}</Paragraph>
        <Paragraph>Category: {reminder.category}</Paragraph>
      </Card.Content>
      <Card.Actions>
        <IconButton icon="pencil" onPress={() => onEdit(reminder)} />
        <IconButton icon="delete" onPress={() => onDelete(reminder.id)} />
        <IconButton icon="share" onPress={() => onShare(reminder)} />
      </Card.Actions>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 16,
    marginVertical: 8,
  },
});

