import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Modal, Portal, TextInput, Button, Text, HelperText } from 'react-native-paper';
import { Reminder } from '../types';
import { shareReminder } from '../services/sharingService';

type ShareModalProps = {
  visible: boolean;
  onDismiss: () => void;
  reminder: Reminder | null;
};

export default function ShareModal({ visible, onDismiss, reminder }: ShareModalProps) {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleShare = async () => {
    if (!reminder) return;

    setIsLoading(true);
    setError(null);

    try {
      await shareReminder(reminder, email);
      onDismiss();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Portal>
      <Modal visible={visible} onDismiss={onDismiss}>
        <View style={styles.modalContainer}>
          <Text style={styles.title}>Share Reminder</Text>
          <TextInput
            label="Recipient's Email"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            style={styles.input}
          />
          {error && <HelperText type="error">{error}</HelperText>}
          <Button 
            mode="contained" 
            onPress={handleShare} 
            style={styles.button}
            loading={isLoading}
            disabled={isLoading || !email}
          >
            Share
          </Button>
          <Button mode="outlined" onPress={onDismiss} style={styles.button}>
            Cancel
          </Button>
        </View>
      </Modal>
    </Portal>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    backgroundColor: 'white',
    padding: 20,
    margin: 20,
    borderRadius: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  input: {
    marginBottom: 16,
  },
  button: {
    marginTop: 8,
  },
});

