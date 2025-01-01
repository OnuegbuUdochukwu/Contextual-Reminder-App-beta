import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

admin.initializeApp();

export const shareReminder = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated to share reminders.');
  }

  const { reminder, recipientEmail } = data;

  try {
    // Check if the recipient user exists
    const recipientUser = await admin.auth().getUserByEmail(recipientEmail);

    // Add the shared reminder to the recipient's reminders collection
    await admin.firestore().collection('users').doc(recipientUser.uid).collection('sharedReminders').add({
      ...reminder,
      sharedBy: context.auth.uid,
      sharedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    // Send a notification to the recipient (you can implement this using Firebase Cloud Messaging)
    // For simplicity, we'll just log it here
    console.log(`Notification sent to ${recipientEmail} about shared reminder: ${reminder.title}`);

    return { success: true, message: 'Reminder shared successfully' };
  } catch (error) {
    console.error('Error sharing reminder:', error);
    throw new functions.https.HttpsError('internal', 'Failed to share reminder');
  }
});

