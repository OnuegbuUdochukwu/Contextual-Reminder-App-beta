import { getFirestore, collection, query, where, getDocs, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import * as Notifications from 'expo-notifications';
import * as Location from 'expo-location';
import WeatherService from './WeatherService';
import app from './firebase';
import { Reminder } from '../types';

const db = getFirestore(app);
const auth = getAuth(app);

export const loadReminders = async (): Promise<Reminder[]> => {
  const userId = auth.currentUser?.uid;
  if (!userId) return [];

  const remindersRef = collection(db, 'reminders');
  const q = query(remindersRef, where('userId', '==', userId));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Reminder));
};

export const saveReminder = async (reminder: Reminder): Promise<void> => {
  const userId = auth.currentUser?.uid;
  if (!userId) throw new Error('User not authenticated');

  await addDoc(collection(db, 'reminders'), {
    ...reminder,
    userId,
  });
  await scheduleNotification(reminder);
};

export const updateReminder = async (reminder: Reminder): Promise<void> => {
  const userId = auth.currentUser?.uid;
  if (!userId) throw new Error('User not authenticated');

  const reminderRef = doc(db, 'reminders', reminder.id);
  await updateDoc(reminderRef, reminder);
  await scheduleNotification(reminder);
};

export const deleteReminder = async (id: string): Promise<void> => {
  const userId = auth.currentUser?.uid;
  if (!userId) throw new Error('User not authenticated');

  const reminderRef = doc(db, 'reminders', id);
  await deleteDoc(reminderRef);
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
      await triggerNotification(reminder);
    }
  }
};

const shouldTriggerReminder = (
  reminder: Reminder,
  location: Location.LocationObject,
  weather: string
): boolean => {
  if (reminder.triggerType === 'time' && reminder.details.time) {
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

const scheduleNotification = async (reminder: Reminder): Promise<void> => {
  if (reminder.triggerType === 'time' && reminder.details.time) {
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

const triggerNotification = async (reminder: Reminder): Promise<void> => {
  await Notifications.scheduleNotificationAsync({
    content: {
      title: reminder.title,
      body: reminder.category,
    },
    trigger: null,
  });
};

