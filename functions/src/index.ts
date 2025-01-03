import { onCall, HttpsError } from "firebase-functions/v2/https";
import { onSchedule } from "firebase-functions/v2/scheduler";
import { onDocumentCreated, onDocumentDeleted } from "firebase-functions/v2/firestore";
import * as admin from 'firebase-admin';

admin.initializeApp();

interface ShareReminderData {
  reminder: {
    id: string;
    title: string;
    triggerType: 'time' | 'location' | 'condition';
    category: string;
    details: {
      time?: string;
      location?: {
        latitude: number;
        longitude: number;
        radius: number;
      };
      condition?: {
        type: 'weather';
        condition: string;
      };
    };
    isRecurring?: boolean;
    recurringInterval?: 'daily' | 'weekly' | 'monthly';
  };
  recipientEmail: string;
}

export const shareReminder = onCall<ShareReminderData>(async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'User must be authenticated to share reminders.');
  }

  const { reminder, recipientEmail } = request.data;

  try {
    // Check if the recipient user exists
    const recipientUser = await admin.auth().getUserByEmail(recipientEmail);

    // Add the shared reminder to the recipient's reminders collection
    await admin.firestore().collection('users').doc(recipientUser.uid).collection('sharedReminders').add({
      ...reminder,
      sharedBy: request.auth.uid,
      sharedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    // Send a notification to the recipient (you can implement this using Firebase Cloud Messaging)
    // For simplicity, we'll just log it here
    console.log(`Notification sent to ${recipientEmail} about shared reminder: ${reminder.title}`);

    return { success: true, message: 'Reminder shared successfully' };
  } catch (error) {
    console.error('Error sharing reminder:', error);
    throw new HttpsError('internal', 'Failed to share reminder');
  }
});

export const createUser = onDocumentCreated('users/{userId}', async (event) => {
  const user = event.data?.data();
  if (user) {
    console.log(`New user account created for ${user.email}`);
  }
});

export const deleteUser = onDocumentDeleted('users/{userId}', async (event) => {
  const userId = event.params.userId;
  console.log(`User account and associated data deleted for user ID: ${userId}`);
});

export const scheduledReminderCheck = onSchedule('every 15 minutes', async (event) => {
  const now = admin.firestore.Timestamp.now();
  const remindersSnapshot = await admin.firestore().collectionGroup('reminders')
    .where('triggerType', '==', 'time')
    .where('details.time', '<=', now)
    .where('notified', '==', false)
    .get();

  const batch = admin.firestore().batch();

  remindersSnapshot.docs.forEach((doc) => {
    batch.update(doc.ref, { notified: true });
    // Here you would typically send a notification to the user
    console.log(`Reminder triggered: ${doc.data().title}`);
  });

  await batch.commit();
  console.log(`Checked ${remindersSnapshot.size} reminders`);
});

