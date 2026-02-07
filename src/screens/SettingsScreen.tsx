import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Modal,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import koinosService from '../services/koinos';
import walletService from '../services/wallet';
import { showAlert, copyToClipboard } from '../utils/platform';
import { APP_VERSION, CHANGELOG } from '../data/changelog';

export default function SettingsScreen() {
  const navigation = useNavigation<any>();
  const [rpcUrl, setRpcUrl] = useState('');
  const [saving, setSaving] = useState(false);
  const [showSeedPhrase, setShowSeedPhrase] = useState(false);
  const [seedPhrase, setSeedPhrase] = useState<string | null>(null);
  const [showChangelog, setShowChangelog] = useState(false);
  const [showPrivateKey, setShowPrivateKey] = useState(false);
  const [privateKey, setPrivateKey] = useState<string | null>(null);

  useEffect(() => {
    const loadRpc = async () => {
      const current = await koinosService.getRpcUrl();
      setRpcUrl(current);
    };
    loadRpc();
  }, []);

  const handleSaveRpc = async () => {
    if (!rpcUrl.trim()) {
      showAlert('Invalid URL', 'Please enter a valid RPC URL.');
      return;
    }

    setSaving(true);
    try {
      await koinosService.setRpcUrl(rpcUrl.trim());
      showAlert('Saved', 'RPC endpoint updated successfully.');
    } catch (error: any) {
      showAlert('Error', error.message || 'Failed to update RPC endpoint.');
    } finally {
      setSaving(false);
    }
  };

  const handleViewSeedPhrase = async () => {
    showAlert(
      'Security Warning',
      'Your seed phrase gives full access to your wallet. Never share it with anyone!\n\nMake sure no one is watching your screen.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Show Seed Phrase',
          onPress: async () => {
            const phrase = await walletService.getSeedPhrase();
            if (phrase) {
              setSeedPhrase(phrase);
              setShowSeedPhrase(true);
            } else {
              showAlert(
                'Not Available',
                'Seed phrase is not available. This wallet was imported using a private key (WIF).'
              );
            }
          },
        },
      ]
    );
  };

  const handleCopySeedPhrase = async () => {
    if (seedPhrase) {
      const success = await copyToClipboard(seedPhrase);
      if (success) {
        showAlert('Copied', 'Seed phrase copied to clipboard. Make sure to clear your clipboard after use!');
      }
    }
  };

  const handleViewPrivateKey = () => {
    showAlert(
      'Security Warning',
      'Your private key gives full access to your wallet. Never share it with anyone!\n\nMake sure no one is watching your screen.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Show Private Key',
          onPress: () => {
            const key = walletService.getPrivateKey();
            if (key) {
              setPrivateKey(key);
              setShowPrivateKey(true);
            } else {
              showAlert('Not Available', 'Wallet is not loaded.');
            }
          },
        },
      ]
    );
  };

  const handleCopyPrivateKey = async () => {
    if (privateKey) {
      const success = await copyToClipboard(privateKey);
      if (success) {
        showAlert('Copied', 'Private key copied to clipboard. Make sure to clear your clipboard after use!');
      }
    }
  };

  const handleDeleteWallet = () => {
    showAlert(
      'Delete Wallet?',
      'Are you sure? Make sure you have backed up your seed phrase! This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await walletService.deleteWallet();
            navigation.replace('Welcome');
          },
        },
      ]
    );
  };

  return (
  <View style={styles.container}>
    <ScrollView contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Settings</Text>
        <View style={styles.placeholder} />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>RPC Endpoint</Text>
        <Text style={styles.sectionDescription}>
          Configure the API endpoint used for blockchain queries and transactions.
        </Text>
        <TextInput
          style={styles.input}
          value={rpcUrl}
          onChangeText={setRpcUrl}
          placeholder="https://api.koinos.io"
          placeholderTextColor="#666"
          autoCapitalize="none"
          autoCorrect={false}
        />
        <TouchableOpacity
          style={[styles.saveButton, saving && styles.saveButtonDisabled]}
          onPress={handleSaveRpc}
          disabled={saving}
        >
          <Text style={styles.saveButtonText}>{saving ? 'Saving...' : 'Save RPC URL'}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Security</Text>
        <TouchableOpacity style={styles.secondaryButton} onPress={handleViewSeedPhrase}>
          <Text style={styles.secondaryButtonText}>View Seed Phrase</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.secondaryButton} onPress={handleViewPrivateKey}>
          <Text style={styles.secondaryButtonText}>View Private Key</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.deleteButton} onPress={handleDeleteWallet}>
          <Text style={styles.deleteButtonText}>Delete Wallet</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>About</Text>
        <TouchableOpacity style={styles.secondaryButton} onPress={() => setShowChangelog(true)}>
          <Text style={styles.secondaryButtonText}>Changelog</Text>
        </TouchableOpacity>
      </View>

      <Modal
        visible={showChangelog}
        animationType="slide"
        transparent
        onRequestClose={() => setShowChangelog(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Changelog</Text>
            <ScrollView style={styles.changelogScroll}>
              {CHANGELOG.map((entry) => (
                <View key={entry.version} style={styles.changelogEntry}>
                  <Text style={styles.changelogVersion}>v{entry.version}</Text>
                  <Text style={styles.changelogDate}>{entry.date}</Text>
                  {entry.changes.map((change, i) => (
                    <Text key={i} style={styles.changelogItem}>
                      {'\u2022'} {change}
                    </Text>
                  ))}
                </View>
              ))}
            </ScrollView>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowChangelog(false)}
            >
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal
        visible={showSeedPhrase}
        animationType="slide"
        transparent
        onRequestClose={() => {
          setSeedPhrase(null);
          setShowSeedPhrase(false);
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Your Seed Phrase</Text>

            <View style={styles.warningBox}>
              <Text style={styles.warningText}>
                Never share this phrase with anyone! Anyone with these words can access your funds.
              </Text>
            </View>

            <View style={styles.seedPhraseContainer}>
              {seedPhrase?.split(' ').map((word, index) => (
                <View key={index} style={styles.wordContainer}>
                  <Text style={styles.wordNumber}>{index + 1}</Text>
                  <Text style={styles.word}>{word}</Text>
                </View>
              ))}
            </View>

            <TouchableOpacity style={styles.copyButton} onPress={handleCopySeedPhrase}>
              <Text style={styles.copyButtonText}>Copy to Clipboard</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => {
                setSeedPhrase(null);
                setShowSeedPhrase(false);
              }}
            >
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal
        visible={showPrivateKey}
        animationType="slide"
        transparent
        onRequestClose={() => {
          setPrivateKey(null);
          setShowPrivateKey(false);
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Your Private Key (WIF)</Text>

            <View style={styles.warningBox}>
              <Text style={styles.warningText}>
                Never share this key with anyone! Anyone with this key can access your funds.
              </Text>
            </View>

            <View style={styles.privateKeyContainer}>
              <Text style={styles.privateKeyText} selectable>{privateKey}</Text>
            </View>

            <TouchableOpacity style={styles.copyButton} onPress={handleCopyPrivateKey}>
              <Text style={styles.copyButtonText}>Copy to Clipboard</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => {
                setPrivateKey(null);
                setShowPrivateKey(false);
              }}
            >
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

    </ScrollView>
    <Text style={styles.versionText}>Koinos Wallet v{APP_VERSION}</Text>
  </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a2e',
  },
  content: {
    padding: 20,
    paddingTop: 50,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 30,
  },
  backButton: {
    padding: 8,
  },
  backText: {
    color: '#4a9eff',
    fontSize: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
  },
  placeholder: {
    width: 60,
  },
  section: {
    backgroundColor: '#16213e',
    borderRadius: 12,
    padding: 18,
    marginBottom: 20,
  },
  sectionTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 6,
  },
  sectionDescription: {
    color: '#888',
    fontSize: 18,
    marginBottom: 12,
    lineHeight: 24,
  },
  input: {
    backgroundColor: '#0f3460',
    borderRadius: 10,
    padding: 14,
    color: '#fff',
    fontSize: 20,
    borderWidth: 1,
    borderColor: '#0f3460',
    marginBottom: 12,
  },
  saveButton: {
    backgroundColor: '#4a9eff',
    padding: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '600',
  },
  secondaryButton: {
    backgroundColor: '#1a1a2e',
    padding: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 8,
  },
  secondaryButtonText: {
    color: '#4a9eff',
    fontSize: 20,
    fontWeight: '600',
  },
  deleteButton: {
    backgroundColor: '#2b1b1b',
    padding: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 10,
  },
  deleteButtonText: {
    color: '#ff6b6b',
    fontSize: 20,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#1a1a2e',
    borderRadius: 16,
    padding: 20,
    width: '100%',
    maxHeight: '80%',
  },
  modalTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 15,
  },
  warningBox: {
    backgroundColor: '#3d1a1a',
    padding: 12,
    borderRadius: 10,
    marginBottom: 15,
  },
  warningText: {
    color: '#ff9999',
    fontSize: 18,
    lineHeight: 24,
  },
  seedPhraseContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'center',
    marginBottom: 20,
  },
  wordContainer: {
    backgroundColor: '#16213e',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 6,
    flexDirection: 'row',
    alignItems: 'center',
  },
  wordNumber: {
    color: '#4a9eff',
    fontSize: 16,
    marginRight: 6,
    fontWeight: '600',
  },
  word: {
    color: '#fff',
    fontSize: 16,
  },
  copyButton: {
    backgroundColor: '#4a9eff',
    padding: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 10,
  },
  copyButtonText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '600',
  },
  closeButton: {
    backgroundColor: '#16213e',
    padding: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  closeButtonText: {
    color: '#888',
    fontSize: 20,
    fontWeight: '600',
  },
  versionText: {
    color: '#666',
    fontSize: 14,
    textAlign: 'center',
    paddingVertical: 12,
    backgroundColor: '#1a1a2e',
  },
  changelogScroll: {
    maxHeight: 400,
    marginBottom: 15,
  },
  changelogEntry: {
    marginBottom: 20,
  },
  changelogVersion: {
    color: '#4a9eff',
    fontSize: 18,
    fontWeight: '700',
  },
  changelogDate: {
    color: '#888',
    fontSize: 14,
    marginBottom: 8,
  },
  changelogItem: {
    color: '#ccc',
    fontSize: 16,
    lineHeight: 24,
    paddingLeft: 8,
  },
  privateKeyContainer: {
    backgroundColor: '#16213e',
    padding: 14,
    borderRadius: 10,
    marginBottom: 20,
  },
  privateKeyText: {
    color: '#fff',
    fontSize: 14,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    lineHeight: 22,
  },
});
