import React, { useState, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { Modal, Portal, TextInput, Button, SegmentedButtons, Text, Switch } from 'react-native-paper';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as Location from 'expo-location';
import { Reminder } from '../types';

type ReminderFormModalProps = {
  visible: boolean;
  onDismiss: () => void;
  onSave: (reminder: Reminder) => void;
  editingReminder: Reminder | null;
  aiSuggestions: () => Promise<string[]>;
};

export default function ReminderFormModal({
  visible,
  onDismiss,
  onSave,
  editingReminder,
  aiSuggestions,
}: ReminderFormModalProps) {
  const [title, setTitle] = useState('');
  const [triggerType, setTriggerType] = useState<'time' | 'location' | 'condition'>('time');
  const [category, setCategory] = useState('');
  const [time, setTime] = useState(new Date());
  const [location, setLocation] = useState<{ latitude: number; longitude: number; radius: number } | null>(null);
  const [weatherCondition, setWeatherCondition] = useState('');
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurringInterval, setRecurringInterval] = useState<'daily' | 'weekly' | 'monthly'>('daily');

  useEffect(() => {
    if (editingReminder) {
      setTitle(editingReminder.title);
      setTriggerType(editingReminder.triggerType);
      setCategory(editingReminder.category);
      setIsRecurring(editingReminder.isRecurring || false);
      setRecurringInterval(editingReminder.recurringInterval || 'daily');
      if (editingReminder.triggerType === 'time' && editingReminder.details.time) {
        setTime(new Date(editingReminder.details.time));
      } else if (editingReminder.triggerType === 'location' && editingReminder.details.location) {
        setLocation(editingReminder.details.location);
      } else if (editingReminder.triggerType === 'condition' && editingReminder.details.condition) {
        setWeatherCondition(editingReminder.details.condition.condition);
      }
    }
  }, [editingReminder]);

  const handleSave = () => {
    if (title.trim()) {
      const reminder: Reminder = {
        id: editingReminder ? editingReminder.id : Date.now().toString(),
        title,
        triggerType,
        category,
        details: {},
        isRecurring,
        recurringInterval: isRecurring ? recurringInterval : undefined,
      };

      if (triggerType === 'time') {
        reminder.details.time = time.toISOString();
      } else if (triggerType === 'location' && location) {
        reminder.details.location = location;
      } else if (triggerType === 'condition') {
        reminder.details.condition = {
          type: 'weather',
          condition: weatherCondition,
        };
      }

      onSave(reminder);
      resetForm();
      onDismiss();
    }
  };

  const resetForm = () => {
    setTitle('');
    setTriggerType('time');
    setCategory('');
    setTime(new Date());
    setLocation(null);
    setWeatherCondition('');
    setIsRecurring(false);
    setRecurringInterval('daily');
  };

  const handleLocationSelect = async () => {
    let { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      console.error('Permission to access location was denied');
      return;
    }

    let location = await Location.getCurrentPositionAsync({});
    setLocation({
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
      radius: 500, // Default radius of 500 meters
    });
  };

  return (
    <Portal>
      <Modal visible={visible} onDismiss={onDismiss}>
        <View style={styles.modalContainer}>
          <TextInput
            label="Reminder title"
            value={title}
            onChangeText={setTitle}
            style={styles.input}
          />
          <SegmentedButtons
            value={triggerType}
            onValueChange={(value) => setTriggerType(value as 'time' | 'location' | 'condition')}
            buttons={[
              { value: 'time', label: 'Time' },
              { value: 'location', label: 'Location' },
              { value: 'condition', label: 'Condition' },
            ]}
            style={styles.segmentedButtons}
          />
          <TextInput
            label="Category"
            value={category}
            onChangeText={setCategory}
            style={styles.input}
          />
          {triggerType === 'time' && (
            <DateTimePicker
              value={time}
              mode="datetime"
              is24Hour={true}
              display="default"
              onChange={(event, selectedDate) => setTime(selectedDate || time)}
            />
          )}
          {triggerType === 'location' && (
            <Button onPress={handleLocationSelect} mode="outlined" style={styles.button}>
              Select Current Location
            </Button>
          )}
          {triggerType === 'condition' && (
            <TextInput
              label="Weather condition (e.g., rain, sunny)"
              value={weatherCondition}
              onChangeText={setWeatherCondition}
              style={styles.input}
            />
          )}
          <View style={styles.switchContainer}>
            <Text>Recurring</Text>
            <Switch value={isRecurring} onValueChange={setIsRecurring} />
          </View>
          {isRecurring && (
            <SegmentedButtons
              value={recurringInterval}
              onValueChange={(value) => setRecurringInterval(value as 'daily' | 'weekly' | 'monthly')}
              buttons={[
                { value: 'daily', label: 'Daily' },
                { value: 'weekly', label: 'Weekly' },
                { value: 'monthly', label: 'Monthly' },
              ]}
              style={styles.segmentedButtons}
            />
          )}
          <Button mode="contained" onPress={handleSave} style={styles.button}>
            {editingReminder ? 'Update Reminder' : 'Save Reminder'}
          </Button>
        </View>
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
  },
  input: {
    marginBottom: 16,
  },
  segmentedButtons: {
    marginBottom: 16,
  },
  button: {
    marginTop: 8,
  },
  switchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
});

