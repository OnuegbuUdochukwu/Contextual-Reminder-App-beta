import React, { useState, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { Calendar, DateData } from 'react-native-calendars';
import { useTheme } from 'react-native-paper';
import { loadReminders, deleteReminder, updateReminder } from '../services/reminderService';
import { Reminder } from '../types';
import DayRemindersModal from '../components/DayRemindersModal';
import ShareModal from '../components/ShareModal';
import ReminderFormModal from '../components/ReminderFormModal';
import AIService from '../services/AIService';

export default function CalendarScreen() {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [markedDates, setMarkedDates] = useState({});
  const [selectedDate, setSelectedDate] = useState('');
  const [isDayModalVisible, setIsDayModalVisible] = useState(false);
  const [isShareModalVisible, setIsShareModalVisible] = useState(false);
  const [isFormModalVisible, setIsFormModalVisible] = useState(false);
  const [editingReminder, setEditingReminder] = useState<Reminder | null>(null);
  const [sharingReminder, setSharingReminder] = useState<Reminder | null>(null);
  const theme = useTheme();

  useEffect(() => {
    fetchReminders();
  }, []);

  const fetchReminders = async () => {
    const fetchedReminders = await loadReminders();
    setReminders(fetchedReminders);
    updateMarkedDates(fetchedReminders);
  };

  const updateMarkedDates = (reminders: Reminder[]) => {
    const marked = {};
    reminders.forEach((reminder) => {
      if (reminder.triggerType === 'time' && reminder.details.time) {
        const date = new Date(reminder.details.time).toISOString().split('T')[0];
        marked[date] = { marked: true, dotColor: theme.colors.primary };
      }
    });
    setMarkedDates(marked);
  };

  const onDayPress = (day: DateData) => {
    setSelectedDate(day.dateString);
    setIsDayModalVisible(true);
  };

  const handleEditReminder = (reminder: Reminder) => {
    setEditingReminder(reminder);
    setIsFormModalVisible(true);
  };

  const handleDeleteReminder = async (id: string) => {
    await deleteReminder(id);
    fetchReminders();
  };

  const handleShareReminder = (reminder: Reminder) => {
    setSharingReminder(reminder);
    setIsShareModalVisible(true);
  };

  const handleSaveReminder = async (reminder: Reminder) => {
    await updateReminder(reminder);
    setEditingReminder(null);
    setIsFormModalVisible(false);
    fetchReminders();
  };

  const selectedReminders = reminders.filter((reminder) => {
    if (reminder.triggerType === 'time' && reminder.details.time) {
      const reminderDate = new Date(reminder.details.time).toISOString().split('T')[0];
      return reminderDate === selectedDate;
    }
    return false;
  });

  return (
    <View style={styles.container}>
      <Calendar
        onDayPress={onDayPress}
        markedDates={markedDates}
        theme={{
          backgroundColor: theme.colors.background,
          calendarBackground: theme.colors.background,
          textSectionTitleColor: theme.colors.primary,
          selectedDayBackgroundColor: theme.colors.primary,
          selectedDayTextColor: theme.colors.background,
          todayTextColor: theme.colors.accent,
          dayTextColor: theme.colors.text,
          textDisabledColor: theme.colors.disabled,
          dotColor: theme.colors.primary,
          selectedDotColor: theme.colors.background,
          arrowColor: theme.colors.primary,
          monthTextColor: theme.colors.primary,
          indicatorColor: theme.colors.primary,
        }}
      />
      <DayRemindersModal
        visible={isDayModalVisible}
        onDismiss={() => setIsDayModalVisible(false)}
        reminders={selectedReminders}
        date={selectedDate}
        onEdit={handleEditReminder}
        onDelete={handleDeleteReminder}
        onShare={handleShareReminder}
      />
      <ShareModal
        visible={isShareModalVisible}
        onDismiss={() => {
          setIsShareModalVisible(false);
          setSharingReminder(null);
        }}
        reminder={sharingReminder}
      />
      <ReminderFormModal
        visible={isFormModalVisible}
        onDismiss={() => {
          setIsFormModalVisible(false);
          setEditingReminder(null);
        }}
        onSave={handleSaveReminder}
        editingReminder={editingReminder}
        aiSuggestions={AIService.getSuggestions}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
});

