import React, { useState, useEffect } from 'react';
import { View, TextInput, Button, StyleSheet, Picker } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as Location from 'expo-location';
import { Reminder } from '../types';

type ReminderFormProps = {
  onSave: (reminder: Reminder) => void;
  aiSuggestions: () => Promise<string[]>;
  editingReminder: Reminder | null;
};

export default function ReminderForm({ onSave, aiSuggestions, editingReminder }: ReminderFormProps) {
  const [title, setTitle] = useState('');
  const [triggerType, setTriggerType] = useState<'time' | 'location' | 'condition'>('time');
  const [category, setCategory] = useState('');
  const [time, setTime] = useState(new Date());
  const [location, setLocation] = useState<{ latitude: number; longitude: number; radius: number } | null>(null);
  const [weatherCondition, setWeatherCondition] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurringInterval, setRecurringInterval] = useState<number | undefined>(undefined);


  useEffect(() => {
    loadSuggestions();
    if (editingReminder) {
      setTitle(editingReminder.title);
      setTriggerType(editingReminder.triggerType);
      setCategory(editingReminder.category);
      setIsRecurring(editingReminder.isRecurring || false);
      setRecurringInterval(editingReminder.recurringInterval);
      if (editingReminder.triggerType === 'time' && editingReminder.details.time) {
        setTime(new Date(editingReminder.details.time));
      } else if (editingReminder.triggerType === 'location' && editingReminder.details.location) {
        setLocation(editingReminder.details.location);
      } else if (editingReminder.triggerType === 'condition' && editingReminder.details.condition) {
        setWeatherCondition(editingReminder.details.condition.condition);
      }
    }
  }, [editingReminder]);

  const loadSuggestions = async () => {
    const aiSuggestionList = await aiSuggestions();
    setSuggestions(aiSuggestionList);
  };

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
    setRecurringInterval(undefined);
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
    <View style={styles.container}>
      <TextInput
        style={styles.input}
        placeholder="Reminder title"
        value={title}
        onChangeText={setTitle}
      />
      <Picker
        selectedValue={triggerType}
        style={styles.picker}
        onValueChange={(itemValue) => setTriggerType(itemValue)}
      >
        <Picker.Item label="Time-based" value="time" />
        <Picker.Item label="Location-based" value="location" />
        <Picker.Item label="Condition-based" value="condition" />
      </Picker>
      <TextInput
        style={styles.input}
        placeholder="Category"
        value={category}
        onChangeText={setCategory}
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
        <Button title="Select Current Location" onPress={handleLocationSelect} />
      )}
      {triggerType === 'condition' && (
        <TextInput
          style={styles.input}
          placeholder="Weather condition (e.g., rain, sunny)"
          value={weatherCondition}
          onChangeText={setWeatherCondition}
        />
      )}
      <Button title={editingReminder ? "Update Reminder" : "Save Reminder"} onPress={handleSave} />
      <View style={styles.suggestionsContainer}>
        <Button title="Get AI Suggestions" onPress={loadSuggestions} />
        {suggestions.map((suggestion, index) => (
          <Button key={index} title={suggestion} onPress={() => setTitle(suggestion)} />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#fff',
  },
  input: {
    height: 40,
    borderColor: 'gray',
    borderWidth: 1,
    marginBottom: 10,
    paddingHorizontal: 10,
  },
  picker: {
    height: 50,
    marginBottom: 10,
  },
  suggestionsContainer: {
    marginTop: 20,
  },
});

