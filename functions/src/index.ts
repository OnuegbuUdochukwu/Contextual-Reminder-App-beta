import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

admin.initializeApp();

interface ShareReminderData {
  reminder: {
    id: string;
    title: string;
    triggerType: 'time' | 'location' | 'condition';
    category: string;
    details: any; // You might want to define a more specific type for details
    isRecurring?: boolean;
    recurringInterval?: 'daily' | 'weekly' | 'monthly';
  };
  recipientEmail: string;
}

export const shareReminder = functions.https.onCall(
  async (request: functions.https.CallableRequest<ShareReminderData>, context: functions.https.CallableContext) => {
    if (!context.auth) {
      throw new functions.https.HttpsError(
        'unauthenticated',
        'User must be authenticated to share reminders.'
      );
    }

    const { reminder, recipientEmail } = request.data;

    try {
      // Check if the recipient user exists
      const recipientUser = await admin.auth().getUserByEmail(recipientEmail);

      // Add the shared reminder to the recipient's reminders collection
      await admin
        .firestore()
        .collection('users')
        .doc(recipientUser.uid)
        .collection('sharedReminders')
        .add({
          ...reminder,
          sharedBy: context.auth.uid,
          sharedAt: admin.firestore.FieldValue.serverTimestamp(),
        });

      // Send a notification to the recipient (you can implement this using Firebase Cloud Messaging)
      // For simplicity, we'll just log it here
      console.log(
        `Notification sent to ${recipientEmail} about shared reminder: ${reminder.title}`
      );

      return { success: true, message: 'Reminder shared successfully' };
    } catch (error) {
      console.error('Error sharing reminder:', error);
      throw new functions.https.HttpsError('internal', 'Failed to share reminder');
    }
  }
);
