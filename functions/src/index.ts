// import * as functions from 'firebase-functions';
// import * as admin from 'firebase-admin';

// admin.initializeApp();

// interface ShareReminderData {
//   reminder: {
//     id: string;
//     title: string;
//     triggerType: 'time' | 'location' | 'condition';
//     category: string;
//     details: any; // You might want to define a more specific type for details
//     isRecurring?: boolean;
//     recurringInterval?: 'daily' | 'weekly' | 'monthly';
//   };
//   recipientEmail: string;
// }

// export const shareReminder = functions.https.onCall(async (data: ShareReminderData, context: functions.https.CallableContext) => {
//   if (!context.auth) {
//     throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated to share reminders.');
//   }

//   const { reminder, recipientEmail } = data;

//   try {
//     // Check if the recipient user exists
//     const recipientUser = await admin.auth().getUserByEmail(recipientEmail);

//     // Add the shared reminder to the recipient's reminders collection
//     await admin.firestore().collection('users').doc(recipientUser.uid).collection('sharedReminders').add({
//       ...reminder,
//       sharedBy: context.auth.uid,
//       sharedAt: admin.firestore.FieldValue.serverTimestamp(),
//     });

//     // Send a notification to the recipient (you can implement this using Firebase Cloud Messaging)
//     // For simplicity, we'll just log it here
//     console.log(`Notification sent to ${recipientEmail} about shared reminder: ${reminder.title}`);


//     return { success: true, message: 'Reminder shared successfully' };
//   } catch (error) {
//     console.error('Error sharing reminder:', error);
//     throw new functions.https.HttpsError('internal', 'Failed to share reminder');
//   }
// });

import * as functions from 'firebase-functions';
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

export const shareReminder = functions.https.onCall(async (data: ShareReminderData, context: functions.https.CallableContext) => {
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

// Additional Cloud Functions

export const createUser = functions.auth.user().onCreate(async (user) => {
  try {
    await admin.firestore().collection('users').doc(user.uid).set({
      email: user.email,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    console.log(`New user account created for ${user.email}`);
  } catch (error) {
    console.error('Error creating user document:', error);
  }
});

export const deleteUser = functions.auth.user().onDelete(async (user) => {
  try {
    await admin.firestore().collection('users').doc(user.uid).delete();
    console.log(`User account and associated data deleted for ${user.email}`);
  } catch (error) {
    console.error('Error deleting user document:', error);
  }
});

export const scheduledReminderCheck = functions.pubsub.schedule('every 15 minutes').onRun(async (context) => {
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
  return null;
});

