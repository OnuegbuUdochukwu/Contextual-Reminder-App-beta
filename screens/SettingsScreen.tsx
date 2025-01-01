import React, { useState, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { Switch, Text, Button } from 'react-native-paper';
import AsyncStorage from '@react-native-async-storage/async-storage';
import firebase from '../services/firebase';

export default function SettingsScreen() {
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [aiSuggestionsEnabled, setAiSuggestionsEnabled] = useState(true);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    const notificationsEnabled = await AsyncStorage.getItem('notificationsEnabled');
    const aiSuggestionsEnabled = await AsyncStorage.getItem('aiSuggestionsEnabled');
    setNotificationsEnabled(notificationsEnabled !== 'false');
    setAiSuggestionsEnabled(aiSuggestionsEnabled !== 'false');
  };

  const saveSettings = async () => {
    await AsyncStorage.setItem('notificationsEnabled', notificationsEnabled.toString());
    await AsyncStorage.setItem('aiSuggestionsEnabled', aiSuggestionsEnabled.toString());
  };

  const handleSignOut = async () => {
    try {
      await firebase.auth().signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.setting}>
        <Text>Enable Notifications</Text>
        <Switch
          value={notificationsEnabled}
          onValueChange={(value) => {
            setNotificationsEnabled(value);
            saveSettings();
          }}
        />
      </View>
      <View style={styles.setting}>
        <Text>Enable AI Suggestions</Text>
        <Switch
          value={aiSuggestionsEnabled}
          onValueChange={(value) => {
            setAiSuggestionsEnabled(value);
            saveSettings();
          }}
        />
      </View>
      <Button mode="contained" onPress={handleSignOut} style={styles.button}>
        Sign Out
      </Button>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  setting: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  button: {
    marginTop: 20,
  },
});

