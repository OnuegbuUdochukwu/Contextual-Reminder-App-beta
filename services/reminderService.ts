import firebase from './firebase';
import { Reminder } from '../types';
import * as Notifications from 'expo-notifications';
import * as Location from 'expo-location';
import WeatherService from './WeatherService';

const db = firebase.firestore();

export const loadReminders = async (): Promise<Reminder[]> => {
  const userId = firebase.auth().currentUser?.uid;
  if (!userId) return [];

  const snapshot = await db.collection('reminders').where('userId', '==', userId).get();
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Reminder));
};

export const saveReminder = async (reminder: Reminder): Promise<void> => {
  const userId = firebase.auth().currentUser?.uid;
  if (!userId) throw new Error('User not authenticated');

  await db.collection('reminders').add({
    ...reminder,
    userId,
  });
  scheduleNotification(reminder);
};

export const updateReminder = async (reminder: Reminder): Promise<void> => {
  const userId = firebase.auth().currentUser?.uid;
  if (!userId) throw new Error('User not authenticated');

  await db.collection('reminders').doc(reminder.id).update(reminder);
  scheduleNotification(reminder);
};

export const deleteReminder = async (id: string): Promise<void> => {
  const userId = firebase.auth().currentUser?.uid;
  if (!userId) throw new Error('User not authenticated');

  await db.collection('reminders').doc(id).delete();
  await Notifications.cancelScheduledNotificationAsync(id);
};

export const checkReminders = async (): Promise<void> => {
  const reminders = await loadReminders();
  const currentLocation = await Location.getCurrentPositionAsync({});
  const currentWeather = await WeatherService.getCurrentWeather(
    currentLocation.coords.latitude,
    currentLocation.coords.longitude
  );

  for (const reminder of reminders) {
    if (shouldTriggerReminder(reminder, currentLocation, currentWeather)) {
      triggerNotification(reminder);
    }
  }
};

const shouldTriggerReminder = (
  reminder: Reminder,
  location: Location.LocationObject,
  weather: string
): boolean => {
  if (reminder.triggerType === 'time') {
    const now = new Date();
    const reminderTime = new Date(reminder.details.time);
    return now >= reminderTime;
  } else if (reminder.triggerType === 'location' && reminder.details.location) {
    const distance = calculateDistance(
      location.coords.latitude,
      location.coords.longitude,
      reminder.details.location.latitude,
      reminder.details.location.longitude
    );
    return distance <= reminder.details.location.radius;
  } else if (reminder.triggerType === 'condition' && reminder.details.condition) {
    return weather.toLowerCase() === reminder.details.condition.condition.toLowerCase();
  }
  return false;
};

const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  // Haversine formula implementation
  const R = 6371; // Radius of the Earth in km
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c; // Distance in km
  return distance * 1000; // Convert to meters
};

const deg2rad = (deg: number): number => {
  return deg * (Math.PI / 180);
};

const scheduleNotification = async (reminder: Reminder) => {
  if (reminder.triggerType === 'time') {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: reminder.title,
        body: reminder.category,
      },
      trigger: new Date(reminder.details.time),
      identifier: reminder.id,
    });
  }
};

const triggerNotification = async (reminder: Reminder) => {
  await Notifications.scheduleNotificationAsync({
    content: {
      title: reminder.title,
      body: reminder.category,
    },
    trigger: null,
  });
};

