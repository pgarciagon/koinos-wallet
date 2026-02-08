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
import walletService from '../services/wallet';
import { showAlert } from '../utils/platform';

type ImportMethod = 'mnemonic' | 'wif';

export default function ImportWalletScreen() {
  const navigation = useNavigation<any>();
  const [method, setMethod] = useState<ImportMethod>('mnemonic');
  const [mnemonic, setMnemonic] = useState('');
  const [wif, setWif] = useState('');
  const [loading, setLoading] = useState(false);

  const handleImport = async () => {
    setLoading(true);
    try {
      let address: string;

      if (method === 'mnemonic') {
        const words = mnemonic.trim().toLowerCase().split(/\s+/);
        if (words.length !== 12 && words.length !== 24) {
          throw new Error('Seed phrase must be 12 or 24 words');
        }
        address = await walletService.importFromMnemonic(words.join(' '));
      } else {
        if (!wif.trim()) {
          throw new Error('Please enter a WIF private key');
        }
        address = await walletService.importFromWIF(wif.trim());
      }

      showAlert(
        'Wallet Imported',
        `Your wallet has been imported successfully.\n\nAddress: ${address.substring(0, 16)}...`,
        [
          {
            text: 'Continue',
            onPress: () => navigation.replace('Home'),
          },
        ]
      );
    } catch (error: any) {
      showAlert('Import Failed', error.message || 'Failed to import wallet');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Import Wallet</Text>

        <View style={styles.methodSelector}>
          <TouchableOpacity
            style={[styles.methodButton, method === 'mnemonic' && styles.methodButtonActive]}
            onPress={() => setMethod('mnemonic')}
          >
            <Text
              style={[styles.methodButtonText, method === 'mnemonic' && styles.methodButtonTextActive]}
            >
              Seed Phrase
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.methodButton, method === 'wif' && styles.methodButtonActive]}
            onPress={() => setMethod('wif')}
          >
            <Text
              style={[styles.methodButtonText, method === 'wif' && styles.methodButtonTextActive]}
            >
              Private Key (WIF)
            </Text>
          </TouchableOpacity>
        </View>

        {method === 'mnemonic' ? (
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Enter your 12 or 24 word seed phrase</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="word1 word2 word3 ..."
              placeholderTextColor="#666"
              value={mnemonic}
              onChangeText={setMnemonic}
              autoCapitalize="none"
              autoCorrect={false}
              multiline
              numberOfLines={4}
            />
            <Text style={styles.hint}>
              Separate words with spaces. This wallet uses Kondor-compatible derivation (BIP-44 m/44'/60'/0'/0/0).
            </Text>
          </View>
        ) : (
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Enter your WIF private key</Text>
            <TextInput
              style={styles.input}
              placeholder="5..."
              placeholderTextColor="#666"
              value={wif}
              onChangeText={setWif}
              autoCapitalize="none"
              autoCorrect={false}
              secureTextEntry
            />
            <Text style={styles.hint}>
              WIF (Wallet Import Format) keys typically start with '5' or 'K'/'L'.
            </Text>
          </View>
        )}

        <View style={styles.warning}>
          <Text style={styles.warningText}>
            Never enter your seed phrase or private key on untrusted devices or websites.
            Make sure no one is watching your screen.
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.primaryButton, loading && styles.primaryButtonDisabled]}
          onPress={handleImport}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.primaryButtonText}>Import Wallet</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.cancelButton}
          onPress={() => navigation.goBack()}
          disabled={loading}
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
  methodSelector: {
    flexDirection: 'row',
    backgroundColor: '#16213e',
    borderRadius: 12,
    padding: 4,
    marginBottom: 25,
  },
  methodButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 10,
  },
  methodButtonActive: {
    backgroundColor: '#4a9eff',
  },
  methodButtonText: {
    color: '#888',
    fontSize: 20,
    fontWeight: '500',
  },
  methodButtonTextActive: {
    color: '#fff',
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    color: '#888',
    fontSize: 20,
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#16213e',
    borderRadius: 12,
    padding: 16,
    color: '#fff',
    fontSize: 20,
    borderWidth: 1,
    borderColor: '#0f3460',
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  hint: {
    color: '#666',
    fontSize: 18,
    marginTop: 8,
    lineHeight: 24,
  },
  warning: {
    backgroundColor: '#3d1a1a',
    padding: 15,
    borderRadius: 12,
    marginBottom: 25,
  },
  warningText: {
    color: '#ff9999',
    fontSize: 18,
    lineHeight: 26,
  },
  primaryButton: {
    backgroundColor: '#4a9eff',
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 15,
  },
  primaryButtonDisabled: {
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
