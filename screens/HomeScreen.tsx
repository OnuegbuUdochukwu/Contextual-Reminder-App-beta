import React, { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList, Animated } from 'react-native';
import { FAB, Searchbar } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import ReminderItem from '../components/ReminderItem';
import ReminderFormModal from '../components/ReminderFormModal';
import ShareModal from '../components/ShareModal';
import { Reminder } from '../types';
import { loadReminders, saveReminder, deleteReminder, updateReminder } from '../services/reminderService';
import AIService from '../services/AIService';

export default function HomeScreen() {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isFormModalVisible, setIsFormModalVisible] = useState(false);
  const [isShareModalVisible, setIsShareModalVisible] = useState(false);
  const [editingReminder, setEditingReminder] = useState<Reminder | null>(null);
  const [sharingReminder, setSharingReminder] = useState<Reminder | null>(null);
  const navigation = useNavigation();
  const fadeAnim = new Animated.Value(0);

  useEffect(() => {
    fetchReminders();
  }, []);

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: true,
    }).start();
  }, [reminders]);

  const fetchReminders = async () => {
    const fetchedReminders = await loadReminders();
    setReminders(fetchedReminders);
  };

  const handleSaveReminder = async (reminder: Reminder) => {
    if (editingReminder) {
      await updateReminder(reminder);
    } else {
      await saveReminder(reminder);
    }
    setEditingReminder(null);
    setIsFormModalVisible(false);
    fetchReminders();
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

  const filteredReminders = reminders.filter(reminder =>
    reminder.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <View style={styles.container}>
      <Searchbar
        placeholder="Search reminders"
        onChangeText={setSearchQuery}
        value={searchQuery}
        style={styles.searchBar}
      />
      <Animated.View style={{ ...styles.listContainer, opacity: fadeAnim }}>
        <FlatList
          data={filteredReminders}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <ReminderItem
              reminder={item}
              onEdit={handleEditReminder}
              onDelete={handleDeleteReminder}
              onShare={handleShareReminder}
            />
          )}
        />
      </Animated.View>
      <FAB
        style={styles.fab}
        icon="plus"
        onPress={() => setIsFormModalVisible(true)}
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
      <ShareModal
        visible={isShareModalVisible}
        onDismiss={() => {
          setIsShareModalVisible(false);
          setSharingReminder(null);
        }}
        reminder={sharingReminder}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f6f6f6',
  },
  searchBar: {
    margin: 16,
  },
  listContainer: {
    flex: 1,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
  },
});

