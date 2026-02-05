import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import koinosService, { KoinosService } from '../services/koinos';
import walletService from '../services/wallet';
import { showAlert } from '../utils/platform';

export default function SendScreen() {
  const navigation = useNavigation<any>();
  const [toAddress, setToAddress] = useState('');
  const [amount, setAmount] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [walletReady, setWalletReady] = useState(false);

  const [fromAddress, setFromAddress] = useState<string>('');

  // Ensure wallet is loaded when screen mounts
  React.useEffect(() => {
    const loadWallet = async () => {
      try {
        const info = await walletService.loadWallet();
        if (info.hasWallet) {
          setWalletReady(true);
          const signer = walletService.getSigner();
          if (signer) {
            const addr = signer.getAddress();
            setFromAddress(addr);
            console.log('SendScreen - Signer address:', addr);
            console.log('SendScreen - Stored address:', info.address);
          }
        } else {
          setError('No wallet found. Please create or import a wallet first.');
        }
      } catch (err: any) {
        setError('Failed to load wallet: ' + err.message);
      }
    };
    loadWallet();
  }, []);

  const validateInputs = (): boolean => {
    setError(null);

    if (!toAddress.trim()) {
      setError('Please enter a recipient address');
      return false;
    }

    if (!KoinosService.isValidAddress(toAddress.trim())) {
      setError('Invalid Koinos address format');
      return false;
    }

    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      setError('Please enter a valid amount');
      return false;
    }

    return true;
  };

  const executeSend = async () => {
    const signer = walletService.getSigner();
    if (!signer) {
      setError('Wallet not loaded. Please restart the app.');
      return;
    }

    setSending(true);
    setError(null);

    try {
      const result = await koinosService.sendKoin(
        signer,
        toAddress.trim(),
        amount
      );

      showAlert(
        'Success',
        `Transaction sent!\n\nTx ID: ${result.transactionId.substring(0, 20)}...`,
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch (err: any) {
      setError(err.message || 'Transaction failed');
      showAlert('Transaction Failed', err.message || 'Unknown error');
    } finally {
      setSending(false);
    }
  };

  const handleSend = async () => {
    if (!validateInputs()) return;

    const signer = walletService.getSigner();
    if (!signer) {
      setError('Wallet not loaded. Please restart the app.');
      return;
    }

    showAlert(
      'Confirm Transaction',
      `Send ${amount} KOIN to ${toAddress.substring(0, 16)}...?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Send', onPress: executeSend },
      ]
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Send KOIN</Text>

        {fromAddress && (
          <View style={styles.fromBox}>
            <Text style={styles.fromLabel}>From:</Text>
            <Text style={styles.fromAddress}>{fromAddress}</Text>
          </View>
        )}

        {error && (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Recipient Address</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter Koinos address"
            placeholderTextColor="#666"
            value={toAddress}
            onChangeText={setToAddress}
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Amount (KOIN)</Text>
          <TextInput
            style={styles.input}
            placeholder="0.00000000"
            placeholderTextColor="#666"
            value={amount}
            onChangeText={setAmount}
            keyboardType="decimal-pad"
          />
        </View>

        <View style={styles.info}>
          <Text style={styles.infoText}>
            Transaction will use your available mana (resource credits).
            Make sure you have enough mana to complete the transaction.
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.sendButton, (sending || !walletReady) && styles.sendButtonDisabled]}
          onPress={handleSend}
          disabled={sending || !walletReady}
          testID="send-button"
        >
          {sending ? (
            <ActivityIndicator color="#fff" />
          ) : !walletReady ? (
            <Text style={styles.sendButtonText}>Loading wallet...</Text>
          ) : (
            <Text style={styles.sendButtonText}>Send KOIN</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.cancelButton}
          onPress={() => navigation.goBack()}
          disabled={sending}
        >
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a2e',
  },
  content: {
    padding: 20,
    paddingTop: 60,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 30,
    textAlign: 'center',
  },
  fromBox: {
    backgroundColor: '#16213e',
    padding: 12,
    borderRadius: 12,
    marginBottom: 20,
  },
  fromLabel: {
    color: '#888',
    fontSize: 12,
    marginBottom: 4,
  },
  fromAddress: {
    color: '#4a9eff',
    fontSize: 11,
    fontFamily: 'monospace',
  },
  errorBox: {
    backgroundColor: '#3d1a1a',
    padding: 15,
    borderRadius: 12,
    marginBottom: 20,
  },
  errorText: {
    color: '#ff6b6b',
    fontSize: 14,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    color: '#888',
    fontSize: 14,
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#16213e',
    borderRadius: 12,
    padding: 16,
    color: '#fff',
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#0f3460',
  },
  info: {
    backgroundColor: '#16213e',
    padding: 15,
    borderRadius: 12,
    marginBottom: 30,
  },
  infoText: {
    color: '#888',
    fontSize: 13,
    lineHeight: 20,
  },
  sendButton: {
    backgroundColor: '#4a9eff',
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 15,
  },
  sendButtonDisabled: {
    opacity: 0.6,
  },
  sendButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  cancelButton: {
    padding: 15,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 16,
  },
});
