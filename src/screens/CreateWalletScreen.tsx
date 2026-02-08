import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import walletService from '../services/wallet';
import { showAlert } from '../utils/platform';

export default function CreateWalletScreen() {
  const navigation = useNavigation<any>();
  const [mnemonic, setMnemonic] = useState<string>('');
  const [address, setAddress] = useState<string>('');
  const [step, setStep] = useState<'generate' | 'backup' | 'confirm'>('generate');
  const [loading, setLoading] = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  const generateWallet = async () => {
    setLoading(true);
    try {
      const result = await walletService.generateWallet();
      setMnemonic(result.mnemonic);
      setAddress(result.address);
      setStep('backup');
    } catch (error: any) {
      showAlert('Error', error.message || 'Failed to generate wallet');
    } finally {
      setLoading(false);
    }
  };

  const confirmBackup = () => {
    showAlert(
      'Confirm Backup',
      'Have you written down your seed phrase and stored it safely? You will NOT be able to recover your wallet without it!',
      [
        { text: 'Go Back', style: 'cancel' },
        {
          text: 'Yes, I saved it',
          onPress: () => navigation.replace('Home'),
        },
      ]
    );
  };

  if (step === 'generate') {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Create New Wallet</Text>
        <Text style={styles.description}>
          We will generate a new wallet with a 12-word seed phrase.
          This phrase is the ONLY way to recover your wallet - keep it safe!
        </Text>

        <View style={styles.warning}>
          <Text style={styles.warningTitle}>Important</Text>
          <Text style={styles.warningText}>
            • Never share your seed phrase with anyone{'\n'}
            • Write it down on paper, don't store digitally{'\n'}
            • Anyone with your seed phrase can access your funds
          </Text>
        </View>

        <TouchableOpacity
          style={styles.primaryButton}
          onPress={generateWallet}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.primaryButtonText}>Generate Wallet</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.cancelButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Backup Your Seed Phrase</Text>
      <Text style={styles.description}>
        Write down these 12 words in order. This is your wallet backup.
      </Text>

      <View style={styles.mnemonicContainer}>
        {mnemonic.split(' ').map((word, index) => (
          <View key={index} style={styles.wordContainer}>
            <Text style={styles.wordNumber}>{index + 1}</Text>
            <Text style={styles.word}>{word}</Text>
          </View>
        ))}
      </View>

      <View style={styles.addressPreview}>
        <Text style={styles.addressLabel}>Your new address:</Text>
        <Text style={styles.addressText}>{address}</Text>
      </View>

      <View style={styles.warning}>
        <Text style={styles.warningText}>
          Make sure you have written down your seed phrase before continuing.
          You will NOT see it again!
        </Text>
      </View>

      <TouchableOpacity
        style={[styles.checkboxRow]}
        onPress={() => setConfirmed(!confirmed)}
      >
        <View style={[styles.checkbox, confirmed && styles.checkboxChecked]}>
          {confirmed && <Text style={styles.checkmark}>✓</Text>}
        </View>
        <Text style={styles.checkboxLabel}>
          I have written down my seed phrase
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.primaryButton, !confirmed && styles.primaryButtonDisabled]}
        onPress={() => navigation.replace('Home')}
        disabled={!confirmed}
      >
        <Text style={styles.primaryButtonText}>Continue to Wallet</Text>
      </TouchableOpacity>
    </ScrollView>
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
    marginBottom: 15,
    textAlign: 'center',
    marginTop: 60,
  },
  description: {
    fontSize: 18,
    color: '#888',
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 26,
    paddingHorizontal: 20,
  },
  warning: {
    backgroundColor: '#3d1a1a',
    padding: 15,
    borderRadius: 12,
    marginBottom: 20,
    marginHorizontal: 20,
  },
  warningTitle: {
    color: '#ff6b6b',
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 10,
  },
  warningText: {
    color: '#ff9999',
    fontSize: 18,
    lineHeight: 26,
  },
  mnemonicContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 10,
    marginBottom: 25,
    paddingHorizontal: 10,
  },
  wordContainer: {
    backgroundColor: '#16213e',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    minWidth: 100,
  },
  wordNumber: {
    color: '#4a9eff',
    fontSize: 16,
    marginRight: 8,
    fontWeight: '600',
  },
  word: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '500',
  },
  addressPreview: {
    backgroundColor: '#16213e',
    padding: 15,
    borderRadius: 12,
    marginBottom: 20,
  },
  addressLabel: {
    color: '#888',
    fontSize: 20,
    marginBottom: 5,
  },
  addressText: {
    color: '#fff',
    fontSize: 20,
    fontFamily: 'monospace',
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 15,
    backgroundColor: '#16213e',
    borderRadius: 12,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#4a9eff',
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#4a9eff',
  },
  checkmark: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  checkboxLabel: {
    color: '#fff',
    fontSize: 20,
    flex: 1,
  },
  primaryButton: {
    backgroundColor: '#4a9eff',
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
    marginHorizontal: 20,
  },
  primaryButtonDisabled: {
    backgroundColor: '#333',
    opacity: 0.6,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '600',
  },
  cancelButton: {
    padding: 15,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 20,
  },
});
