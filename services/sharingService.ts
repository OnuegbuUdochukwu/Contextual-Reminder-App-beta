import { functions } from './firebase';
import { Reminder } from '../types';

export const shareReminder = async (reminder: Reminder, recipientEmail: string): Promise<void> => {
  try {
    const shareReminderFunction = functions.httpsCallable('shareReminder');
    await shareReminderFunction({ reminder, recipientEmail });
  } catch (error) {
    console.error('Error sharing reminder:', error);
    throw new Error('Failed to share reminder. Please try again.');
  }
};

