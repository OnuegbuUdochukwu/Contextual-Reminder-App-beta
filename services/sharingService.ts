import { getFunctions, httpsCallable } from 'firebase/functions';
import app from './firebase';
import { Reminder } from '../types';

const functions = getFunctions(app);

export const shareReminder = async (reminder: Reminder, recipientEmail: string): Promise<void> => {
  try {
    const shareReminderFunction = httpsCallable(functions, 'shareReminder');
    await shareReminderFunction({ reminder, recipientEmail });
  } catch (error) {
    console.error('Error sharing reminder:', error);
    throw new Error('Failed to share reminder. Please try again.');
  }
};

